import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

async function db(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (res.status === 204 || res.status === 201) return null
  return res.json()
}

export default async function handler(req, res) {
  // GET — return gallery (thumbnails + analysis only, no full photo_data)
  if (req.method === 'GET') {
    const photos = await db('progress_photos?select=id,date,photo_thumb,analysis,created_at&order=date.desc&limit=60')
    return res.json(photos || [])
  }

  if (req.method !== 'POST') return res.status(405).end()

  const { date, image, note } = req.body || {}
  if (!date || !image) return res.status(400).json({ error: 'date and image required' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' })

  // Fetch last 2 analyses for comparison context
  const prev = await db('progress_photos?select=date,analysis&order=date.desc&limit=2')
  const prevContext = prev?.length
    ? prev.map(p => `${p.date}: "${p.analysis}"`).join('\n')
    : null

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let analysis = 'Photo saved. Analysis unavailable.'
  try {
    const claudeRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 350,
      system: `You are a supportive fitness progress coach analyzing daily body progress photos for Bhavya.

Context:
- Goal: 91kg/25% BF → 85kg/12% BF by Aug 9 2026
- Daily gym, 1800 kcal, 160g protein

Analyze objectively and constructively in 3-4 sentences:
1. Visible body composition (muscle definition, vascularity, leanness)
2. What's looking good / improved
3. One specific tip for next steps${prevContext ? `\n\nPrevious analyses for comparison:\n${prevContext}` : ''}

Be honest but encouraging. No harsh criticism. If comparing to previous photos, note any visible differences.`,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: note ? `Date: ${date}. Note: ${note}` : `Analyze my progress photo for ${date}.` },
        ],
      }],
    })
    analysis = claudeRes.content[0].text
  } catch (err) {
    console.error('Claude error:', err.message)
  }

  // Upsert — photo_data = full, photo_thumb passed from client
  const { thumb } = req.body || {}
  await db('progress_photos', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ date, photo_data: image, photo_thumb: thumb || image, analysis }),
  })

  return res.json({ analysis })
}
