import { AreaChart, Area, LineChart, Line, BarChart, Bar, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { GOALS } from '../../lib/constants'
import { useTooltipStyle, useDark } from '../../lib/DarkContext'

const CATEGORY_COLORS = {
  Food: '#f59e0b', Transport: '#6366f1', Shopping: '#ec4899',
  Entertainment: '#8b5cf6', Health: '#10b981', Rent: '#ef4444',
  Subscriptions: '#06b6d4', Bills: '#f97316', Education: '#14b8a6',
}
const CATEGORY_EMOJI = {
  Food: '🍽️', Transport: '🚗', Shopping: '🛍️',
  Entertainment: '🎉', Health: '💊', Rent: '🏠',
  Subscriptions: '📱', Bills: '📄', Education: '📚',
}

// ── Shared config ────────────────────────────────────────────────────────────
const MONTHLY_SALARY   = 75000
const SAVINGS_GOAL     = 500000
const PROJ_MONTHS      = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
const REQUIRED_MONTHLY = SAVINGS_GOAL / PROJ_MONTHS.length   // ₹50,000

const FIXED_SUBS = [
  { name: 'Claude AI', amount: 2000 },
  { name: 'Netflix',   amount: 199  },
  { name: 'Spotify',   amount: 139  },
]
const FIXED_MONTHLY = FIXED_SUBS.reduce((s, x) => s + x.amount, 0)  // ₹2,338

// ── Savings projection helpers ───────────────────────────────────────────────
function buildSavingsProjection(varMonthlySpend, startBalance) {
  const total = varMonthlySpend + FIXED_MONTHLY
  let balance = startBalance || 0
  let cumSaved = 0
  return PROJ_MONTHS.map((m, i) => {
    const surplus = MONTHLY_SALARY - total
    balance  += surplus
    cumSaved += surplus
    return { month: m, projected: Math.round(cumSaved), target: REQUIRED_MONTHLY * (i + 1), balance: Math.round(balance) }
  })
}

function SavingsProjection({ logs }) {
  const tooltipStyle  = useTooltipStyle()
  const logsWithSpend = logs.filter(l => l.spending?.length)
  const totalSpend    = logsWithSpend.reduce((s, l) => s + l.spending.reduce((a, e) => a + e.amount, 0), 0)
  const avgDailySpend = logsWithSpend.length ? totalSpend / logsWithSpend.length : GOALS.dailyBudget
  const avgMonthlyActual = Math.round(avgDailySpend * 30)
  const varMonthlySpend  = GOALS.monthlyBudget
  const totalMonthly     = varMonthlySpend + FIXED_MONTHLY
  const startBalance     = Number(logs.find(l => l.account_balance)?.account_balance || 0)
  const monthlySurplus   = MONTHLY_SALARY - totalMonthly
  const projectedSaved   = monthlySurplus * PROJ_MONTHS.length
  const onTrack          = projectedSaved >= SAVINGS_GOAL
  const gap              = SAVINGS_GOAL - projectedSaved
  const maxVarMonthly    = MONTHLY_SALARY - REQUIRED_MONTHLY - FIXED_MONTHLY
  const needToCut        = Math.max(0, varMonthlySpend - maxVarMonthly)
  const maxDailyVar      = Math.round(maxVarMonthly / 30)
  const data             = buildSavingsProjection(varMonthlySpend, startBalance)
  const finalBal         = data[data.length - 1]?.balance || 0

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl p-4 border ${onTrack ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Savings Goal</div>
            <div className="text-3xl font-black text-gray-800">₹5,00,000</div>
            <div className="text-xs text-gray-400 mt-0.5">by April 2027 · 10 salary credits of ₹75k on the 7th</div>
          </div>
          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ml-2 ${onTrack ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
            {onTrack ? '✓ On track' : '⚠ Off track'}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">Income</div>
            <div className="text-sm font-bold text-gray-700">₹75,000</div>
            <div className="text-xs text-gray-400">/ month</div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">Total outgo</div>
            <div className={`text-sm font-bold ${totalMonthly > MONTHLY_SALARY - REQUIRED_MONTHLY ? 'text-red-500' : 'text-emerald-600'}`}>
              ₹{totalMonthly.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">var + subs</div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">Monthly saved</div>
            <div className={`text-sm font-bold ${monthlySurplus >= REQUIRED_MONTHLY ? 'text-emerald-600' : 'text-red-500'}`}>
              ₹{monthlySurplus.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">need ₹50k</div>
          </div>
        </div>
        <div className="mt-2.5 bg-white rounded-xl p-2.5 border border-gray-100">
          {onTrack ? (
            <>
              <div className="text-xs font-bold text-emerald-600">
                Projected savings by Apr 2027: ₹{projectedSaved.toLocaleString()} — ₹{Math.abs(gap).toLocaleString()} above goal
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Projected account balance (incl. current ₹{startBalance.toLocaleString()}): ₹{finalBal.toLocaleString()}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-orange-600">
                At current spend: ₹{projectedSaved.toLocaleString()} saved by Apr 2027 — ₹{gap.toLocaleString()} short
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Cap variable spend at ₹{maxVarMonthly.toLocaleString()}/mo (₹{maxDailyVar}/day) — cut ₹{needToCut.toLocaleString()}/mo
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Monthly Budget</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
            <span className="text-sm text-gray-700 font-semibold">Salary (7th)</span>
            <span className="text-sm font-black text-emerald-600">+₹75,000</span>
          </div>
          {FIXED_SUBS.map(s => (
            <div key={s.name} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-500">{s.name}</span>
              <span className="text-sm font-semibold text-gray-400">−₹{s.amount}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-1 border-t border-gray-50">
            <div>
              <span className="text-sm text-gray-600">Variable spend (budget)</span>
              {logsWithSpend.length > 0 && (
                <span className="text-xs text-gray-400 ml-1.5">avg ₹{avgMonthlyActual.toLocaleString()} logged</span>
              )}
            </div>
            <span className={`text-sm font-semibold ${varMonthlySpend > maxVarMonthly ? 'text-red-500' : 'text-gray-500'}`}>
              −₹{varMonthlySpend.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-700">Net saved / month</span>
            <span className={`text-lg font-black ${monthlySurplus >= REQUIRED_MONTHLY ? 'text-emerald-600' : 'text-red-500'}`}>
              ₹{monthlySurplus.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-end">
            <span className={`text-xs font-bold ${monthlySurplus >= REQUIRED_MONTHLY ? 'text-emerald-500' : 'text-red-400'}`}>
              {monthlySurplus >= REQUIRED_MONTHLY
                ? `+₹${(monthlySurplus - REQUIRED_MONTHLY).toLocaleString()} buffer above ₹50k target`
                : `₹${(REQUIRED_MONTHLY - monthlySurplus).toLocaleString()} short of ₹50k target`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-gray-700 font-semibold text-sm">Savings Projection</h3>
            <div className="text-xs text-gray-400">Jul 2026 → Apr 2027 · cumulative</div>
          </div>
          <div className={`text-sm font-bold ${onTrack ? 'text-emerald-600' : 'text-orange-500'}`}>
            ₹{projectedSaved.toLocaleString()}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={46}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'projected' ? 'Your savings' : '₹5L target']} />
            <Line type="monotone" dataKey="target" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="target" />
            <Line type="monotone" dataKey="projected" stroke={onTrack ? '#10b981' : '#f97316'} strokeWidth={2.5}
              dot={{ r: 3, fill: onTrack ? '#10b981' : '#f97316', strokeWidth: 0 }} name="projected" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 rounded" style={{ background: onTrack ? '#10b981' : '#f97316' }} />
            <span>Your savings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 border-t border-dashed border-gray-300" />
            <span>₹5L target</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Variable budget category breakdown ──────────────────────────────────────
// Food = home groceries ~₹1,660/wk × 4 = ₹6,640
//      + office canteen 6 days × ₹75 × 4 wk = ₹1,800  → total ₹8,440 ≈ ₹8,500
// Verified prices: chicken ₹340/kg, eggs ₹60/6, Greek yogurt ₹284/700g,
//   Amul shake ₹50, Diet Coke ₹40/can, canteen meal ~₹75 (mix & match)
// Total must equal GOALS.monthlyBudget (₹20,000)
const VAR_BUDGET_CATS = [
  { cat: 'Food',    amount: 8500, emoji: '🛒', color: '#10b981',
    sub: [
      { label: 'Home groceries', amount: 6600, note: '~₹1,660/wk · chicken, eggs, yogurt, shakes, Diet Coke, pantry' },
      { label: 'Office canteen', amount: 1800, note: '6 days × ₹75 × 4 wks · mix & match' },
    ],
  },
  { cat: 'Outing',  amount: 7600, emoji: '🍽️', color: '#6366f1',
    sub: [
      { label: 'Dining / café',  amount: 5000, note: '~2 meals out/wk' },
      { label: 'Activities',     amount: 2600, note: 'Movies, turf, events, etc.' },
    ],
  },
  { cat: 'Misc',    amount: 3900, emoji: '🎲', color: '#f59e0b',
    sub: [
      { label: 'Petrol',        amount: 1900, note: 'Bike fuel · covers commute + all errands' },
      { label: 'Personal care', amount: 1000, note: 'Haircut, toiletries' },
      { label: 'Sundry',        amount: 1000, note: 'Anything else' },
    ],
  },
]

// ── Balance / spend projection ───────────────────────────────────────────────
function buildBalanceProjection(logs) {
  const today        = new Date()
  const startBalance = Number(logs.find(l => l.account_balance)?.account_balance || 0)

  const spendByMonth = {}
  logs.forEach(l => {
    if (!l.spending?.length || !l.date) return
    const m = l.date.slice(0, 7)
    spendByMonth[m] = (spendByMonth[m] || 0) + l.spending.reduce((s, e) => s + e.amount, 0)
  })

  const rows = []
  let balance = startBalance

  for (let y = 2026, mo = 6; ; mo++) {
    if (mo > 11) { y++; mo = 0 }
    if (y > 2027 || (y === 2027 && mo > 3)) break

    const monthKey     = `${y}-${String(mo + 1).padStart(2, '0')}`
    const daysInMonth  = new Date(y, mo + 1, 0).getDate()
    const isCurrentMonth = y === today.getFullYear() && mo === today.getMonth()
    const isPast       = new Date(y, mo + 1, 0) < new Date(today.getFullYear(), today.getMonth(), 1)
    const actualSpend  = spendByMonth[monthKey] || 0

    let varSpend, spendType
    if (isPast) {
      varSpend  = actualSpend
      spendType = 'actual'
    } else if (isCurrentMonth) {
      const dom     = today.getDate()
      const daily   = dom > 0 ? actualSpend / dom : 0
      varSpend      = Math.round(daily * daysInMonth) || GOALS.monthlyBudget
      spendType     = 'projected'
    } else {
      varSpend  = GOALS.monthlyBudget
      spendType = 'budgeted'
    }

    const openBal  = balance
    balance        = balance + MONTHLY_SALARY - FIXED_MONTHLY - varSpend
    const closeBal = Math.round(balance)
    const over     = varSpend > GOALS.monthlyBudget

    // 8th of next calendar month = report date
    const nextMo = mo === 11 ? new Date(y + 1, 0, 8) : new Date(y, mo + 1, 8)
    const reportStr = nextMo.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

    rows.push({
      month: new Date(y, mo, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      monthKey,
      openBal: Math.round(openBal),
      closeBal,
      varSpend,
      actualSpend,
      over,
      spendType,
      isCurrentMonth,
      isPast,
      daysInMonth,
      dom: isCurrentMonth ? today.getDate() : null,
      dailyRate: isCurrentMonth ? (actualSpend / today.getDate()) : null,
      reportStr,
    })
  }

  return rows
}

function BalanceProjection({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const dark         = useDark()
  const rows         = buildBalanceProjection(logs)
  const current      = rows.find(r => r.isCurrentMonth)
  const chartData    = rows.map(r => ({ month: r.month, spend: r.varSpend, type: r.spendType, over: r.over }))

  return (
    <div className="space-y-3">
      {/* ── Current month status ── */}
      {current && (
        <div className={`rounded-2xl p-4 border ${current.over ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">This Month</div>
              <div className="text-xl font-bold text-gray-800 mt-0.5">
                {current.month} · Day {current.dom}/{current.daysInMonth}
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${current.over ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'}`}>
              {current.over ? '⚠ Over budget' : '✓ On track'}
            </div>
          </div>

          {/* Spend progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-bold text-gray-700">₹{current.actualSpend.toLocaleString()} spent</span>
              <span className="text-gray-400">of ₹{GOALS.monthlyBudget.toLocaleString()} budget</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${current.over ? 'bg-red-400' : 'bg-indigo-400'}`}
                style={{ width: `${Math.min(100, Math.round(current.actualSpend / GOALS.monthlyBudget * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1 text-gray-400">
              <span>{Math.round(current.actualSpend / GOALS.monthlyBudget * 100)}% used · {current.daysInMonth - current.dom} days left</span>
              <span>₹{Math.max(0, GOALS.monthlyBudget - current.actualSpend).toLocaleString()} remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-2.5 border border-gray-100">
              <div className="text-xs text-gray-400">₹/day actual</div>
              <div className={`text-sm font-bold ${(current.dailyRate || 0) > GOALS.dailyBudget ? 'text-red-500' : 'text-indigo-600'}`}>
                ₹{Math.round(current.dailyRate || 0)}
              </div>
              <div className="text-xs text-gray-300">budget ₹{GOALS.dailyBudget}</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-gray-100">
              <div className="text-xs text-gray-400">Month-end est.</div>
              <div className={`text-sm font-bold ${current.over ? 'text-red-500' : 'text-indigo-600'}`}>
                ₹{current.varSpend.toLocaleString()}
              </div>
              <div className="text-xs text-gray-300">budget ₹{GOALS.monthlyBudget.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-gray-100">
              <div className="text-xs text-gray-400">Closing bal.</div>
              <div className="text-sm font-bold text-gray-700">₹{current.closeBal.toLocaleString()}</div>
              <div className="text-xs text-gray-300">report {current.reportStr}</div>
            </div>
          </div>

          {current.over && (
            <div className="mt-2.5 bg-white rounded-xl p-2.5 border border-red-100">
              <div className="text-xs font-bold text-red-500">
                ₹{(current.varSpend - GOALS.monthlyBudget).toLocaleString()} over — spend ≤ ₹{Math.max(0, Math.round((GOALS.monthlyBudget - current.actualSpend) / Math.max(1, current.daysInMonth - current.dom)))} /day to recover
              </div>
            </div>
          )}
          {!current.over && (
            <div className="mt-2.5 bg-white rounded-xl p-2.5 border border-indigo-50">
              <div className="text-xs font-semibold text-indigo-600">
                ₹{Math.max(0, GOALS.monthlyBudget - current.actualSpend).toLocaleString()} left this month · ₹{Math.max(0, Math.round((GOALS.monthlyBudget - current.actualSpend) / Math.max(1, current.daysInMonth - current.dom)))} /day from here
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Variable budget breakdown ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="mb-3">
          <h3 className="text-gray-700 font-semibold text-sm">₹{GOALS.monthlyBudget.toLocaleString()} Variable Budget — Breakdown</h3>
          <div className="text-xs text-gray-400">how the ₹20k is split across categories</div>
        </div>
        {VAR_BUDGET_CATS.map(c => {
          const pct = Math.round(c.amount / GOALS.monthlyBudget * 100)
          return (
            <div key={c.cat} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{c.emoji}</span>
                  <span className="text-sm font-bold text-gray-700">{c.cat}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-sm font-bold text-gray-700">₹{c.amount.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 ml-1">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
              </div>
              {c.sub && (
                <div className="space-y-1 pl-6">
                  {c.sub.map(s => (
                    <div key={s.label} className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-gray-500">{s.label}</span>
                        <span className="text-xs text-gray-300 ml-1.5">{s.note}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400 shrink-0 ml-2">₹{s.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
          <span className="text-xs text-gray-500 font-semibold">Total variable</span>
          <span className="text-sm font-black text-gray-700">
            ₹{VAR_BUDGET_CATS.reduce((s, c) => s + c.amount, 0).toLocaleString()}
            <span className="text-xs font-normal text-gray-400 ml-1">/ ₹{GOALS.monthlyBudget.toLocaleString()} budget</span>
          </span>
        </div>
      </div>

      {/* ── Spend bar chart ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="mb-3">
          <h3 className="text-gray-700 font-semibold text-sm">Monthly Spend vs Budget</h3>
          <div className="text-xs text-gray-400">salary 7th · report 8th · budget ₹{GOALS.monthlyBudget.toLocaleString()}/mo</div>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={44}
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(v, _, props) => [
                `₹${Number(v).toLocaleString()} (${props.payload?.type})`, 'Variable spend',
              ]} />
            <ReferenceLine y={GOALS.monthlyBudget} stroke="#6366f1" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: `₹${(GOALS.monthlyBudget / 1000).toFixed(0)}k`, position: 'insideTopRight', fontSize: 9, fill: '#6366f1' }} />
            <Bar dataKey="spend" radius={[3, 3, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={
                  d.over               ? '#f87171' :
                  d.type === 'actual'  ? '#34d399' :
                  d.type === 'projected' ? '#818cf8' :
                  dark                 ? '#374151' : '#cbd5e1'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span>Actual — under</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-400" /><span>Projected</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400" /><span>Over budget</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: dark ? '#374151' : '#cbd5e1' }} /><span>Planned</span></div>
        </div>
      </div>

      {/* ── Month-by-month table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h3 className="text-gray-700 font-semibold text-sm">Month-by-Month Balance</h3>
          <span className="text-xs text-gray-400">subs ₹{FIXED_MONTHLY.toLocaleString()}/mo</span>
        </div>
        <div className="divide-y divide-gray-50">
          {rows.map(r => (
            <div key={r.monthKey}
              className={`px-4 py-2.5 ${r.isCurrentMonth ? 'bg-indigo-50/60' : r.over && r.spendType !== 'budgeted' ? 'bg-red-50/50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs font-bold w-14 shrink-0 ${r.isCurrentMonth ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {r.month}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                    r.spendType === 'budgeted' ? 'bg-gray-100 text-gray-400' :
                    r.over      ? 'bg-red-100 text-red-500' :
                                  'bg-emerald-100 text-emerald-600'
                  }`}>
                    {r.spendType === 'budgeted'
                      ? 'planned'
                      : r.over
                        ? `+₹${(r.varSpend - GOALS.monthlyBudget).toLocaleString()} over`
                        : `₹${(GOALS.monthlyBudget - r.varSpend).toLocaleString()} under`}
                  </span>
                  {r.spendType === 'projected' && (
                    <span className="text-xs text-gray-300">est.</span>
                  )}
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className={`text-xs font-bold ${
                    r.spendType === 'budgeted' ? 'text-gray-400' :
                    r.over ? 'text-red-500' : 'text-gray-700'
                  }`}>
                    ₹{r.varSpend.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">→ ₹{r.closeBal.toLocaleString()}</div>
                </div>
              </div>
              {r.isCurrentMonth && r.over && (
                <div className="text-xs text-red-400 mt-1 pl-16">
                  Spend ≤ ₹{Math.max(0, Math.round((GOALS.monthlyBudget - r.actualSpend) / Math.max(1, r.daysInMonth - r.dom)))} /day to recover
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">opening + ₹75k − ₹{FIXED_MONTHLY.toLocaleString()} subs − variable = closing</span>
          <span className="text-xs font-bold text-gray-500">Apr '27: ₹{rows[rows.length - 1]?.closeBal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// ── Balance history chart ────────────────────────────────────────────────────
function BalanceChart({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const data = logs.filter(l => l.account_balance).slice(0, 30).reverse()
    .map(l => ({ date: l.date?.slice(5), balance: Number(l.account_balance) }))
  if (!data.length) return <div className="text-center py-8 text-gray-400 text-sm">No balance data yet.</div>

  return (
    <ResponsiveContainer width="100%" height={130}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="balGradFin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={40}
          tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} domain={['dataMin - 1000', 'dataMax + 1000']} />
        <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${Number(v).toLocaleString()}`, 'Balance']} />
        <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2}
          fill="url(#balGradFin)" dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function Finance({ logs }) {
  const tooltipStyle  = useTooltipStyle()
  const logsWithSpend = logs.filter(l => l.spending?.length)
  const totalSpend    = logsWithSpend.reduce((s, l) => s + l.spending.reduce((a, e) => a + e.amount, 0), 0)
  const avgDaily      = logsWithSpend.length ? Math.round(totalSpend / logsWithSpend.length) : 0
  const latestBalance = logs.find(l => l.account_balance)?.account_balance

  const catTotals = {}
  logsWithSpend.forEach(l => l.spending.forEach(s => {
    catTotals[s.category] = (catTotals[s.category] || 0) + s.amount
  }))
  const catData = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-3 fade-up">

      {/* ── Savings goal projection ── */}
      <SavingsProjection logs={logs} />

      {/* ── Spend / balance projection ── */}
      <BalanceProjection logs={logs} />

      {/* Hero — total spent */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Variable Spend — All Time</div>
        <div className="text-4xl font-black text-gray-800">₹{totalSpend.toLocaleString()}</div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>₹{avgDaily.toLocaleString()} / day avg</span>
          <span>·</span>
          <span>~₹{Math.round(avgDaily * 30).toLocaleString()} / month</span>
        </div>
      </div>

      {/* Balance + daily budget row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-100">
          <div className="text-gray-500 text-xs mb-1">Current Balance</div>
          <div className="text-xl font-bold text-emerald-600">
            {latestBalance ? `₹${Number(latestBalance).toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-3.5 border border-indigo-100">
          <div className="text-gray-500 text-xs mb-1">Daily Budget</div>
          <div className="text-xl font-bold text-indigo-600">₹{GOALS.dailyBudget.toLocaleString()}</div>
        </div>
      </div>

      {/* Balance trend (historical) */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Balance History</h3>
        <BalanceChart logs={logs} />
      </div>

      {/* Category breakdown */}
      {catData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold text-sm mb-3">Spent by Category</h3>
          <div className="flex gap-4 items-center mb-4">
            <PieChart width={120} height={120}>
              <Pie data={catData} cx={55} cy={55} innerRadius={34} outerRadius={54}
                dataKey="value" paddingAngle={2}>
                {catData.map((e, i) => <Cell key={i} fill={CATEGORY_COLORS[e.name] || '#94a3b8'} />)}
              </Pie>
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`, '']} contentStyle={tooltipStyle} />
            </PieChart>
            <div className="flex-1 space-y-1.5">
              {catData.slice(0, 4).map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[d.name] || '#94a3b8' }} />
                  <span className="text-gray-600 text-xs flex-1">{d.name}</span>
                  <span className="text-gray-700 text-xs font-semibold">₹{d.value.toLocaleString()}</span>
                  <span className="text-gray-400 text-xs w-7 text-right">{Math.round(d.value / totalSpend * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 border-t border-gray-50 pt-3">
            {catData.map(d => {
              const pct = Math.round(d.value / totalSpend * 100)
              return (
                <div key={d.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{CATEGORY_EMOJI[d.name] || '💸'}</span>
                      <span className="text-xs text-gray-600 font-medium">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">₹{d.value.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: CATEGORY_COLORS[d.name] || '#94a3b8' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent spending */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Recent Spending</h3>
        {logsWithSpend.length ? (
          <div className="space-y-3">
            {logsWithSpend.slice(0, 5).map(l => {
              const dayTotal = l.spending.reduce((s, e) => s + e.amount, 0)
              return (
                <div key={l.date}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-gray-400 text-xs">{l.date}</span>
                    <span className={`text-xs font-semibold ${dayTotal > GOALS.dailyBudget ? 'text-red-400' : 'text-gray-500'}`}>
                      ₹{dayTotal.toLocaleString()}
                    </span>
                  </div>
                  {l.spending.map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: CATEGORY_COLORS[s.category] || '#94a3b8' }} />
                        <span className="text-gray-600 text-xs">{s.item}</span>
                        <span className="text-gray-300 text-xs">{s.category}</span>
                      </div>
                      <span className="text-gray-700 text-xs font-medium">₹{s.amount}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">No spending logged yet.</div>
        )}
      </div>
    </div>
  )
}
