// api/send-confirmation-email.js
// Vercel Serverless Function — sends order confirmation email via Resend API.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let order;
  try {
    if (typeof req.body === 'object' && req.body !== null) {
      order = req.body;
    } else {
      const rawBody = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      order = JSON.parse(rawBody);
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  try {
    const {
      id: orderId,
      items = [],
      total = 0,
      subtotal = 0,
      discount = 0,
      shipping = 0,
      shippingDetails = {},
      awb = 'PENDING-SYNC',
      courier = 'TBD'
    } = order;

    const customerName = shippingDetails.name || 'Valued Customer';
    const customerEmail = shippingDetails.email;

    if (!customerEmail) {
      return res.status(400).json({ error: 'Missing customer email' });
    }

    // Generate receipt rows
    const itemRows = items.map(item => {
      const priceVal = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
      const formattedTotal = `₹${priceVal * item.quantity}`;
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #1a1a1a; color: #ffffff;">
            <strong style="color: #ffffff; text-transform: uppercase; font-size: 13px;">${item.title}</strong>
            <br />
            <span style="font-size: 11px; color: #a0a0a0;">Size: ${item.size}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #1a1a1a; text-align: center; color: #ffffff; font-size: 13px;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #1a1a1a; text-align: right; color: #d4af37; font-size: 13px; font-weight: bold;">${formattedTotal}</td>
        </tr>
      `;
    }).join('');

    const trackingUrl = awb !== 'PENDING-SYNC' 
      ? `https://shiprocket.co/tracking/${awb}` 
      : `https://www.hellabold.com/order-status?id=${orderId}`;

    const trackingHtml = awb !== 'PENDING-SYNC'
      ? `<div style="background-color: #1a1b1c; border: 1px solid #d4af37; padding: 20px; border-radius: 4px; margin-bottom: 30px; text-align: center;">
          <h3 style="color: #d4af37; margin-top: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Shipment Tracking</h3>
          <p style="color: #ffffff; font-size: 13px; margin-bottom: 15px;">Your order has been manifested via <strong>${courier}</strong> with Air Waybill (AWB): <strong>${awb}</strong></p>
          <a href="${trackingUrl}" target="_blank" style="background-color: #d4af37; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 2px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Track Shipment</a>
         </div>`
      : `<div style="background-color: #1a1b1c; border: 1px solid #333333; padding: 20px; border-radius: 4px; margin-bottom: 30px; text-align: center;">
          <h3 style="color: #ffffff; margin-top: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Order Status</h3>
          <p style="color: #a0a0a0; font-size: 13px; margin-bottom: 15px;">Your order is being processed and packaged. We will email your AWB tracking link as soon as it leaves our warehouse.</p>
          <a href="${trackingUrl}" target="_blank" style="background-color: #ffffff; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 2px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">View Order Status</a>
         </div>`;

    const shippingText = shipping === 0 ? 'FREE' : `₹${shipping}`;
    let discountRow = '';
    if (discount > 0) {
      discountRow = `
        <tr style="font-size: 12px; color: #ff3333;">
          <td align="right" style="padding: 4px 12px;">Discount Applied:</td>
          <td align="right" style="padding: 4px 12px; width: 100px;">-₹${discount}</td>
        </tr>
      `;
    }

    // Styled black and gold email template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>HELLABOLD Order Receipt</title>
</head>
<body style="background-color: #050505; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 0; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; border: 1px solid #1c1c1c; border-radius: 8px; overflow: hidden; padding: 40px;">
          <!-- Header Logo -->
          <tr>
            <td align="center" style="padding-bottom: 40px; border-bottom: 1px solid #1a1a1a;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 6px; text-transform: uppercase;">HELLABOLD</h1>
              <p style="color: #d4af37; margin: 5px 0 0 0; font-size: 10px; letter-spacing: 4px; text-transform: uppercase;">Signature Streetwear</p>
            </td>
          </tr>
          
          <!-- Heading -->
          <tr>
            <td style="padding: 40px 0 20px 0;">
              <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Order Placed Successfully</h2>
              <p style="color: #a0a0a0; font-size: 13px; line-height: 1.6; margin-top: 10px;">
                Hello ${customerName},<br />
                Your order <strong>#${orderId}</strong> has been secured. Our team is prep-ing your items for dispatch.
              </p>
            </td>
          </tr>
          
          <!-- Tracking Block -->
          <tr>
            <td>
              ${trackingHtml}
            </td>
          </tr>

          <!-- Receipt Title -->
          <tr>
            <td style="padding-bottom: 15px; border-bottom: 2px solid #d4af37;">
              <h3 style="color: #d4af37; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-size: 13px;">Order Items</h3>
            </td>
          </tr>

          <!-- Receipt Table -->
          <tr>
            <td style="padding-top: 10px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <thead>
                  <tr style="color: #a0a0a0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                    <th align="left" style="padding: 8px 12px; border-bottom: 1px solid #1a1a1a;">Product</th>
                    <th align="center" style="padding: 8px 12px; border-bottom: 1px solid #1a1a1a; width: 60px;">Qty</th>
                    <th align="right" style="padding: 8px 12px; border-bottom: 1px solid #1a1a1a; width: 100px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding-top: 20px; padding-bottom: 30px; border-bottom: 1px solid #1a1a1a;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr style="font-size: 12px; color: #a0a0a0;">
                  <td align="right" style="padding: 4px 12px;">Subtotal:</td>
                  <td align="right" style="padding: 4px 12px; width: 100px; color: #ffffff;">₹${subtotal}</td>
                </tr>
                ${discountRow}
                <tr style="font-size: 12px; color: #a0a0a0;">
                  <td align="right" style="padding: 4px 12px;">Shipping:</td>
                  <td align="right" style="padding: 4px 12px; width: 100px; color: #ffffff;">${shippingText}</td>
                </tr>
                <tr style="font-size: 15px; color: #d4af37; font-weight: bold;">
                  <td align="right" style="padding: 10px 12px 4px 12px;">TOTAL SECURED:</td>
                  <td align="right" style="padding: 10px 12px 4px 12px; width: 100px; border-top: 1px solid #d4af37;">₹${total}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding: 30px 0 10px 0;">
              <h3 style="color: #ffffff; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px; font-size: 13px;">Delivery Address</h3>
              <p style="color: #a0a0a0; font-size: 12px; line-height: 1.6; margin: 0;">
                <strong>${shippingDetails.name}</strong><br />
                ${shippingDetails.address}<br />
                ${shippingDetails.city}, ${shippingDetails.state} - ${shippingDetails.zipCode}<br />
                Phone: ${shippingDetails.phone}
              </p>
            </td>
          </tr>

          <!-- Footer brand note -->
          <tr>
            <td align="center" style="padding-top: 40px; border-top: 1px solid #1a1a1a; margin-top: 30px;">
              <p style="color: #a0a0a0; font-size: 11px; margin: 0; letter-spacing: 1px;">Thank you for stepping into our universe.</p>
              <p style="color: #d4af37; font-size: 10px; margin: 5px 0 0 0; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">#HELLABOLD</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn('[Resend Serverless] RESEND_API_KEY is not configured.');
      return res.status(200).json({ success: true, mock: true });
    }

    const emailPayload = {
      from: 'HELLABOLD <orders@hellabold.com>',
      to: customerEmail,
      subject: `Order Secured: #${orderId}`,
      html: emailHtml
    };

    console.log(`[Resend Serverless] Dispatching confirmation email for order: ${orderId} to: ${customerEmail}`);
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(emailPayload)
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error('[Resend Serverless] Dispatch failed:', resendData);
      return res.status(502).json({ error: 'Resend delivery failed', details: resendData });
    }

    console.log(`[Resend Serverless] ✅ Email sent. ID: ${resendData.id}`);
    return res.status(200).json({ success: true, emailId: resendData.id });
  } catch (err) {
    console.error('[Email Serverless Proxy] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
