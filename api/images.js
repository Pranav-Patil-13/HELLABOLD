export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dtx3jvozs';
    const apiKey = process.env.CLOUDINARY_API_KEY || '387515192585761';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'pGIIw_doA-20spEF26LTuVpsvk0';
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const clRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image?type=upload&prefix=hellabold/products&max_results=100`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    let cloudinaryUrls = [];
    if (clRes.ok) {
      const data = await clRes.json();
      cloudinaryUrls = (data.resources || []).map(r => r.secure_url);
    }

    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    res.status(200).json(cloudinaryUrls);
  } catch (err) {
    console.error('[Vercel api/images] Error:', err);
    res.status(500).json({ error: err.message });
  }
}
