import { useState } from 'react'
import { useDark } from '../../lib/DarkContext'
import { WEEKLY_PLAN, DAY_NAMES } from '../../lib/mealPlan'

// Prices verified by user. Quantities reflect home cooking only —
// Mon–Sat Meal 1 is office canteen (mix & match, ~₹75/meal).
const GROCERY_LIST = [
  { category: 'Protein', emoji: '🥩', items: [
    { item: 'Chicken breast',      qty: '1.2 kg',        price: 408, note: '₹340/kg · home dinners only (canteen covers weekday Meal 1)' },
    { item: 'Eggs',                qty: '24 (4 × 6 pcs)',price: 240, note: '₹60/6 pcs · home cooking; batch boil 8 on Sunday' },
    { item: 'Greek yogurt (Amul)', qty: '~800g',          price: 330, note: '₹284/700g pack · buy ~1.2 packs per week' },
    { item: 'Whey protein',        qty: '4 scoops',       price: 0,   note: 'From your tub — already owned' },
    { item: 'Protein shake (Amul)',qty: '3 bottles',      price: 150, note: '₹50/bottle · Meal 2 on Sun, Tue, Fri' },
  ]},
  { category: 'Carbs', emoji: '🍚', items: [
    { item: 'Rice',              qty: '400g',  price: 16,  note: '₹40/kg · home dinners only (4 meals/week)' },
    { item: 'Roti',              qty: '10',    price: 70,  note: '~₹7 each · home dinners + Sunday Meal 1' },
    { item: 'Dal (toor/masoor)', qty: '50g',   price: 8,   note: 'Sunday Meal 1 only — small batch' },
  ]},
  { category: 'Drinks', emoji: '🥤', items: [
    { item: 'Diet Coke', qty: '7 cans', price: 280, note: '₹40/can · 1 with dinner every night — zero kcal ✓' },
  ]},
  { category: 'Pantry', emoji: '🌿', items: [
    { item: 'Lemons',                qty: '5',         price: 25,  note: '' },
    { item: 'Onions',                qty: '4 medium',  price: 20,  note: '' },
    { item: 'Tomatoes',              qty: '4 medium',  price: 50,  note: '' },
    { item: 'Green chillies',        qty: '1 pack',    price: 15,  note: '' },
    { item: 'Fresh coriander',       qty: '1 bunch',   price: 15,  note: '' },
    { item: 'Capsicum',              qty: '1',         price: 30,  note: 'For Saturday omelette' },
    { item: 'Cooking spray (0-cal)', qty: '1 can',     price: 0,   note: 'One-time buy; lasts months' },
  ]},
]

function mealStatus(planned, logged) {
  if (!logged) return null
  const lp  = logged.macros?.p || 0
  const lc  = logged.macros?.c || 0
  const lf  = logged.macros?.f || 0
  const lkc = logged.calories ?? (lp * 4 + lc * 4 + lf * 9)
  const proteinOk = lp >= planned.macros.p * 0.75
  const fatOk     = lf <= planned.macros.f * 1.3
  const calOk     = lkc <= planned.cal * 1.25
  const issues = []
  if (!proteinOk) issues.push(`need +${Math.round(planned.macros.p - lp)}g protein`)
  if (!fatOk)     issues.push(`fat over by ${Math.round(lf - planned.macros.f)}g`)
  if (!calOk)     issues.push(`${Math.round(lkc - planned.cal)} kcal over plan`)
  return { ok: proteinOk && fatOk && calOk, issues, lp, lc, lf, lkc }
}

