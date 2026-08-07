export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.error('[Pixel Stats Error] Meta credentials missing in environment.');
    res.status(500).json({ error: 'Meta configuration is missing on the server.' });
    return;
  }

  try {
    const startTime = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60); // 7 days ago in Unix timestamp
    const capiUrl = `https://graph.facebook.com/v20.0/${pixelId}/stats?aggregation=event_total_counts&start_time=${startTime}&access_token=${accessToken}`;
    
    console.log(`[Pixel Stats] Querying Meta stats for Pixel: ${pixelId}`);
    const fbRes = await fetch(capiUrl, {
      method: 'GET'
    });

    const resData = await fbRes.json();

    if (!fbRes.ok) {
      console.error('[Pixel Stats Error response from Meta]:', resData);
      res.status(fbRes.status).json(resData);
      return;
    }

    // Extract stats data
    let stats = [];
    if (resData.data && resData.data.length > 0) {
      stats = resData.data[0].stats || [];
    }

    res.status(200).json({
      success: true,
      pixelId: pixelId,
      stats: stats
    });
  } catch (err) {
    console.error('[Pixel Stats Internal Error]:', err);
    res.status(500).json({ error: 'Internal server error while fetching stats.' });
  }
}
