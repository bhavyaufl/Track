export const GOALS = {
  calories: { target: 1500 },
  protein: 160,
  carbs: 100,
  fat: 50,
  steps: 10000,
  weightTarget: 77,      // 67.5 kg lean mass ÷ 0.88 = 76.7 kg at 12% BF
  bodyFatTarget: 12,
  startWeight: 90,
  startBodyFat: 25,
  dailyBudget: 500,
  monthlyBudget: 20000,
  startDate: '2026-06-30',
  endDate: '2026-08-09',
}

// Exercise goals — target weight/reps to hit by Aug 9
// unit: 'kg' | 'lbs' | 'reps' | 'min'
// type: 'weight' (higher = better) | 'time' (lower = better) | 'reps' (higher = better)
export const EXERCISE_GOALS = [
  // Push
  { name: 'Bench Press',            goal: 115,  unit: 'lbs', group: 'Push',   scheme: '5 reps',   type: 'weight' },
  { name: 'Incline Bench Press',    goal: 100,  unit: 'lbs', group: 'Push',   scheme: '5 reps',   type: 'weight' },
  { name: 'Shoulder Press',         goal: 40,   unit: 'kg',  group: 'Push',   scheme: '5 reps',   type: 'weight' },
  { name: 'Lateral Raises',         goal: 12.5, unit: 'kg',  group: 'Push',   scheme: '3×12',     type: 'weight' },
  { name: 'Tricep Pushdown',        goal: 150,  unit: 'lbs', group: 'Push',   scheme: '3×12',     type: 'weight' },
  { name: 'Single Tricep Pushdown', goal: 50,   unit: 'lbs', group: 'Push',   scheme: '3×12',     type: 'weight' },
  { name: 'Triceps Pullover',       goal: 150,  unit: 'lbs', group: 'Push',   scheme: '3×12',     type: 'weight' },
  { name: 'Cable Chest Flies',      goal: 150,  unit: 'lbs', group: 'Push',   scheme: '3×12',     type: 'weight' },
  // Pull
  { name: 'Deadlift',               goal: 200,  unit: 'kg',  group: 'Pull',   scheme: '5 reps',   type: 'weight' },
  { name: 'Lat Pulldown',           goal: 200,  unit: 'lbs', group: 'Pull',   scheme: '10×3',     type: 'weight' },
  { name: 'Back Rows',              goal: 250,  unit: 'lbs', group: 'Pull',   scheme: '10×3',     type: 'weight' },
  { name: 'Bicep Curls',            goal: 50,   unit: 'lbs', group: 'Pull',   scheme: 'each side',type: 'weight' },
  { name: 'Bicep Hammer Curl',      goal: 35,   unit: 'kg',  group: 'Pull',   scheme: '3×12',     type: 'weight' },
  { name: 'Preacher Curl',          goal: 180,  unit: 'lbs', group: 'Pull',   scheme: '3×12',     type: 'weight' },
  { name: 'Pull-ups',               goal: 30,   unit: 'reps',group: 'Pull',   scheme: 'total',    type: 'reps'   },
  // Legs
  { name: 'Squats',                 goal: null, unit: 'kg',  group: 'Legs',   scheme: '3×12',     type: 'weight' },
  { name: 'Leg Press',              goal: null, unit: 'kg',  group: 'Legs',   scheme: '3×12',     type: 'weight' },
  { name: 'Leg Curl',               goal: 200,  unit: 'lbs', group: 'Legs',   scheme: '3×12',     type: 'weight' },
  { name: 'Calf Raises',            goal: 100,  unit: 'lbs', group: 'Legs',   scheme: '12×3',     type: 'weight' },
  // Cardio
  { name: '5K Run',                 goal: 30,   unit: 'min', group: 'Cardio', scheme: 'sub-30',   type: 'time'   },
  { name: 'Sally Up Sally Down',    goal: 3,    unit: 'min', group: 'Cardio', scheme: '3 mins',   type: 'time'   },
]

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
