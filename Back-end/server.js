// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Helper: send prompt to OpenAI and get the raw text back
async function callOpenAI(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a JSON-only assistant. Do not output any explanatory text.' },
        { role: 'user',   content: prompt }
      ],
      max_tokens: 1200,
      temperature: 0.7
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Error ${res.status}: ${err}`);
  }
  const { choices } = await res.json();
  return choices[0].message.content;
}

// GET /ask?message=YourCategory
app.get('/ask', async (req, res) => {
  const msg = req.query.message;
  if (!msg) {
    return res.status(400).json({ error: 'Missing "message" query parameter' });
  }

  // Build prompt
  let prompt;
  if (msg.toLowerCase() === 'global beauty') {
    prompt = `
List the top Global Beauty products—including accessories such as combs, brushes, foot products, nail accessories, clippers, facial cleaners, scissors, polish, and any other beauty-related items—from the following regions: Russia, China, South America, Africa, Paris, Germany, Middle East, and Canada.
For each product, provide: 
- name
- price
- description
- country of origin

Return output as valid JSON in the format:
{
  "products": [
    {
      "name": "...",
      "price": "...",
      "description": "...",
      "country": "..."
    },
    …
  ]
}`;
  } else {
    prompt = `
List the top ${msg} products. For each, provide:
- name
- price
- description
- country of origin

Include accessories when relevant. Return output as valid JSON:
{
  "products": [
    {
      "name": "...",
      "price": "...",
      "description": "...",
      "country": "..."
    },
    …
  ]
}`;
  }

  try {
    const aiText = await callOpenAI(prompt);

    // Parse and return
    const data = JSON.parse(aiText);
    return res.json(data);

  } catch (err) {
    console.error('🔴 /ask error:', err);
    return res.status(500).json({ error: 'Server/AI error' });
  }
});

app.listen(PORT, () => {
  console.log(`✨ Luminous AI backend listening on port ${PORT}`);
});
