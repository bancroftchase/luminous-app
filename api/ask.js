// api/ask.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Grab the message from query (GET) or body (POST)
  const message = (req.query.message || req.body.message || '').toString();
  if (!message) {
    return res.status(400).json({ error: 'Missing message query parameter' });
  }

  // Build your prompt
  let prompt;
  if (message.toLowerCase() === 'global beauty') {
    prompt = `
List the top Global Beauty products—including accessories such as combs, brushes, foot products, nail accessories, clippers, facial cleaners, scissors, polish, and any other beauty items—from these regions: Russia, China, South America, Africa, Paris, Germany, Middle East, and Canada.
For each product, provide: name, price, description, and country of origin.
Return your answer as valid JSON:
{ "products": [ { "name":"…","price":"…","description":"…","country":"…" }, … ] }`;
  } else {
    prompt = `
List the top ${message} products. For each, provide:
- name
- price
- description
- country of origin
Include accessories when relevant.
Return your answer as valid JSON:
{ "products": [ { "name":"…","price":"…","description":"…","country":"…" }, … ] }`;
  }

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
          { role: 'system', content: 'You are a JSON-only assistant.' },
          { role: 'user',   content: prompt }
        ],
        max_tokens: 1200,
        temperature: 0.7
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
