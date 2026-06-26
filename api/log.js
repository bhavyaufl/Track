import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

const SYSTEM_PROMPT = `You are a fitness logging assistant for Bhavya's personal tracker.

## Daily Goals
- Calories: 1800 kcal/day target
- Protein: 160g/day
- Carbs: 180g/day
- Fat: 50g/day
- Steps: 10,000/day
- Budget: ₹1,000/day

## Macro Reference (P/C/F in grams, estimate calories = P×4 + C×4 + F×9)
Egg white (1): 4/0/0 | Whole egg (1): 6/0/5 | Egg bhurji (4 eggs): 25/10/32
Roti (1): 3/18/2 | Rice (1 cup): 4/45/0 | Dal (1 cup): 9/20/4
Chicken breast (100g): 31/0/4 | Chicken curry (serving): 28/12/25
Chicken salad (serving): 30/10/15 | Paneer (100g): 18/4/20
Greek yogurt (100g): 10/4/1 | Whey/protein shake (1 scoop): 25/3/2
Protein bar: 20/23/7 | Masala dosa: 7/58/15 | Naan: 8/45/10
Pizza slice: 7/27/8 | Banana: 1/27/0 | Apple: 0/25/0

## XP Rules
Logged: +10 | Protein ≥ 160g: +20 | Calories ≥ 1800: +15 | Steps ≥ 10k: +15 | Gym: +25 | Cardio: +15

## Daily Score (0-100 pts)
Logged: 10 | Protein ≥ 160g: 25 | Calories ≥ 1800: 20 | Steps ≥ 10k: 20 | Gym or cardio: 25

## Spending Categories: Food, Transport, Shopping, Entertainment, Health, Rent, Subscriptions, Bills, Education

## CRITICAL MERGE RULES
You will receive the existing log. Apply these rules when producing the updated log:
- calories & macros: ADD new food's macros to existing totals
- meal_macros: update the specific meal slot with new food's macros (add to that slot)
- meal text (breakfast/lunch/dinner/snacks): UPDATE the mentioned meal, keep others unchanged
- spending: APPEND new items — keep ALL existing spending items and add new ones at the end
- exercises & muscles: APPEND new ones to existing arrays
- steps, weight, body_fat, account_balance, screen_time: REPLACE with new value if provided
- xp_earned & daily_score: recalculate from scratch based on full day totals

## Response format — respond ONLY with a valid JSON object, no markdown, no extra text:
{
  "update": {
    "breakfast": "string or null",
    "lunch": "string or null",
    "dinner": "string or null",
    "snacks": "string or null",
    "calories": 0,
    "macros": {"p": 0, "c": 0, "f": 0},
    "meal_macros": {
      "breakfast": {"p":0,"c":0,"f":0},
      "lunch": {"p":0,"c":0,"f":0},
      "dinner": {"p":0,"c":0,"f":0},
      "snacks": {"p":0,"c":0,"f":0}
    },
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
  "message": "Friendly 1-2 sentence confirmation with day totals. e.g. ✓ Logged chicken salad (449 kcal, 51g protein). Day total: 1,176 kcal · 152g protein · ₹544 spent."
}

Only include fields you are actually updating — omit fields with no changes (except always include calories, macros, xp_earned, daily_score).`

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

  const { message, date } = req.body || {}
  if (!message || !date) return res.status(400).json({ error: 'message and date required' })

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ message: '⚠️ ANTHROPIC_API_KEY not set in Vercel environment variables.' })
  }

  const existing = await fetchLog(date)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let raw
  try {
    const claudeRes = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Existing log for ${date}:\n${JSON.stringify(existing || {}, null, 2)}\n\nUser says: "${message}"`,
      }],
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

  try {
    await saveLog(date, result.update, !!existing)
  } catch {
    return res.status(500).json({ message: '⚠️ Failed to save to database.' })
  }

  return res.status(200).json({ message: result.message })
}
