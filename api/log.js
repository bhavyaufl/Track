import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

const SYSTEM_PROMPT = `You are a fitness logging assistant for Bhavya's personal tracker.
Current phase: CUTTING — goal is to reach 12% body fat by Aug 9. No sugar allowed.

## Daily Goals
- Calories: 1500 kcal/day (160g P × 4 + 100g C × 4 + 50g F × 9 = 1490 kcal)
- Protein: 160g (HIGH — preserve muscle during cut)
- Carbs: 100g (LOW — no sugar, no sweets, no fruit juice)
- Fat: 50g
- Steps: 10,000/day | Budget: ₹1,000/day
- ⚠️ No sugar: if user logs sugary food/drinks, mention it in your message as a reminder

## Macro Reference (P/C/F grams; calories = P×4 + C×4 + F×9)
Whole egg (1): 6/0/5 | Egg bhurji (4 eggs): 25/10/32
Roti (1): 3/18/2 | Rice (1 cup): 4/45/0 | Dal (1 cup): 9/20/4
Chicken breast (100g): 31/0/4 | Chicken curry (serving): 28/12/25
Chicken salad (serving): 30/10/15 | Paneer (100g): 18/4/20
Greek yogurt (100g): 10/4/1 | Whey shake (1 scoop): 25/3/2
Protein bar: 20/23/7 | Masala dosa: 7/58/15 | Naan: 8/45/10
Masala cheese dosa: 12/60/22 (~490 kcal) | Plain dosa: 3/35/2 | Idli (2): 4/30/1
Pizza slice: 7/27/8 | Banana: 1/27/0 | Apple: 0/25/0

## XP Rules
Logged: +10 | Protein ≥ 160g: +20 | Calories ~1500 (1400–1600): +15 | Steps ≥ 10k: +15 | Gym: +25 | Cardio: +15

## Daily Score (0-100)
Logged: 10 | Protein ≥ 160g: 25 | Calories ~1500 (1400–1600): 20 | Steps ≥ 10k: 20 | Gym or cardio: 25

## Spending Categories: Food, Transport, Shopping, Entertainment, Health, Rent, Subscriptions, Bills, Education

## CRITICAL MERGE RULES
You receive the full existing log. Apply these rules:
- meals: REPLACE the entire array. Each meal = {"label":"Meal N","text":"...","time":"HH:MM","macros":{"p":0,"c":0,"f":0}}.
  • If user references an existing meal (e.g. "add to meal 1", "same breakfast"), update that meal's text+macros.
  • If it's new food, append a new meal and auto-label "Meal N" (N = next index).
  • Infer time from message keywords: "morning/breakfast" ≈ 08:00, "lunch" ≈ 13:00, "evening snack" ≈ 17:00, "dinner" ≈ 19:30, "night" ≈ 21:00. If no time hint, leave time as "".
  • Keep all existing meals unchanged unless explicitly updating one.
- calories & macros (totals): ALWAYS recalculate as sum of all meals' macros after merge.
- spending: APPEND new items only — never remove existing ones.
- exercises & muscles: APPEND new entries to existing arrays.
- steps, weight, body_fat, account_balance, screen_time: REPLACE if provided.
- xp_earned & daily_score: recalculate from final day totals.

## Response format — ONLY valid JSON, no markdown:
{
  "update": {
    "meals": [
      {"label":"Meal 1","text":"description","time":"08:30","macros":{"p":0,"c":0,"f":0}}
    ],
    "calories": 0,
    "macros": {"p": 0, "c": 0, "f": 0},
    "steps": 0,
    "weight": 0,
    "body_fat": 0,
    "account_balance": 0,
    "screen_time": 0,
    "spending": [],
    "exercises": [],
    "muscles": [],
    "xp_earned": 0,
    "daily_score": 0
  },
  "message": "✓ Logged [food] ([kcal] kcal, [p]g protein). Day total: [total] kcal · [p]g protein · ₹[spent] spent."
}

Always include: meals, calories, macros, xp_earned, daily_score. Omit other fields if unchanged.`

async function supabaseFetch(path, options = {}) {
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

async function fetchLog(date) {
  const data = await supabaseFetch(`daily_logs?date=eq.${date}&select=*`)
  return Array.isArray(data) ? data[0] || null : null
}

async function saveLog(date, update, exists) {
  if (exists) {
    await supabaseFetch(`daily_logs?date=eq.${date}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    })
  } else {
    await supabaseFetch('daily_logs', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ date, ...update }),
    })
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message, date, image, confirmedUpdate } = req.body || {}
  if (!date) return res.status(400).json({ error: 'date required' })
  if (!message && !image && !confirmedUpdate) return res.status(400).json({ error: 'message or image required' })

  // Confirmed save path — skip Claude, just write the pre-approved update
  if (confirmedUpdate) {
    const { _confirmMessage, ...cleanUpdate } = confirmedUpdate
    const existing = await fetchLog(date)
    try {
      await saveLog(date, cleanUpdate, !!existing)
    } catch {
      return res.status(500).json({ message: '⚠️ Failed to save to database.' })
    }
    return res.status(200).json({ message: _confirmMessage || '✓ Logged!' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ message: '⚠️ ANTHROPIC_API_KEY not set in Vercel environment variables.' })
  }

  const existing = await fetchLog(date)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let raw
  try {
    const textContent = {
      type: 'text',
      text: `Existing log for ${date}:\n${JSON.stringify(existing || {}, null, 2)}\n\nUser says: "${message || 'Analyze this food image and estimate the macros, then log it.'}"`,
    }

    const messageContent = image
      ? [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          textContent,
        ]
      : textContent.text

    const claudeRes = await client.messages.create({
      model: image ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageContent }],
    })
    raw = claudeRes.content[0].text.trim()
  } catch (err) {
    return res.status(500).json({ message: '⚠️ Claude API error. Try again.' })
  }

  let result
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    result = JSON.parse(match ? match[0] : raw)
  } catch {
    return res.status(200).json({ message: "Couldn't parse that. Try something like: \"had 2 rotis and dal for lunch, spent ₹80\"" })
  }

  if (!result?.update) {
    return res.status(200).json({ message: result?.message || "Couldn't understand that. Please be more specific." })
  }

  // For image-based logs, return pending confirmation instead of saving directly
  if (image) {
    return res.status(200).json({
      message: result.message,
      pendingUpdate: result.update,
      requiresConfirm: true,
    })
  }

  try {
    await saveLog(date, result.update, !!existing)
  } catch {
    return res.status(500).json({ message: '⚠️ Failed to save to database.' })
  }

  return res.status(200).json({ message: result.message })
}