function MealCard({ meal, loggedMeal }) {
  const [open, setOpen] = useState(false)
  const status = mealStatus(meal, loggedMeal)

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
          {meal.note && <span className="text-xs text-gray-400 italic">{meal.note}</span>}
          {status && (
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-lg ${
              status.ok
                ? 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                : 'text-red-500 bg-red-50 border border-red-100'
            }`}>
              {status.ok ? '✓ On track' : `⚠ ${status.issues[0]}`}
            </span>
          )}
        </div>

        <div className="font-semibold text-gray-800 text-sm mb-2">{meal.name}</div>

        {/* Planned macros */}
        <div className="flex gap-3 text-xs">
          <span className="font-semibold text-indigo-600">{meal.macros.p}g P</span>
          <span className="font-semibold text-amber-500">{meal.macros.c}g C</span>
          <span className="font-semibold text-pink-500">{meal.macros.f}g F</span>
          <span className="text-gray-400 ml-auto">{meal.cal} kcal planned</span>
        </div>

        {/* Logged comparison */}
        {status && (
          <div className={`mt-2 pt-2 border-t ${status.ok ? 'border-emerald-100' : 'border-red-100'}`}>
            <div className="text-xs text-gray-400 mb-1">Logged:</div>
            <div className="flex gap-3 text-xs">
              <span className={`font-semibold ${status.lp >= meal.macros.p * 0.75 ? 'text-emerald-600' : 'text-red-500'}`}>
                {status.lp}g P
              </span>
              <span className="font-semibold text-amber-500">{status.lc}g C</span>
              <span className={`font-semibold ${status.lf <= meal.macros.f * 1.3 ? 'text-pink-500' : 'text-red-500'}`}>
                {status.lf}g F
              </span>
              <span className={`ml-auto font-semibold ${status.calOk !== false && status.lkc <= meal.cal * 1.25 ? 'text-gray-500' : 'text-red-500'}`}>
                {status.lkc} kcal
              </span>
            </div>
          </div>
        )}
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

function TodayPlan({ dayIdx, todayLog }) {
  const [viewDay, setViewDay] = useState(dayIdx)
  const plan     = WEEKLY_PLAN[viewDay]
  const isToday  = viewDay === dayIdx
  const loggedMeals = isToday ? (todayLog?.meals || []) : []
  const totalCal = plan.meals.reduce((s, m) => s + m.cal, 0)
  const totalP   = plan.meals.reduce((s, m) => s + m.macros.p, 0)
  const totalC   = plan.meals.reduce((s, m) => s + m.macros.c, 0)
  const totalF   = plan.meals.reduce((s, m) => s + m.macros.f, 0)

  return (
    <div className="space-y-3">
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

      {plan.meals.map((meal, i) => {
        const logged = loggedMeals.find(m => m.label === meal.label)
        return <MealCard key={i} meal={meal} loggedMeal={logged} />
      })}
    </div>
  )
}

function GroceryList() {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState({})
  const isSunday = new Date().getDay() === 0

  const totalCost = GROCERY_LIST.flatMap(c => c.items).reduce((s, it) => s + (it.price || 0), 0)
  const checkedCost = Object.entries(checked)
    .filter(([, v]) => v)
    .reduce((s, [key]) => {
      const [cat, idx] = key.split('-')
      const item = GROCERY_LIST.find(c => c.category === cat)?.items[Number(idx)]
      return s + (item?.price || 0)
    }, 0)
  const remainingCost = totalCost - checkedCost

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛒</span>
          <div className="text-left">
            <div className="font-semibold text-gray-800 text-sm">Weekly Grocery List</div>
            {isSunday
              ? <div className="text-xs text-orange-500 font-semibold">Today is Sunday — shop & prep now!</div>
              : <div className="text-xs text-gray-400">Est. ₹{totalCost.toLocaleString()} / week</div>
            }
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-600">₹{totalCost.toLocaleString()}</span>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {GROCERY_LIST.map(cat => {
            const catTotal = cat.items.reduce((s, it) => s + (it.price || 0), 0)
            return (
              <div key={cat.category}>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-4 pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span>{cat.emoji}</span>{cat.category}</span>
                  <span className="text-gray-400 font-semibold">₹{catTotal.toLocaleString()}</span>
                </div>
                {cat.items.map((it, i) => {
                  const key = `${cat.category}-${i}`
                  const done = checked[key]
                  return (
                    <button key={i} onClick={() => setChecked(c => ({ ...c, [key]: !c[key] }))}
                      className="w-full flex items-start justify-between py-2 border-b border-gray-50 last:border-0 text-left">
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200'}`}>
                          {done && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                        <div>
                          <div className={`text-sm font-medium transition-colors ${done ? 'text-gray-300 line-through' : 'text-gray-700'}`}>{it.item}</div>
                          <div className="text-xs text-gray-400">{it.qty}{it.note ? ` · ${it.note}` : ''}</div>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ml-4 shrink-0 ${done ? 'text-gray-300' : it.price === 0 ? 'text-gray-300' : 'text-indigo-600'}`}>
                        {it.price === 0 ? '—' : `₹${it.price}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}

          {/* Total footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-700">Weekly total</div>
              {checkedCost > 0 && (
                <div className="text-xs text-gray-400">
                  ₹{checkedCost} ticked · ₹{remainingCost} left to buy
                </div>
              )}
            </div>
            <div className="text-lg font-black text-indigo-600">₹{totalCost.toLocaleString()}</div>
          </div>

          <button onClick={() => setChecked({})} className="mt-2 text-xs text-gray-400 hover:text-red-400 transition-colors">↺ reset checklist</button>
        </div>
      )}
    </div>
  )
}

function MealPrepBanner() {
  const dark = useDark()
  return (
    <div className="rounded-2xl px-4 py-3.5 border border-emerald-200"
      style={{ background: dark ? 'linear-gradient(135deg, #052819 0%, #062820 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf9 100%)' }}>
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

export default function Food({ todayLog }) {
  const dayIdx = new Date().getDay()
  return (
    <div className="space-y-4">
      <MealPrepBanner />
      <TodayPlan dayIdx={dayIdx} todayLog={todayLog} />
      <GroceryList />
    </div>
  )
}
