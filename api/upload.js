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

async function uploadToCloudinary({ filename, base64, folder }) {
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dtx3jvozs';
  const apiKey = process.env.CLOUDINARY_API_KEY || '387515192585761';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'pGIIw_doA-20spEF26LTuVpsvk0';

  const timestamp = Math.round(new Date().getTime() / 1000);
  // Extract file basename without path or extension
  const cleanFilename = filename ? filename.split('/').pop() : '';
  const publicId = cleanFilename ? cleanFilename.split('.').slice(0, -1).join('.') : undefined;

  const params = {
    timestamp,
    folder,
  };
  if (publicId) {
    params.public_id = publicId;
  }

  const signature = generateCloudinarySignature(params, apiSecret);
  const fileData = `data:image/png;base64,${base64}`;

  const formData = new URLSearchParams();
  formData.append('file', fileData);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  if (publicId) {
    formData.append('public_id', publicId);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || 'Cloudinary upload failed');
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { filename, base64 } = req.body;
    if (!base64) {
      res.status(400).json({ error: 'Missing base64 data' });
      return;
    }

    const uploadRes = await uploadToCloudinary({
      filename,
      base64,
      folder: 'hellabold/products',
    });

    res.status(200).json({ success: true, url: uploadRes.secure_url });
  } catch (err) {
    console.error('[Vercel api/upload] Error:', err);
    res.status(500).json({ error: err.message });
  }
}
