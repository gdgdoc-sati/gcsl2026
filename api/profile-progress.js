/**
 * API handler: /api/profile-progress
 * Fetches and parses Google Cloud Skills Boost public profile badges in real time.
 * Includes server-side in-memory caching and request deduplication to prevent server overload.
 */

export const config = {
  maxDuration: 15,
};

// Server-side in-memory cache (1 hour TTL)
const CACHE_TTL_MS = 60 * 60 * 1000;
const memoryCache = new Map();

// In-flight request deduplication map to prevent multiple concurrent fetches for the same URL
const inFlightRequests = new Map();

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : res.end();
  }

  const rawUrl = req.query?.url || req.body?.url;
  const forceRefresh = req.query?.force === 'true' || req.body?.force === true;

  if (!rawUrl || typeof rawUrl !== 'string') {
    const errorJson = { success: false, message: 'Missing "url" parameter.' };
    return res.status ? res.status(400).json(errorJson) : res.end(JSON.stringify(errorJson));
  }

  const cleanUrl = rawUrl.trim();
  if (
    !cleanUrl.includes('cloudskillsboost.google/public_profiles/') &&
    !cleanUrl.includes('skills.google/public_profiles/')
  ) {
    const errorJson = {
      success: false,
      message: 'Invalid URL. Expected a Google Cloud Skills Boost public profile URL.',
    };
    return res.status ? res.status(400).json(errorJson) : res.end(JSON.stringify(errorJson));
  }

  // 1. Check in-memory cache if not forced refresh
  if (!forceRefresh && memoryCache.has(cleanUrl)) {
    const cachedEntry = memoryCache.get(cleanUrl);
    if (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      res.setHeader('X-Cache-Status', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      if (res.json) {
        return res.status(200).json(cachedEntry.data);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(cachedEntry.data));
      }
    }
  }

  // 2. Check if a request for this URL is already in-flight (deduplication)
  if (inFlightRequests.has(cleanUrl)) {
    try {
      const data = await inFlightRequests.get(cleanUrl);
      res.setHeader('X-Cache-Status', 'DEDUPED');
      if (res.json) {
        return res.status(200).json(data);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(data));
      }
    } catch (err) {
      // If the in-flight request fails, fall through to try afresh
    }
  }

  // Standardize protocol
  let targetUrl = cleanUrl;
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://${targetUrl}`;
  }

  // Define fetch task
  const fetchTask = async () => {
    const fetchOptions = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    };

    let response = await fetch(targetUrl, fetchOptions);

    if (!response.ok && targetUrl.includes('cloudskillsboost.google')) {
      const skillsGoogleUrl = targetUrl.replace('cloudskillsboost.google', 'skills.google');
      response = await fetch(skillsGoogleUrl, fetchOptions).catch(() => response);
    } else if (!response.ok && targetUrl.includes('skills.google')) {
      const csbUrl = targetUrl.replace('skills.google', 'www.cloudskillsboost.google');
      response = await fetch(csbUrl, fetchOptions).catch(() => response);
    }

    if (!response.ok) {
      throw new Error(`Google Cloud Skills Boost responded with status ${response.status}`);
    }

    const html = await response.text();

    // 1. Extract Avatar
    const avatarMatch =
      html.match(/<ql-avatar[^>]+src=["']([^"']+)["']/i) ||
      html.match(/<img[^>]+src=["']([^"']+)["'][^>]*class=["'][^"']*avatar/i) ||
      html.match(/class=["'][^"']*avatar[^"']*["'][^>]*>\s*<img[^>]+src=["']([^"']+)["']/i);
    let avatar = avatarMatch && avatarMatch[1] ? avatarMatch[1].trim() : null;
    if (avatar && avatar.startsWith('//')) avatar = `https:${avatar}`;

    // 2. Extract Name
    const nameMatch =
      html.match(/<h1[^>]+class=["'][^"']*ql-display-small[^"']*["'][^>]*>\s*([^<]+)\s*<\/h1>/i) ||
      html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
    const name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : null;

    // 3. Extract Badges
    const badges = [];
    const badgeBlockRegex =
      /<div[^>]+class=["'][^"']*profile-badge[^"']*["'][^>]*>([\s\S]*?)(?:<\/div>\s*<\/div>|(?=<div[^>]+class=["'][^"']*profile-badge)|$)/gi;
    let blockMatch;

    while ((blockMatch = badgeBlockRegex.exec(html)) !== null) {
      const block = blockMatch[1];

      const titleMatch =
        block.match(/<span[^>]+class=["'][^"']*(?:ql-title-medium|ql-subhead-1|badge-title)[^"']*["'][^>]*>\s*([^<]+)\s*<\/span>/i) ||
        block.match(/<h3[^>]*>\s*([^<]+)\s*<\/h3>/i);
      const title = titleMatch && titleMatch[1] ? titleMatch[1].replace(/&amp;/g, '&').trim() : '';

      if (!title) continue;

      const dateMatch =
        block.match(/<span[^>]+class=["'][^"']*ql-body-medium[^"']*["'][^>]*>\s*(?:Earned\s*)?([^<]+)\s*<\/span>/i) ||
        block.match(/Earned\s+([A-Za-z0-9, ]+)/i);
      const earnedDate = dateMatch && dateMatch[1] ? dateMatch[1].trim() : '';

      const imgMatch =
        block.match(/<img[^>]+src=["']([^"']+)["'][^>]*role=["']presentation["']/i) ||
        block.match(/<img[^>]+src=["']([^"']+)["']/i);
      const image = imgMatch && imgMatch[1] ? imgMatch[1].trim() : '';

      const linkMatch = block.match(/<a[^>]+class=["'][^"']*badge-image[^"']*["'][^>]+href=["']([^"']+)["']/i);
      const badgeUrl = linkMatch && linkMatch[1] ? linkMatch[1].trim() : '';

      badges.push({
        title,
        earnedDate,
        image,
        badgeUrl,
      });
    }

    if (badges.length === 0) {
      const titleRegex =
        /<span[^>]+class=["'][^"']*(?:ql-title-medium|ql-subhead-1|badge-title)[^"']*["'][^>]*>\s*([^<]+)\s*<\/span>/gi;
      let tm;
      while ((tm = titleRegex.exec(html)) !== null) {
        const title = tm[1].replace(/&amp;/g, '&').trim();
        if (title && !title.toLowerCase().includes('badge') && title.length > 3) {
          badges.push({
            title,
            earnedDate: '',
            image: '',
            badgeUrl: '',
          });
        }
      }
    }

    // Extract league points, league tier, and tour lab completion to identify credit activation
    const pointsMatch =
      html.match(/<strong>\s*([0-9,]+)\s*points\s*<\/strong>/i) ||
      html.match(/([0-9,]+)\s*points/i);
    const points = pointsMatch ? parseInt(pointsMatch[1].replace(/,/g, ''), 10) || 0 : 0;

    const leagueMatch = html.match(/<h2[^>]*class=["'][^"']*ql-headline-medium[^"']*["'][^>]*>\s*([^<]+)\s*<\/h2>/i);
    const league = leagueMatch && leagueMatch[1] ? leagueMatch[1].trim() : '';

    const hasTourLab = /tour of google cloud/i.test(html);
    const hasClaimedCredits = badges.length > 0 || hasTourLab || points > 0;

    const result = {
      success: true,
      profileUrl: cleanUrl,
      name,
      avatar,
      totalBadgesCount: badges.length,
      badges,
      points,
      league,
      hasTourLab,
      hasClaimedCredits,
    };

    // Save to memory cache
    memoryCache.set(cleanUrl, {
      timestamp: Date.now(),
      data: result,
    });

    return result;
  };

  const promise = fetchTask();
  inFlightRequests.set(cleanUrl, promise);

  try {
    const data = await promise;
    inFlightRequests.delete(cleanUrl);

    res.setHeader('X-Cache-Status', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (res.json) {
      return res.status(200).json(data);
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(data));
    }
  } catch (error) {
    inFlightRequests.delete(cleanUrl);
    const errorJson = {
      success: false,
      message: error.message || 'Failed to fetch public profile data.',
    };
    if (res.json) {
      return res.status(500).json(errorJson);
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(errorJson));
    }
  }
}
