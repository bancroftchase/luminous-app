// api/ask.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const message = (req.query.message || req.body.message || '').toString();
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  // System prompt that defines the “master discovery engine” persona
  const systemPrompt = `
You are Luminous AI, the world’s foremost beauty discovery engine. 
You excel at finding and recommending every possible beauty care product, tool, and accessory—from serums and cleansers to combs, brushes, and nail clippers—no matter how niche or global.
You proactively expand queries by considering synonyms, related categories, and regional specialties (e.g., K-Beauty, Middle Eastern oils, African hair accessories, European fragrances, etc.).
Always push beyond the obvious, infer what the user really wants, and surface hidden gems and accessories they might not know to ask for.
Respond ONLY with valid JSON in the format:
{ "products": [ { "name": "...", "price": "...", "description": "...", "country": "..." }, … ] }`;

  // User prompt reminding it to think broadly
  const userPrompt = message.toLowerCase() === 'global beauty'
    ? `
User asked: "Global Beauty"
Please find EVERY beauty product and accessory worldwide—including tools, kits, disposables, and specialty items—from regions such as Russia, China, South America, Africa, Paris, Germany, Middle East, and Canada.
Be exhaustive, include synonymous terms, related sub-categories, and hidden gems.
Return ONLY valid JSON as specified.`
    : `
User asked: "${message}"
Find ALL relevant beauty care products, tools, and accessories related to this request—including synonyms and region-specific variations.
Think beyond the literal terms and include any items close or similar to their request.
Return ONLY valid JSON as specified.`;

  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.8
      })
    });
    if (!aiRes.ok) throw new Error(`OpenAI ${aiRes.status}: ${await aiRes.text()}`);

    const { choices } = await aiRes.json();
    const data = JSON.parse(choices[0].message.content);
    return res.json(data);

  } catch (err) {
    console.error('❌ /api/ask error:', err);
    return res.status(500).json({ error: err.message });
  }
}
