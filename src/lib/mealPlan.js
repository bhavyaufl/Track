export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// P/C/F grams · cal kcal
// officeReady = true → bring from home, heat in microwave
// note = extra tag shown on dinner
export const WEEKLY_PLAN = [
  // 0 — Sunday
  { meals: [
    { label: 'Meal 1', time: '13:00', name: 'Egg Omelette + 2 Rotis + Dal',
      macros: { p: 34, c: 46, f: 25 }, cal: 541,
      ingredients: ['4 whole eggs', '2 rotis', '½ cup dal', 'onion · green chilli · coriander · salt'],
      steps: [
        'Beat 4 eggs with chopped onion, green chilli, salt, pepper.',
        'Cook in non-stick pan with cooking spray on medium heat, 3–4 min.',
        'Warm rotis on tawa. Serve with ½ cup dal.',
      ],
    },
    { label: 'Meal 2', time: '16:30', name: 'Protein Shake + Greek Yogurt',
      macros: { p: 45, c: 12, f: 6 }, cal: 282,
      ingredients: ['1 protein shake (RTD bottle)', '200g Greek yogurt'],
      steps: ['Shake bottle, drink cold.', 'Have Greek yogurt with a pinch of cinnamon.'],
    },
    { label: 'Meal 3', time: '20:00', name: 'Grilled Chicken + Rice', note: '+ Diet Coke',
      macros: { p: 66, c: 45, f: 8 }, cal: 524,
      ingredients: ['200g chicken breast', '1 cup cooked rice', 'salt · pepper · jeera · lemon juice'],
      steps: [
        'Season chicken with salt, pepper, jeera, lemon. Marinate 10 min.',
        'Cook in non-stick pan on medium-high, 6–7 min each side.',
        'Rest 2 min, slice. Serve with rice.',
      ],
    },
  ]},

  // 1 — Monday
  { meals: [
    { label: 'Meal 1', time: '13:00', officeReady: true, name: 'Meal-Prep Chicken + Rice',
      macros: { p: 66, c: 45, f: 8 }, cal: 524,
      ingredients: ['200g grilled chicken (Sunday prep)', '1 cup cooked rice (Sunday prep)', 'lemon wedge'],
      steps: [
        'SUNDAY PREP: Season 1.5 kg chicken breast with salt, pepper, jeera, lemon. Grill in batches.',
        'Cook 6 cups rice in bulk. Cool completely before refrigerating.',
        'Portion into 5 containers: 200g chicken + 1 cup rice each.',
        'Pack a container the night before. Microwave at office 90 seconds.',
      ],
    },
    { label: 'Meal 2', time: '17:00', name: 'Whey + Greek Yogurt',
      macros: { p: 35, c: 7, f: 3 }, cal: 195,
      ingredients: ['1 scoop whey protein', '200g Greek yogurt', '300ml cold water'],
      steps: ['Mix whey in cold water. Shake or stir well.', 'Have Greek yogurt straight.'],
    },
    { label: 'Meal 3', time: '20:00', name: '3-Egg Scramble + 2 Rotis', note: '+ Diet Coke',
      macros: { p: 27, c: 36, f: 19 }, cal: 419,
      ingredients: ['3 whole eggs', '2 rotis', 'onion · tomato · green chilli · coriander · salt'],
      steps: [
        'Sauté chopped onion, tomato, chilli in cooking spray for 2 min.',
        'Add beaten eggs, scramble on medium heat until just set.',
        'Serve with 2 warm rotis.',
      ],
    },
  ]},

  // 2 — Tuesday
  { meals: [
    { label: 'Meal 1', time: '13:00', officeReady: true, name: 'Egg Bhurji + 2 Rotis',
      macros: { p: 30, c: 38, f: 22 }, cal: 466,
      ingredients: ['4 whole eggs', '2 rotis', 'onion · tomato · chilli · turmeric · salt'],
      steps: [
        'Sauté onion, tomato, green chilli in cooking spray 2 min. Add turmeric, salt.',
        'Add 4 beaten eggs, scramble until cooked. Pack in container.',
        'Wrap 2 rotis in foil alongside. Microwave bhurji 60 sec at office — rotis are fine at room temp.',
      ],
    },
    { label: 'Meal 2', time: '17:00', name: 'Protein Shake + Greek Yogurt',
      macros: { p: 45, c: 12, f: 6 }, cal: 282,
      ingredients: ['1 protein shake (RTD bottle)', '200g Greek yogurt'],
      steps: ['Drink shake cold.', 'Have Greek yogurt straight.'],
    },
    { label: 'Meal 3', time: '20:00', name: 'Grilled Chicken + Rice', note: '+ Diet Coke',
      macros: { p: 82, c: 45, f: 10 }, cal: 602,
      ingredients: ['250g chicken breast', '1 cup cooked rice', 'salt · pepper · garlic powder · lemon'],
      steps: [
        'Season chicken with salt, pepper, garlic powder, lemon. Marinate 10 min.',
        'Cook on medium-high, 7 min each side. Rest, slice. Serve with rice.',
      ],
    },
  ]},

  // 3 — Wednesday
  { meals: [
    { label: 'Meal 1', time: '13:00', officeReady: true, name: 'Chicken + Rice + Dal',
      macros: { p: 70, c: 55, f: 10 }, cal: 598,
      ingredients: ['200g grilled chicken (prep)', '1 cup rice (prep)', '½ cup dal (prep)', 'lemon'],
      steps: [
        'PREP DAL ONCE: Pressure cook toor dal with turmeric, salt. Add jeera tadka in oil.',
        'Portion dal with chicken + rice container.',
        'Heat all together at office 90–120 seconds.',
      ],
    },
    { label: 'Meal 2', time: '17:00', name: 'Whey + 3 Boiled Eggs',
      macros: { p: 43, c: 3, f: 17 }, cal: 327,
      ingredients: ['1 scoop whey protein', '3 boiled eggs', 'salt · pepper'],
      steps: [
        'BATCH BOIL: Boil 8–10 eggs on Sunday, refrigerate. Good for 5 days.',
        'Mix whey in cold water. Peel eggs, season with salt & pepper.',
      ],
    },
    { label: 'Meal 3', time: '20:00', name: '150g Chicken + 2 Rotis', note: '+ Diet Coke',
      macros: { p: 47, c: 36, f: 10 }, cal: 423,
      ingredients: ['150g chicken breast', '2 rotis', 'chilli powder · jeera · salt · lemon'],
      steps: [
        'Season chicken strips with chilli powder, jeera, salt, lemon.',
        'Pan-cook on medium-high 5–6 min each side. Serve with 2 rotis.',
      ],
    },
  ]},

  // 4 — Thursday
  { meals: [
    { label: 'Meal 1', time: '13:00', officeReady: true, name: 'Egg Bhurji + 2 Rotis',
      macros: { p: 30, c: 38, f: 22 }, cal: 466,
      ingredients: ['4 whole eggs', '2 rotis', 'onion · chilli · salt · coriander'],
      steps: [
        'Make egg bhurji the night before (5 min). Pack with 2 rotis in foil.',
        'Microwave bhurji at office 60 sec.',
      ],
    },
    { label: 'Meal 2', time: '17:00', name: 'Whey + Greek Yogurt',
      macros: { p: 35, c: 7, f: 3 }, cal: 195,
      ingredients: ['1 scoop whey protein', '200g Greek yogurt', '300ml cold water'],
      steps: ['Mix whey in cold water.', 'Have Greek yogurt.'],
    },
    { label: 'Meal 3', time: '20:00', name: 'Grilled Chicken + Rice', note: '+ Diet Coke',
      macros: { p: 82, c: 45, f: 10 }, cal: 602,
      ingredients: ['250g chicken breast', '1 cup cooked rice', 'salt · pepper · garlic · lemon'],
      steps: [
        'Season and cook chicken 7 min each side on medium-high.',
        'Serve with rice.',
      ],
    },
  ]},

  // 5 — Friday
  { meals: [
    { label: 'Meal 1', time: '13:00', officeReady: true, name: 'Meal-Prep Chicken + Rice',
      macros: { p: 66, c: 45, f: 8 }, cal: 524,
      ingredients: ['200g grilled chicken (prep)', '1 cup cooked rice (prep)', 'lemon'],
      steps: [
        'Last container from Sunday batch prep.',
        'Microwave at office 90 seconds.',
      ],
    },
    { label: 'Meal 2', time: '17:00', name: 'Protein Shake + 3 Boiled Eggs',
      macros: { p: 43, c: 5, f: 17 }, cal: 341,
      ingredients: ['1 protein shake (RTD bottle)', '3 boiled eggs', 'salt · pepper'],
      steps: ['Drink shake cold.', 'Eat boiled eggs with salt & pepper.'],
    },
    { label: 'Meal 3', time: '20:00', name: '3 Eggs + Chicken Stir-Fry + 2 Rotis', note: '+ Diet Coke',
      macros: { p: 64, c: 36, f: 19 }, cal: 579,
      ingredients: ['3 whole eggs', '150g chicken strips', '2 rotis', 'onion · chilli · salt'],
      steps: [
        'Stir-fry chicken strips with onion and chilli in cooking spray, 5–6 min.',
        'Push to side, crack in 3 eggs and scramble in the same pan.',
        'Serve with 2 rotis.',
      ],
    },
  ]},

  // 6 — Saturday
  { meals: [
    { label: 'Meal 1', time: '13:00', name: 'Grilled Chicken + Rice + Salad',
      macros: { p: 66, c: 45, f: 8 }, cal: 524,
      ingredients: ['200g chicken breast', '1 cup cooked rice', 'cucumber · tomato · lemon dressing'],
      steps: [
        'Grill chicken with salt, pepper, jeera.',
        'Serve with rice and a simple cucumber-tomato salad with lemon dressing.',
      ],
    },
    { label: 'Meal 2', time: '16:30', name: 'Whey + Greek Yogurt',
      macros: { p: 35, c: 7, f: 3 }, cal: 195,
      ingredients: ['1 scoop whey protein', '200g Greek yogurt'],
      steps: ['Mix whey in cold water.', 'Have Greek yogurt.'],
    },
    { label: 'Meal 3', time: '20:00', name: '4-Egg Omelette + 2 Rotis', note: '+ Diet Coke',
      macros: { p: 30, c: 38, f: 22 }, cal: 466,
      ingredients: ['4 whole eggs', '2 rotis', 'onion · capsicum · green chilli · coriander'],
      steps: [
        'Beat eggs with chopped onion, capsicum, chilli.',
        'Cook in non-stick pan with cooking spray — fold omelette in half.',
        'Serve with 2 rotis.',
      ],
    },
  ]},
]
