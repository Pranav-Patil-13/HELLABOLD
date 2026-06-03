import crypto from 'crypto';

function generateCloudinarySignature(params, apiSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto
    .createHash('sha1')
    .update(sortedParams + apiSecret)
    .digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'Missing image URL' });
      return;
    }

    const parts = url.split('/upload/');
    if (parts.length < 2) {
      res.status(400).json({ error: 'Invalid Cloudinary URL structure' });
      return;
    }
    const pathAndFilename = parts[1].replace(/^v\d+\//, '');
    const dotIndex = pathAndFilename.lastIndexOf('.');
    const publicId = dotIndex !== -1 ? pathAndFilename.substring(0, dotIndex) : pathAndFilename;

    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dtx3jvozs';
    const apiKey = process.env.CLOUDINARY_API_KEY || '387515192585761';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'pGIIw_doA-20spEF26LTuVpsvk0';

    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      public_id: publicId,
      timestamp: timestamp.toString()
    };
    const signature = generateCloudinarySignature(params, apiSecret);

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const destroyRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData
    });

    const result = await destroyRes.json();
    if (!destroyRes.ok) {
      throw new Error(result.error?.message || 'Cloudinary destroy failed');
    }

    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('[Vercel api/delete-image] Error:', err);
    res.status(500).json({ error: err.message });
  }
}
