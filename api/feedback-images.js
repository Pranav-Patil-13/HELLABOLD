import fs from 'fs';
import path from 'path';

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
    
    const clRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image?type=upload&prefix=hellabold/feedback_images&max_results=100`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    let cloudinaryUrls = [];
    if (clRes.ok) {
      const data = await clRes.json();
      cloudinaryUrls = (data.resources || []).map(r => r.secure_url);
    }

    // Fallback & combine local mock images if any
    let localFiles = [];
    try {
      const dirPath = path.resolve(process.cwd(), 'public/assets/feedback_images');
      if (fs.existsSync(dirPath)) {
        localFiles = fs.readdirSync(dirPath)
          .filter(file => /\.(png|jpe?g|svg|webp|gif)$/i.test(file))
          .map(file => `/assets/feedback_images/${file}`);
      }
    } catch (e) {
      console.warn('Could not read local feedback_images directory in serverless env:', e);
    }

    const combined = Array.from(new Set([...cloudinaryUrls, ...localFiles]));
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    res.status(200).json(combined);
  } catch (err) {
    console.error('[Vercel api/feedback-images] Error:', err);
    res.status(500).json({ error: err.message });
  }
}
