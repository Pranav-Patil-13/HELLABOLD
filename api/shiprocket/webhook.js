// api/shiprocket/webhook.js
// Vercel Serverless Function — receives real-time tracking updates from Shiprocket
// and updates the order status in Supabase.

export default async function handler(req, res) {
  // Shiprocket webhooks are sent as POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel webhook body parsing
  let payload;
  try {
    if (typeof req.body === 'object' && req.body !== null) {
      payload = req.body;
    } else {
      const rawBody = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      payload = JSON.parse(rawBody);
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.log('[Shiprocket Webhook] Received payload:', JSON.stringify(payload));

  const {
    channel_order_id, // e.g. "HB-12345"
    awb,
    current_status,
    shipment_status,
    shipment_status_id
  } = payload;

  if (!channel_order_id && !awb) {
    return res.status(400).json({ error: 'Missing channel_order_id and awb' });
  }

  // ── 1. Map Shiprocket Status to HELLABOLD Status ──────────────────────────
  // Shiprocket statuses: PICKED UP, IN TRANSIT, OUT FOR DELIVERY, DELIVERED, RTO INITIATED, RETURNED, etc.
  const rawStatus = (current_status || shipment_status || '').toUpperCase();
  let mappedStatus = null;

  if (rawStatus === 'NEW' || rawStatus === 'MANIFESTED') {
    mappedStatus = 'Order Received';
  } else if (rawStatus === 'PICKED UP') {
    mappedStatus = 'Manifested & Picked Up';
  } else if (rawStatus === 'IN TRANSIT' || rawStatus === 'SHIPPED') {
    mappedStatus = 'In Transit';
  } else if (rawStatus === 'OUT FOR DELIVERY') {
    mappedStatus = 'Out for Delivery';
  } else if (rawStatus === 'DELIVERED') {
    mappedStatus = 'Delivered';
  } else if (rawStatus.includes('RTO') || rawStatus === 'RETURNED' || rawStatus === 'CANCELED') {
    mappedStatus = 'Canceled / RTO';
  }

  // If we don't have a mapped status, we can still log it but maybe we don't update the DB
  // to avoid overwriting with an unrecognized state.
  if (!mappedStatus) {
    console.log(`[Shiprocket Webhook] Unmapped status: "${rawStatus}". Ignoring.`);
    return res.status(200).json({ message: 'Ignored unrecognized status' });
  }

  // ── 2. Update Supabase Database ───────────────────────────────────────────
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  // Use Service Role Key if available (bypasses RLS), fallback to Anon Key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Shiprocket Webhook] Supabase credentials missing in env.');
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  try {
    // We update the order matching the channel_order_id (our order.id) OR the awb
    let queryParams = `id=eq.${channel_order_id}`;
    if (!channel_order_id) {
      queryParams = `awb=eq.${awb}`;
    }

    const dbRes = await fetch(`${supabaseUrl}/rest/v1/orders?${queryParams}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status: mappedStatus })
    });

    const dbData = await dbRes.json();

    if (!dbRes.ok) {
      console.error('[Shiprocket Webhook] Supabase update failed:', dbData);
      return res.status(502).json({ error: 'Database update failed', details: dbData });
    }

    console.log(`[Shiprocket Webhook] ✅ Order ${channel_order_id || awb} updated to: ${mappedStatus}`);
    return res.status(200).json({ success: true, updatedStatus: mappedStatus });

  } catch (error) {
    console.error('[Shiprocket Webhook] Network error reaching Supabase:', error);
    return res.status(502).json({ error: 'Could not reach database', details: error.message });
  }
}
