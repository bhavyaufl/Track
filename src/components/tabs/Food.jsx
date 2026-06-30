import { useState } from 'react'
import { useDark } from '../../lib/DarkContext'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// P/C/F grams · cal kcal
// officeReady = true → bring from home, heat in microwave
// note = extra tag (e.g. "+ Diet Coke")
const WEEKLY_PLAN = [
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
        'Wrap 2 rotis in foil alongside. Microwave bhurji 60 sec at office — rotis eat fine at room temp.',
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
        'Grill fresh chicken with salt, pepper, jeera.',
        'Make quick salad: diced cucumber + tomato + lemon juice + salt.',
        'Serve with rice and salad.',
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

const GROCERY_LIST = [
  { category: 'Protein', emoji: '🥩', items: [
    { item: 'Chicken breast', qty: '1.5 kg', note: 'Grill all on Sunday for the week' },
    { item: 'Eggs', qty: '30 (2.5 dozen)', note: 'Boil 10 on Sunday; keeps 5 days' },
    { item: 'Greek yogurt', qty: '800g', note: '4 × 200g packs' },
    { item: 'Whey protein', qty: '4 scoops', note: 'From your tub' },
    { item: 'Protein shake (RTD)', qty: '3 bottles', note: 'Pre-made, for on-the-go' },
  ]},
  { category: 'Carbs', emoji: '🍚', items: [
    { item: 'Rice', qty: '600g', note: 'Cook 6 cups on Sunday' },
    { item: 'Roti', qty: '14', note: 'Buy from store or make; refrigerate' },
    { item: 'Dal (toor/masoor)', qty: '100g dry', note: 'Pressure cook 1 batch on Sunday' },
  ]},
  { category: 'Drinks', emoji: '🥤', items: [
    { item: 'Diet Coke', qty: '7 cans', note: '1 with dinner every night — zero kcal ✓' },
  ]},
  { category: 'Pantry', emoji: '🌿', items: [
    { item: 'Lemons', qty: '5', note: '' },
    { item: 'Onions', qty: '4 medium', note: '' },
    { item: 'Tomatoes', qty: '4 medium', note: '' },
    { item: 'Green chillies', qty: '1 small pack', note: '' },
    { item: 'Fresh coriander', qty: '1 bunch', note: '' },
    { item: 'Capsicum', qty: '1', note: 'For Saturday omelette' },
    { item: 'Cooking spray (0-cal)', qty: '1 can', note: 'Instead of oil — saves ~100 kcal/day' },
  ]},
]

function MealCard({ meal }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
            {meal.label}
          </span>
          <span className="text-xs text-gray-400">{meal.time}</span>
          {meal.officeReady && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              🥡 Bring from home
            </span>
          )}
          {meal.note && (
            <span className="text-xs text-gray-400 italic">{meal.note}</span>
          )}
        </div>
        <div className="font-semibold text-gray-800 text-sm mb-2">{meal.name}</div>
        <div className="flex gap-3 text-xs">
          <span className="font-semibold text-indigo-600">{meal.macros.p}g P</span>
          <span className="font-semibold text-amber-500">{meal.macros.c}g C</span>
          <span className="font-semibold text-pink-500">{meal.macros.f}g F</span>
          <span className="text-gray-400 ml-auto">{meal.cal} kcal</span>
        </div>
      </div>

      <button onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 font-medium flex items-center justify-between hover:bg-gray-100 transition-colors">
        <span>Ingredients & Recipe</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ingredients</div>
            {meal.ingredients.map((ing, i) => (
              <div key={i} className="text-xs text-gray-600 flex gap-1.5 mb-1">
                <span className="text-indigo-300 shrink-0">•</span>{ing}
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Steps</div>
            {meal.steps.map((step, i) => (
              <div key={i} className="text-xs text-gray-600 flex gap-2 mb-2">
                <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TodayPlan({ dayIdx }) {
  const [viewDay, setViewDay] = useState(dayIdx)
  const plan = WEEKLY_PLAN[viewDay]
  const totalCal = plan.meals.reduce((s, m) => s + m.cal, 0)
  const totalP   = plan.meals.reduce((s, m) => s + m.macros.p, 0)
  const totalC   = plan.meals.reduce((s, m) => s + m.macros.c, 0)
  const totalF   = plan.meals.reduce((s, m) => s + m.macros.f, 0)
  const isToday  = viewDay === dayIdx

  return (
    <div className="space-y-3">
      {/* Day selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => setViewDay(d => (d + 6) % 7)}
          className="text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 text-xs font-semibold">◀ prev</button>
        <div className="text-center">
          <div className="font-bold text-gray-800 text-sm">
            {DAY_NAMES[viewDay]}{isToday ? ' — Today' : ''}
          </div>
          <div className="text-xs text-gray-400">{totalCal} kcal · {totalP}g P · {totalC}g C · {totalF}g F</div>
        </div>
        <button onClick={() => setViewDay(d => (d + 1) % 7)}
          className="text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 text-xs font-semibold">next ▶</button>
      </div>

      {plan.meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
    </div>
  )
}

function GroceryList() {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState({})
  const isSunday = new Date().getDay() === 0

  function toggle(key) {
    setChecked(c => ({ ...c, [key]: !c[key] }))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛒</span>
          <div className="text-left">
            <div className="font-semibold text-gray-800 text-sm">Weekly Grocery List</div>
            {isSunday && (
              <div className="text-xs text-orange-500 font-semibold">Today is Sunday — shop & prep now!</div>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {GROCERY_LIST.map(cat => (
            <div key={cat.category}>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-4 pb-2 flex items-center gap-1.5">
                <span>{cat.emoji}</span>{cat.category}
              </div>
              {cat.items.map((it, i) => {
                const key = `${cat.category}-${i}`
                return (
                  <button key={i} onClick={() => toggle(key)}
                    className="w-full flex items-start justify-between py-2 border-b border-gray-50 last:border-0 text-left">
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked[key] ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200'}`}>
                        {checked[key] && <span className="text-white text-xs leading-none">✓</span>}
                      </div>
                      <div>
                        <div className={`text-sm font-medium transition-colors ${checked[key] ? 'text-gray-300 line-through' : 'text-gray-700'}`}>{it.item}</div>
                        {it.note && <div className="text-xs text-gray-400">{it.note}</div>}
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ml-4 shrink-0 transition-colors ${checked[key] ? 'text-gray-300' : 'text-indigo-600'}`}>{it.qty}</span>
                  </button>
                )
              })}
            </div>
          ))}

          <button onClick={() => setChecked({})}
            className="mt-3 text-xs text-gray-400 hover:text-red-400 transition-colors">
            ↺ reset checklist
          </button>
        </div>
      )}
    </div>
  )
}

function MealPrepBanner() {
  const dark = useDark()
  return (
    <div className="rounded-2xl px-4 py-3.5 border border-emerald-200"
      style={{ background: dark
        ? 'linear-gradient(135deg, #052819 0%, #062820 100%)'
        : 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf9 100%)' }}>
      <div className="font-bold text-emerald-800 text-sm mb-2">🥡 Sunday Meal Prep = Stress-Free Week</div>
      <div className="space-y-1.5 text-xs text-emerald-700">
        <div className="flex gap-2"><span className="shrink-0 font-bold">1.</span>Grill 1.5 kg chicken breast in one batch — season with salt, pepper, jeera, lemon</div>
        <div className="flex gap-2"><span className="shrink-0 font-bold">2.</span>Cook 6 cups rice, boil 10 eggs, pressure cook dal — all at once</div>
        <div className="flex gap-2"><span className="shrink-0 font-bold">3.</span>Portion: 200g chicken + 1 cup rice into 5 containers → Mon–Fri Meal 1 sorted</div>
        <div className="flex gap-2"><span className="shrink-0 font-bold">4.</span>At office: 90 sec microwave. Hits 66g protein in one meal.</div>
      </div>
    </div>
  )
}

export default function Food() {
  const dayIdx = new Date().getDay()
  return (
    <div className="space-y-4">
      <MealPrepBanner />
      <TodayPlan dayIdx={dayIdx} />
      <GroceryList />
    </div>
  )
}
