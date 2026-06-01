// api/shiprocket/auth.js
// Vercel Serverless Function — authenticates with Shiprocket and returns a JWT token.
// Credentials are read from server-side env vars (no VITE_ prefix = never in browser bundle).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    return res.status(500).json({
      error: 'Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in environment variables.'
    });
  }

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.token) {
      console.error('[Shiprocket Auth] Failed:', data);
      return res.status(response.status).json({
        error: data.message || 'Shiprocket authentication failed',
        details: data
      });
    }

    return res.status(200).json({ token: data.token });
  } catch (err) {
    console.error('[Shiprocket Auth] Network error:', err);
    return res.status(502).json({ error: 'Could not reach Shiprocket API', details: err.message });
  }
}
