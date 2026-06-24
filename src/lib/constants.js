export const GOALS = {
  calories: { min: 1200, max: 1600, target: 1500 },
  protein: 130,
  carbs: 130,
  fat: 50,
  steps: 10000,
  weightTarget: 85,
  bodyFatTarget: 12,
  startWeight: 89,
  startDate: '2026-06-08',
  endDate: '2026-08-09',
}

export const XP_TABLE = {
  logged: 10,
  proteinHit: 20,
  caloriesHit: 15,
  stepsHit: 15,
  gymSession: 25,
  cardioSession: 15,
  levelUp: 50,
  loggedWeight: 10,
  allGoalsBonus: 30,
}

export const SCORE_TABLE = {
  protein: 25,
  calories: 20,
  steps: 20,
  workout: 25,
  logged: 10,
}

export const BADGES = [
  { key: 'on_fire', emoji: '🔥', name: 'On Fire', desc: '7-day log streak' },
  { key: 'iron_will', emoji: '💪', name: 'Iron Will', desc: '21-day log streak' },
  { key: 'protein_king', emoji: '🎯', name: 'Protein King', desc: '7 consecutive days hitting protein' },
  { key: 'walker', emoji: '👣', name: 'Walker', desc: '5 days hitting 10k steps' },
  { key: 'level_up', emoji: '⬆️', name: 'Level Up', desc: 'First lift level-up ever' },
  { key: 'perfect_day', emoji: '🏆', name: 'Perfect Day', desc: 'Hit all 5 daily goals' },
  { key: 'down_2kg', emoji: '📉', name: 'Down 2kg', desc: 'Lost 2 kg from starting weight' },
  { key: 'leg_day_legend', emoji: '🦵', name: 'Leg Day Legend', desc: '4 leg sessions in a month' },
]

export const SPENDING_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment',
  'Health', 'Rent', 'Subscriptions', 'Bills', 'Education',
]
