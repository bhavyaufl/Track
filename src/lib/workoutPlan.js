// PPL split — index matches Date.getDay() (0=Sun … 6=Sat)
// Mon = rest (gym closed); Sun = cardio / active recovery
export const DAY_WORKOUT = ['cardio', 'rest', 'push', 'pull', 'legs', 'push', 'pull']
//                          Sun       Mon     Tue     Wed     Thu    Fri    Sat

export const GROUP_LABEL = {
  push:   'Push Day',
  pull:   'Pull Day',
  legs:   'Legs Day',
  rest:   'Rest Day',
  cardio: 'Cardio Day',
}

export const GROUP_EMOJI = {
  push:   '🏋️',
  pull:   '💪',
  legs:   '🦵',
  rest:   '😴',
  cardio: '🏃',
}

export const GROUP_COLOR = {
  push:   '#6366f1',
  pull:   '#8b5cf6',
  legs:   '#10b981',
  rest:   '#94a3b8',
  cardio: '#f59e0b',
}

// Cardio target per day
// Sunday: dedicated 5k run. Mon: rest (no cardio). Tue–Sat: morning 10k walk OR 3k run.
export const CARDIO_PLAN = {
  0: { label: '5K Run', desc: '5k run in the morning · sub-30 goal', steps: null },
  1: null,
  2: { label: 'Morning cardio', desc: '10k steps walk OR 3k run', steps: 10000 },
  3: { label: 'Morning cardio', desc: '10k steps walk OR 3k run', steps: 10000 },
  4: { label: 'Morning cardio', desc: '10k steps walk OR 3k run', steps: 10000 },
  5: { label: 'Morning cardio', desc: '10k steps walk OR 3k run', steps: 10000 },
  6: { label: 'Morning cardio', desc: '10k steps walk OR 3k run', steps: 10000 },
}

// Ordered exercise lists per group — names must match EXERCISE_GOALS exactly
export const WORKOUT_GROUPS = {
  push: [
    'Bench Press',
    'Incline Bench Press',
    'Shoulder Press',
    'Lateral Raises',
    'Tricep Pushdown',
    'Single Tricep Pushdown',
    'Triceps Pullover',
    'Cable Chest Flies',
  ],
  pull: [
    'Deadlift',
    'Lat Pulldown',
    'Back Rows',
    'Pull-ups',
    'Bicep Curls',
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
