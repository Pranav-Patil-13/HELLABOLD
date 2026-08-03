// api/razorpay/verify-payment.js
// Vercel Serverless Function — verifies Razorpay payment details on the server side

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else {
      const rawBody = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      body = JSON.parse(rawBody);
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { paymentId, expectedAmount } = body;

  if (!paymentId || !expectedAmount) {
    return res.status(400).json({ error: 'Missing paymentId or expectedAmount' });
  }

  const keyId = process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    console.warn('[Razorpay Verify] RAZORPAY_KEY_SECRET is not configured. Running in MOCK VERIFICATION mode.');
    return res.status(200).json({ verified: true, mock: true });
  }

  try {
    console.log(`[Razorpay Verify] Fetching payment details for: ${paymentId}`);
    
    // Auth header is Basic Base64(key_id:key_secret)
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });

    const paymentData = await rzpRes.json();
    
    if (!rzpRes.ok) {
      console.error('[Razorpay Verify] Fetch payment details failed:', paymentData);
      return res.status(502).json({ verified: false, error: 'Failed to retrieve payment details' });
    }

    // Verify status, currency, and amount (Razorpay stores amount in paise, so multiply expected by 100)
    const expectedPaise = Math.round(Number(expectedAmount) * 100);
    const amountMatches = Math.abs(paymentData.amount - expectedPaise) <= 1; // minor float delta tolerance
    const statusValid = paymentData.status === 'captured' || paymentData.status === 'authorized';
    const currencyValid = paymentData.currency === 'INR';

    console.log(`[Razorpay Verify] Result: amountMatches=${amountMatches}, statusValid=${statusValid}, currencyValid=${currencyValid}`);

    if (amountMatches && statusValid && currencyValid) {
      console.log(`[Razorpay Verify] ✅ Payment verified successfully.`);
      return res.status(200).json({ verified: true });
    } else {
      console.error('[Razorpay Verify] ❌ Tampering detected:', {
        paymentStatus: paymentData.status,
        paymentAmount: paymentData.amount,
        expectedAmount: expectedPaise,
        currency: paymentData.currency
      });
      return res.status(200).json({ verified: false, reason: 'Payment validation fields mismatch' });
    }
  } catch (err) {
    console.error('[Razorpay Verify] Error verifying payment:', err);
    return res.status(500).json({ verified: false, error: err.message });
  }
}
