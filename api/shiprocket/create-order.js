// api/shiprocket/create-order.js
// Vercel Serverless Function — creates a Shiprocket order and returns the AWB number.
// Flow: authenticate → create order → auto-assign AWB courier

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Step 1: Authenticate with Shiprocket ───────────────────────────────────
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const channelId = parseInt(process.env.SHIPROCKET_CHANNEL_ID || '0', 10);

  if (!email || !password) {
    return res.status(500).json({
      error: 'Shiprocket credentials not configured on the server. Add SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, SHIPROCKET_CHANNEL_ID to Vercel Environment Variables.'
    });
  }

  let token;
  try {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const authData = await authRes.json();
    if (!authRes.ok || !authData.token) {
      console.error('[Shiprocket] Auth failed:', JSON.stringify(authData));
      return res.status(502).json({ error: 'Shiprocket authentication failed', details: authData });
    }
    token = authData.token;
  } catch (err) {
    console.error('[Shiprocket] Auth network error:', err);
    return res.status(502).json({ error: 'Could not reach Shiprocket API for auth', details: err.message });
  }

  // ── Step 2: Parse the request body ────────────────────────────────────────
  // Vercel does NOT auto-parse JSON — we must do it manually.
  let body;
  try {
    if (typeof req.body === 'object' && req.body !== null) {
      // Body already parsed (e.g. by Vercel's built-in parser for some runtimes)
      body = req.body;
    } else {
      // Collect raw buffer and parse
      const rawBody = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      body = JSON.parse(rawBody);
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body', details: err.message });
  }

  const {
    orderId,
    orderDate,
    customerName,
    email: customerEmail,
    phone,
    address,
    city,
    state,
    pincode,
    country,
    items,
    paymentMethod,
    subTotal,
    discount,
    shipping
  } = body;

  // ── Step 2b: Validate required fields ─────────────────────────────────────
  const missingFields = [];
  if (!orderId) missingFields.push('orderId');
  if (!customerName) missingFields.push('customerName');
  if (!phone) missingFields.push('phone');
  if (!address) missingFields.push('address');
  if (!city) missingFields.push('city');
  if (!state) missingFields.push('state');
  if (!pincode) missingFields.push('pincode');
  if (!items || !items.length) missingFields.push('items');
  if (subTotal === undefined) missingFields.push('subTotal');

  if (missingFields.length > 0) {
    console.error('[Shiprocket] Missing required fields:', missingFields);
    return res.status(400).json({
      error: 'Missing required fields in order payload',
      missingFields
    });
  }

  // ── Step 3: Build Shiprocket order payload ─────────────────────────────────
  const WEIGHT_PER_ITEM_KG = 0.5;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalWeight = parseFloat((totalQuantity * WEIGHT_PER_ITEM_KG).toFixed(2));

  const orderItems = items.map((item) => {
    const unitPrice = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
    return {
      name: `${item.title} (Size: ${item.size})`,
      sku: `HB-${item.id}-${item.size}`,
      units: item.quantity || 1,
      selling_price: unitPrice,
      discount: 0,
      tax: 0,
      hsn: 61091000 // HSN code for knitted t-shirts
    };
  });

  const shiprocketPayload = {
    order_id: orderId,
    order_date: orderDate,
    pickup_location: 'Primary',

    billing_customer_name: customerName,
    billing_last_name: '',
    billing_address: address,
    billing_address_2: '',
    billing_city: city,
    billing_pincode: String(pincode),
    billing_state: state,
    billing_country: country || 'India',
    billing_email: customerEmail || '',
    billing_phone: String(phone).replace(/\D/g, '').slice(-10),

    shipping_is_billing: true,

    order_items: orderItems,
    payment_method: paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    shipping_charges: Number(shipping) || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Number(discount) || 0,
    sub_total: Number(subTotal),
    length: 30,
    breadth: 25,
    height: 5,
    weight: totalWeight,
    ...(channelId > 0 && { channel_id: channelId })
  };

  console.log('[Shiprocket] Creating order with payload:', JSON.stringify(shiprocketPayload));

  // ── Step 4: Create the order in Shiprocket ─────────────────────────────────
  let shiprocketOrder;
  try {
    const createRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(shiprocketPayload)
    });
    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error('[Shiprocket] Order creation failed. Status:', createRes.status, 'Response:', JSON.stringify(createData));
      return res.status(createRes.status).json({
        error: 'Shiprocket order creation failed',
        details: createData
      });
    }
    shiprocketOrder = createData;
  } catch (err) {
    console.error('[Shiprocket] Order creation network error:', err);
    return res.status(502).json({ error: 'Could not reach Shiprocket API for order creation', details: err.message });
  }

  // ── Step 5: Auto-assign courier to get AWB ─────────────────────────────────
  const shiprocketOrderId = shiprocketOrder.order_id;
  const shipmentId = shiprocketOrder.shipment_id;

  let awb = null;
  let courierName = 'Shiprocket';

  if (shipmentId) {
    try {
      const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id: shipmentId })
      });
      const awbData = await awbRes.json();

      if (awbRes.ok && awbData.response && awbData.response.data) {
        awb = awbData.response.data.awb_code;
        courierName = awbData.response.data.courier_name || 'Shiprocket';
        console.log(`[Shiprocket] AWB assigned: ${awb} via ${courierName}`);
      } else {
        console.warn('[Shiprocket] AWB assignment response:', JSON.stringify(awbData));
        awb = `PENDING-${shipmentId}`;
      }
    } catch (err) {
      console.warn('[Shiprocket] AWB assignment failed (order still created):', err.message);
      awb = `PENDING-${shipmentId}`;
    }
  }

  // ── Step 6: Return success ─────────────────────────────────────────────────
  return res.status(200).json({
    shiprocketOrderId,
    shipmentId,
    awb: awb || `SR-${shiprocketOrderId}`,
    courier: courierName,
    status: shiprocketOrder.status
  });
}
