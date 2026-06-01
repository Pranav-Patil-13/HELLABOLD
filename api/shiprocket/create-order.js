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
      error: 'Shiprocket credentials not configured on the server.'
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
      console.error('[Shiprocket] Auth failed:', authData);
      return res.status(502).json({ error: 'Shiprocket authentication failed', details: authData });
    }
    token = authData.token;
  } catch (err) {
    console.error('[Shiprocket] Auth network error:', err);
    return res.status(502).json({ error: 'Could not reach Shiprocket API for auth', details: err.message });
  }

  // ── Step 2: Parse the incoming order from the frontend ─────────────────────
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
    shipping,
    total
  } = req.body;

  // ── Step 3: Build Shiprocket order payload ─────────────────────────────────
  // Weight: 0.5 kg per item (configurable constant)
  const WEIGHT_PER_ITEM_KG = 0.5;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalWeight = parseFloat((totalQuantity * WEIGHT_PER_ITEM_KG).toFixed(2));

  // Map cart items to Shiprocket order_items format
  const orderItems = items.map((item) => {
    const unitPrice = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
    return {
      name: `${item.title} (Size: ${item.size})`,
      sku: `HB-${item.id}-${item.size}`,
      units: item.quantity || 1,
      selling_price: unitPrice,
      discount: 0,
      tax: 0,
      hsn: 61091000 // HSN code for knitted t-shirts (standard)
    };
  });

  // Shiprocket requires dimensions in cm; standard t-shirt packaging
  const dimensions = { length: 30, breadth: 25, height: 5 };

  const shiprocketPayload = {
    order_id: orderId,
    order_date: orderDate,
    pickup_location: 'Primary',

    // Billing (same as shipping for D2C)
    billing_customer_name: customerName,
    billing_last_name: '',
    billing_address: address,
    billing_address_2: '',
    billing_city: city,
    billing_pincode: pincode,
    billing_state: state,
    billing_country: country || 'India',
    billing_email: customerEmail,
    billing_phone: phone,

    // Shipping (ship to billing address)
    shipping_is_billing: true,

    order_items: orderItems,
    payment_method: paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    shipping_charges: shipping || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: discount || 0,
    sub_total: subTotal,
    length: dimensions.length,
    breadth: dimensions.breadth,
    height: dimensions.height,
    weight: totalWeight,
    ...(channelId > 0 && { channel_id: channelId })
  };

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
      console.error('[Shiprocket] Order creation failed:', createData);
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
  // Shiprocket assigns AWB after courier assignment. We auto-assign using Shiprocket's recommendation.
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
        console.warn('[Shiprocket] AWB assignment response:', awbData);
        // AWB may be assigned asynchronously; order still created successfully
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
    status: shiprocketOrder.status,
    raw: shiprocketOrder
  });
}
