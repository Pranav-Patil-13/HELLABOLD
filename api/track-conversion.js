import crypto from 'crypto';

function hashVal(val) {
  if (!val) return undefined;
  const clean = String(val).trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
}

function hashPhone(val) {
  if (!val) return undefined;
  const clean = String(val).replace(/\D/g, ''); // digits only
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.error('[CAPI Error] Meta configuration is missing in server environment.');
    res.status(500).json({ error: 'Meta Pixel ID or Access Token is not configured.' });
    return;
  }

  try {
    const {
      eventName,
      eventId,
      eventTime,
      eventSourceUrl,
      customData = {},
      userData = {},
      testEventCode
    } = req.body;

    if (!eventName || !eventId) {
      res.status(400).json({ error: 'Missing required fields eventName or eventId.' });
      return;
    }

    // Capture IP and User Agent from headers
    const rawIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
    // Format IP (if list, grab first)
    const ip = rawIp.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';

    // Extract names from fullName if present
    let fn = userData.firstName || userData.fn || '';
    let ln = userData.lastName || userData.ln || '';
    if (!fn && userData.fullName) {
      const parts = String(userData.fullName).trim().split(/\s+/);
      fn = parts[0];
      if (parts.length > 1) {
        ln = parts.slice(1).join(' ');
      }
    }

    // Formulate custom_data, user_data and options based on event requirements
    let userDataObj = {};
    let customDataObj = {};
    let dataProcessingOptionsObj = {};

    const formattedTime = eventTime || Math.floor(Date.now() / 1000);
    const formattedUrl = eventSourceUrl || req.headers.referer || '';

    if (eventName === 'AddToCart') {
      userDataObj = {
        client_ip_address: ip,
        client_user_agent: userAgent,
        em: userData.email ? [hashVal(userData.email)] : undefined,
        ph: userData.phone ? [hashPhone(userData.phone)] : undefined,
        db: userData.dob || userData.db ? [hashVal(userData.dob || userData.db)] : undefined,
        fn: fn ? [hashVal(fn)] : undefined,
        ln: ln ? [hashVal(ln)] : undefined,
        ct: userData.city ? [hashVal(userData.city)] : undefined,
        st: userData.state ? [hashVal(userData.state)] : undefined,
        zp: userData.zipCode ? [hashVal(userData.zipCode)] : undefined,
        country: userData.country ? [hashVal(userData.country)] : undefined
      };

      customDataObj = {
        content_type: customData.content_type || 'product',
        content_category: customData.content_category || undefined,
        num_items: customData.num_items || undefined,
        search_string: customData.search_string || undefined,
        delivery_category: customData.delivery_category || undefined,
        order_id: customData.order_id || undefined,
        currency: customData.currency || 'INR',
        value: customData.value !== undefined ? parseFloat(customData.value) : undefined,
        content_name: customData.content_name || undefined,
        content_ids: customData.content_ids || undefined,
        status: customData.status || undefined,
        contents: customData.contents || undefined
      };

      dataProcessingOptionsObj = {
        data_processing_options: req.body.dataProcessingOptions || [],
        data_processing_options_country: req.body.dataProcessingOptionsCountry || 0,
        data_processing_options_region: req.body.dataProcessingOptionsRegion || 0
      };
    } else if (eventName === 'Purchase') {
      userDataObj = {
        client_ip_address: ip || undefined,
        client_user_agent: userAgent || undefined,
        fbp: userData.fbp || undefined,
        fbc: userData.fbc || undefined
      };
      customDataObj = {
        currency: customData.currency || 'INR',
        value: customData.value !== undefined ? parseFloat(customData.value) : undefined
      };
    } else {
      // ViewContent, InitiateCheckout, Search, AddToWishlist (or any other fallback standard events)
      userDataObj = {
        client_ip_address: ip || undefined,
        client_user_agent: userAgent || undefined,
        fbp: userData.fbp || undefined,
        fbc: userData.fbc || undefined
      };
    }

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: formattedTime,
          action_source: 'website',
          event_source_url: formattedUrl,
          event_id: eventId,
          user_data: userDataObj,
          custom_data: Object.keys(customDataObj).length > 0 ? customDataObj : undefined,
          original_event_data: {
            event_name: eventName,
            event_time: formattedTime
          },
          ...dataProcessingOptionsObj
        }
      ]
    };
    const activeTestCode = testEventCode || process.env.META_TEST_EVENT_CODE || process.env.VITE_META_TEST_EVENT_CODE;
    if (activeTestCode) {
      payload.test_event_code = activeTestCode;
      console.log(`[CAPI] Running in Test Mode with Event Code: ${activeTestCode}`);
    }

    console.log(`[CAPI] Dispatching server event: ${eventName} (ID: ${eventId})`);

    const capiUrl = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`;
    const fbRes = await fetch(capiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resData = await fbRes.json();

    if (!fbRes.ok) {
      console.error('[CAPI Error response from Meta]:', resData);
      res.status(fbRes.status).json(resData);
      return;
    }

    res.status(200).json({ success: true, metaResponse: resData });
  } catch (err) {
    console.error('[CAPI Internal Error]:', err);
    res.status(500).json({ error: 'Internal server error while tracking conversion.' });
  }
}
