// ── Weekly split ──────────────────────────────────────────────────────────────
// 0=Sun  1=Mon   2=Tue     3=Wed     4=Thu   5=Fri     6=Sat
// pull_b rest    push_a    pull_a    legs    buffer    push_b
//
// pull_b: Deadlift (once/week) + biceps + 5K run
// buffer: flexible — makeup session or full rest; gym is open
// rest:   Mon — gym closed

export const DAY_WORKOUT = ['pull_b', 'rest', 'push_a', 'pull_a', 'legs', 'buffer', 'push_b']

export const GROUP_LABEL = {
  push_a:  'Push A · Chest & Shoulders',
  push_b:  'Push B · Chest & Triceps',
  pull_a:  'Pull A · Back & Light Biceps',
  pull_b:  'Pull B + 5K · Deadlift & Biceps',
  legs:    'Legs Day',
  rest:    'Rest Day',
  buffer:  'Rest / Buffer',
}

export const GROUP_EMOJI = {
  push_a:  '🏋️',
  push_b:  '💪',
  pull_a:  '🔗',
  pull_b:  '🏃',
  legs:    '🦵',
  rest:    '😴',
  buffer:  '🔄',
}

export const GROUP_COLOR = {
  push_a:  '#6366f1',
  push_b:  '#8b5cf6',
  pull_a:  '#06b6d4',
  pull_b:  '#f59e0b',
  legs:    '#10b981',
  rest:    '#94a3b8',
  buffer:  '#64748b',
}

// Cardio target per day
// Sun: 5k run (part of pull_b session). Mon: rest — no cardio.
// Tue–Thu + Sat: 10k steps OR 3k run in morning.
// Fri (buffer): optional light walk.
export const CARDIO_PLAN = {
  0: { label: '5K Run', desc: '5k run · aim sub-30 · part of today\'s session' },
  1: null,
  2: { label: 'Morning cardio', desc: '10k steps walk OR 3k run' },
  3: { label: 'Morning cardio', desc: '10k steps walk OR 3k run' },
  4: { label: 'Morning cardio', desc: '10k steps walk OR 3k run' },
  5: { label: 'Optional', desc: 'Light walk — or skip if fully resting' },
  6: { label: 'Morning cardio', desc: '10k steps walk OR 3k run' },
}

// ── Exercise groups ──────────────────────────────────────────────────────────
// Deadlift appears only in pull_b (Sunday) — once per week.
// Push split: compound heavy on Tue, isolation/volume on Sat.
// Pull split: back volume on Wed, deadlift + bicep focus on Sun.

export const WORKOUT_GROUPS = {
  push_a: [
    'Bench Press',
    'Incline Bench Press',
    'Shoulder Press',
    'Lateral Raises',
    'Tricep Pushdown',
  ],
  push_b: [
    'Cable Chest Flies',
    'Shoulder Press',
    'Lateral Raises',
    'Single Tricep Pushdown',
    'Triceps Pullover',
  ],
  pull_a: [
    'Lat Pulldown',
    'Back Rows',
    'Pull-ups',
    'Bicep Curls',
  ],
  pull_b: [
    'Deadlift',
    'Lat Pulldown',
    'Bicep Hammer Curl',
    'Preacher Curl',
  ],
  legs: [
    'Squats',
    'Leg Press',
    'Leg Curl',
    'Calf Raises',
  ],
  cardio: [
    '5K Run',
    'Sally Up Sally Down',
  ],
}
