import { useState } from 'react'
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { GOALS } from '../../lib/constants'
import { useTooltipStyle, useDark } from '../../lib/DarkContext'

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHLY_SALARY = 75000
const TOTAL_GOAL     = 500000   // ₹5L savings + investments (excl. vacation fund)
const N_MONTHS       = 10       // Jul 2026 → Apr 2027

// ── Vacation fund ─────────────────────────────────────────────────────────────
const VACATION_MONTHLY = 10000   // ₹10k/mo → separate vacation account
const VACATION_MONTHS  = 6       // Jul → Dec (covers both trips)
const VACATION_TOTAL   = VACATION_MONTHLY * VACATION_MONTHS  // ₹60,000
const VACATIONS = [
  { name: 'Goa',          month: 'Aug', emoji: '🏖️', budget: 20000, desc: 'Aug trip · 2 months saved' },
  { name: 'Lakshadweep',  month: 'Dec', emoji: '🏝️', budget: 40000, desc: 'Dec trip · 4 months saved' },
]

const PROJ_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

const FIXED_SUBS = [
  { name: 'Claude AI', amount: 2000 },
  { name: 'Netflix',   amount: 199  },
  { name: 'Spotify',   amount: 139  },
]
const FIXED_MONTHLY = FIXED_SUBS.reduce((s, x) => s + x.amount, 0)   // ₹2,338

// ── Investment helpers ────────────────────────────────────────────────────────
const DEFAULT_PORTFOLIO = [
  { platform: 'PhonePe MF', invested: 3000,  current: 3026,  color: '#6366f1', emoji: '📱' },
  { platform: 'Kite',       invested: 10266, current: 11995, color: '#f59e0b', emoji: '📈' },
]
const DEFAULT_MONTHLY_SIP  = 26500   // ₹75k − ₹2,338 subs − ₹20k savings − ₹10k vacation − ₹16,162 var
const DEFAULT_SAVINGS_BAL  = 20000   // dedicated savings account — first ₹20k deposited Jul '26

function loadPortfolio() {
  try { return JSON.parse(localStorage.getItem('portfolio')) || DEFAULT_PORTFOLIO }
  catch { return DEFAULT_PORTFOLIO }
}
function loadSip() {
  try { return Number(localStorage.getItem('monthlySIP_v4')) || DEFAULT_MONTHLY_SIP }
  catch { return DEFAULT_MONTHLY_SIP }
}
function loadVacBal() {
  try {
    const v = localStorage.getItem('vacationBal')
    return v !== null ? Number(v) : 0
  }
  catch { return 0 }
}
function loadSavingsBal() {
  try {
    const v = localStorage.getItem('savingsAccountBal')
    return v !== null ? Number(v) : DEFAULT_SAVINGS_BAL
  }
  catch { return DEFAULT_SAVINGS_BAL }
}

// SIP future value: PMT × ((1+r)^n − 1) / r × (1+r)
function sipFV(monthly, rateAnnual, months) {
  if (!rateAnnual || !monthly) return monthly * months
  const r = rateAnnual / 1200
  return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
}
// Lump-sum future value
function lumpFV(amount, rateAnnual, months) {
  if (!rateAnnual) return amount
  return amount * Math.pow(1 + rateAnnual / 1200, months)
}

// ── Budget categories ─────────────────────────────────────────────────────────
const DEFAULT_BUDGET_CATS = [
  { cat: 'Food', emoji: '🛒', color: '#10b981', sub: [
    { label: 'Home groceries', amount: 5500, note: '~₹1,375/wk · chicken, eggs, yogurt, shakes, Diet Coke' },
    { label: 'Office canteen', amount: 1500, note: '5 days × ₹75 × 4 wks' },
  ]},
  { cat: 'Outing', emoji: '🍽️', color: '#6366f1', sub: [
    { label: 'Dining / café', amount: 3500, note: '~2 meals out/wk' },
    { label: 'Activities',    amount: 2500, note: 'Movies, turf, events' },
  ]},
  { cat: 'Misc', emoji: '🎲', color: '#f59e0b', sub: [
    { label: 'Petrol',        amount: 1900, note: 'Bike fuel · commute + errands' },
    { label: 'Personal care', amount: 1000, note: 'Haircut, toiletries' },
    { label: 'Sundry',        amount: 762,  note: 'Anything else' },
  ]},
]
function loadBudgetCats() {
  try { return JSON.parse(localStorage.getItem('budgetCats_v3')) || DEFAULT_BUDGET_CATS }
  catch { return DEFAULT_BUDGET_CATS }
}

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Wealth Goal (unified ₹5.5L view)
// ─────────────────────────────────────────────────────────────────────────────
function WealthGoal({ logs, varMonthlyBudget, sip, portfolio, savingsBal, onUpdateSavingsBal }) {
  const tooltipStyle = useTooltipStyle()
  const [editingBal, setEditingBal] = useState(false)
  const [balVal,     setBalVal]     = useState(String(savingsBal))

  // savingsBal = dedicated savings account (separate from spending account)
  const startBalance          = savingsBal
  const totalPortfolioCurrent = portfolio.reduce((s, p) => s + p.current, 0)
  const currentWealth         = startBalance + totalPortfolioCurrent

  const totalMonthlyOut = varMonthlyBudget + FIXED_MONTHLY + sip + VACATION_MONTHLY
  const monthlyToBank   = MONTHLY_SALARY - totalMonthlyOut

  // Projected at 15% CAGR (main scenario)
  const projBankBal  = Math.round(startBalance + monthlyToBank * N_MONTHS)
  const projPortfolio = Math.round(lumpFV(totalPortfolioCurrent, 15, N_MONTHS) + sipFV(sip, 15, N_MONTHS))
  const projTotal    = projBankBal + projPortfolio
  const onTrack      = projTotal >= TOTAL_GOAL
  const gap          = TOTAL_GOAL - projTotal
  const projPct      = Math.min(100, Math.round(projTotal / TOTAL_GOAL * 100))
  const nowPct       = Math.min(100, Math.round(currentWealth / TOTAL_GOAL * 100))

  // Chart data: month-by-month stacked (bank + portfolio)
  const chartData = PROJ_MONTHS.map((month, i) => {
    const n    = i + 1
    const bank = Math.round(startBalance + monthlyToBank * n)
    const inv  = Math.round(lumpFV(totalPortfolioCurrent, 15, n) + sipFV(sip, 15, n))
    return { month, bank, investments: inv, total: bank + inv }
  })

  // Scenario comparison
  const SCENARIOS = [
    { label: '10% p.a.', rate: 10, color: '#94a3b8' },
    { label: '15% p.a.', rate: 15, color: '#6366f1' },
    { label: '20% p.a.', rate: 20, color: '#10b981' },
  ]
  const scenarios = SCENARIOS.map(s => {
    const bank = Math.round(startBalance + monthlyToBank * N_MONTHS)
    const inv  = Math.round(lumpFV(totalPortfolioCurrent, s.rate, N_MONTHS) + sipFV(sip, s.rate, N_MONTHS))
    return { ...s, bank, investments: inv, total: bank + inv }
  })

  return (
    <div className="space-y-3">
      {/* ── Goal card ── */}
      <div className={`rounded-2xl p-4 border ${onTrack ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Wealth Goal · Apr 2027</div>
            <div className="text-3xl font-black text-gray-800">₹5,00,000</div>
            <div className="text-xs text-gray-500 mt-0.5">dedicated savings account + investment portfolio · 10 salary credits of ₹75k</div>
          </div>
          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ml-2 ${onTrack ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
            {onTrack ? '✓ On track' : '⚠ Close'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Now: ₹{currentWealth.toLocaleString()} <span className="text-gray-400">({nowPct}%)</span></span>
            <span className={`font-semibold ${onTrack ? 'text-emerald-600' : 'text-orange-500'}`}>
              Projected: ₹{projTotal.toLocaleString()} ({projPct}%)
            </span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-100">
            <div className={`h-full rounded-full transition-all duration-700 ${onTrack ? 'bg-emerald-400' : 'bg-orange-400'}`}
              style={{ width: `${projPct}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-400">
            <span>₹0</span>
            <span>₹5L</span>
          </div>
        </div>

        {/* 2×2 stat chips */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">Savings A/c</div>
            {editingBal ? (
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="text-xs text-gray-500">₹</span>
                <input type="number"
                  className="w-full text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-300 rounded px-1 py-0.5 focus:outline-none"
                  value={balVal}
                  onChange={e => setBalVal(e.target.value)}
                  onBlur={() => { onUpdateSavingsBal(Math.max(0, Number(balVal) || 0)); setEditingBal(false) }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingBal(false) }}
                  autoFocus />
              </div>
            ) : (
              <button onClick={() => { setEditingBal(true); setBalVal(String(startBalance)) }}
                className="text-sm font-bold text-gray-700 hover:text-indigo-600 transition-colors text-left w-full mt-0.5">
                ₹{startBalance.toLocaleString()}
              </button>
            )}
            <div className="text-xs text-gray-500">tap to update</div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">Saving / mo</div>
            <div className={`text-sm font-bold ${monthlyToBank >= 0 ? 'text-gray-700' : 'text-red-500'}`}>
              ₹{Math.max(0, monthlyToBank).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">→ ₹{(Math.max(0, projBankBal) / 1000).toFixed(0)}k total</div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">SIP / mo</div>
            <div className="text-sm font-bold text-indigo-600">₹{sip.toLocaleString()}</div>
            <div className="text-xs text-gray-500">→ ₹{(projPortfolio / 1000).toFixed(0)}k portfolio</div>
          </div>
          <div className="bg-white rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">Combined est.</div>
            <div className={`text-sm font-bold ${onTrack ? 'text-emerald-600' : 'text-orange-500'}`}>
              ₹{(projTotal / 1000).toFixed(0)}k
            </div>
            <div className={`text-xs font-semibold ${onTrack ? 'text-emerald-500' : 'text-orange-400'}`}>
              {onTrack
                ? `+₹${((projTotal - TOTAL_GOAL) / 1000).toFixed(0)}k above goal`
                : `₹${(gap / 1000).toFixed(0)}k below goal`}
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className="mt-2.5 bg-white rounded-xl p-2.5 border border-gray-100">
          {onTrack ? (
            <div className="text-xs font-semibold text-emerald-600">
              Bank ₹{(projBankBal / 1000).toFixed(0)}k + portfolio ₹{(projPortfolio / 1000).toFixed(0)}k at 15% CAGR = ₹{(projTotal / 1000).toFixed(0)}k — ₹{((projTotal - TOTAL_GOAL) / 1000).toFixed(0)}k above goal 🎯
            </div>
          ) : (
            <div className="text-xs font-semibold text-orange-600">
              ₹{gap.toLocaleString()} gap at 15% CAGR — invest for 20% returns or reduce variable by ₹{Math.ceil(gap / N_MONTHS).toLocaleString()}/mo
            </div>
          )}
          <div className="text-xs text-gray-400 mt-0.5">
            Savings A/c ₹{startBalance.toLocaleString()} + portfolio ₹{totalPortfolioCurrent.toLocaleString()} = ₹{currentWealth.toLocaleString()} today · spending account is separate
          </div>
        </div>
      </div>

      {/* ── Combined projection chart ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-gray-700 font-semibold text-sm">Wealth Projection</h3>
            <div className="text-xs text-gray-400">bank balance + portfolio · 15% CAGR on investments</div>
          </div>
          <div className={`text-sm font-bold ${onTrack ? 'text-emerald-600' : 'text-orange-500'}`}>
            ₹{(projTotal / 1000).toFixed(0)}k by Apr '27
          </div>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="bankGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={48}
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'bank' ? 'Bank balance' : 'Portfolio value']} />
            <ReferenceLine y={TOTAL_GOAL} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: '₹5L goal', position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />
            <Area type="monotone" dataKey="bank"        stackId="1" stroke="#6366f1" strokeWidth={1.5} fill="url(#bankGrad)" name="bank" />
            <Area type="monotone" dataKey="investments" stackId="1" stroke="#10b981" strokeWidth={1.5} fill="url(#invGrad)"  name="investments" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-400" /><span>Bank balance</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span>Portfolio (SIP + returns)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-0 border-t-2 border-dashed border-amber-400" /><span>₹5L goal</span></div>
        </div>
      </div>

      {/* ── CAGR scenarios ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-1">Return Scenarios — Apr 2027</h3>
        <div className="text-xs text-gray-400 mb-3">how investment returns affect the final total</div>
        <div className="space-y-3.5">
          {scenarios.map(s => {
            const pct    = Math.min(100, Math.round(s.total / TOTAL_GOAL * 100))
            const bPct   = Math.min(100, Math.round(s.bank / TOTAL_GOAL * 100))
            const iPct   = Math.min(100 - bPct, Math.round(s.investments / TOTAL_GOAL * 100))
            const hits   = s.total >= TOTAL_GOAL
            return (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">{s.label}</span>
                    <span className="text-xs text-gray-400">portfolio → ₹{(s.investments / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">₹{(s.total / 1000).toFixed(0)}k</span>
                    <span className={`text-xs font-bold ${hits ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {hits ? `✓ +₹${((s.total - TOTAL_GOAL) / 1000).toFixed(0)}k` : `${pct}%`}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full rounded-l-full" style={{ width: `${bPct}%`, background: '#818cf8' }} />
                  <div className="h-full" style={{ width: `${iPct}%`, background: s.color, opacity: 0.85,
                    borderRadius: bPct + iPct >= 100 ? '0 4px 4px 0' : 0 }} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-300" /><span>Bank savings</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span>Portfolio growth (CAGR varies)</span></div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-gray-50 text-xs text-gray-500">
          ₹{sip.toLocaleString()}/mo SIP · ₹{totalPortfolioCurrent.toLocaleString()} existing · ₹{Math.max(0, monthlyToBank).toLocaleString()}/mo to bank · {N_MONTHS} months
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Monthly Allocation (where every rupee goes)
// ─────────────────────────────────────────────────────────────────────────────
function MonthlyAllocation({ varMonthlyBudget, sip, logs, vacation }) {
  const tooltipStyle = useTooltipStyle()
  const logsWithSpend  = logs.filter(l => l.spending?.length)
  const totalSpend     = logsWithSpend.reduce((s, l) => s + l.spending.reduce((a, e) => a + e.amount, 0), 0)
  const avgMonthlyActual = logsWithSpend.length ? Math.round(totalSpend / logsWithSpend.length * 30) : 0
  const totalMonthlyOut  = varMonthlyBudget + FIXED_MONTHLY + sip + (vacation || 0)
  const monthlyToBank    = Math.max(0, MONTHLY_SALARY - totalMonthlyOut)

  const allocData = [
    { name: 'Savings A/c',  value: monthlyToBank,           color: '#10b981' },
    { name: 'SIP',          value: sip,                     color: '#6366f1' },
    { name: 'Vacation',     value: vacation || 0,           color: '#f472b6' },
    { name: 'Variable',     value: varMonthlyBudget,        color: '#f59e0b' },
    { name: 'Subs',         value: FIXED_MONTHLY,       color: '#06b6d4' },
  ].filter(d => d.value > 0)

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="text-gray-700 font-semibold text-sm mb-3">Monthly Allocation — ₹75,000</h3>
      <div className="flex gap-4 items-center mb-4">
        <PieChart width={110} height={110}>
          <Pie data={allocData} cx={50} cy={50} innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
            {allocData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${Number(v).toLocaleString()}`, '']} />
        </PieChart>
        <div className="flex-1 space-y-2">
          {allocData.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-gray-600 flex-1">{d.name}</span>
              <span className="text-xs font-bold text-gray-700">₹{d.value.toLocaleString()}</span>
              <span className="text-xs text-gray-400 w-8 text-right">{Math.round(d.value / MONTHLY_SALARY * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-1 border-t border-gray-50 pt-3">
        <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
          <span className="text-sm text-gray-700 font-bold">Salary (7th)</span>
          <span className="text-sm font-black text-emerald-600">+₹75,000</span>
        </div>
        {FIXED_SUBS.map(s => (
          <div key={s.name} className="flex items-center justify-between py-0.5">
            <span className="text-sm text-gray-500">{s.name}</span>
            <span className="text-sm text-gray-400">−₹{s.amount}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Monthly SIP</span>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.5 rounded">investing</span>
          </div>
          <span className="text-sm font-semibold text-indigo-600">−₹{sip.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Savings account transfer</span>
            <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-1.5 py-0.5 rounded">saving</span>
          </div>
          <span className="text-sm font-semibold text-emerald-600">−₹{monthlyToBank.toLocaleString()}</span>
        </div>
        {vacation > 0 && (
          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Vacation fund ✈️</span>
              <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-1.5 py-0.5 rounded">Jul–Dec</span>
            </div>
            <span className="text-sm font-semibold text-pink-500">−₹{vacation.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-0.5 border-t border-gray-50 mt-1 pt-1.5">
          <div>
            <span className="text-sm text-gray-600">Variable spend</span>
            {avgMonthlyActual > 0 && (
              <span className="text-xs text-gray-400 ml-1.5">avg ₹{avgMonthlyActual.toLocaleString()} actual</span>
            )}
          </div>
          <span className="text-sm text-gray-400">−₹{varMonthlyBudget.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-sm font-bold text-gray-700">Spending account buffer</span>
          <span className="text-lg font-black text-gray-500">~₹29,000</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>Savings A/c: ₹{monthlyToBank.toLocaleString()}/mo × 10 → ₹{(monthlyToBank * N_MONTHS).toLocaleString()}</span>
          <span>SIP: ₹{sip.toLocaleString()}/mo growing</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Budget Breakdown (editable variable spend)
// ─────────────────────────────────────────────────────────────────────────────
function BudgetBreakdown({ cats, onUpdate }) {
  const [editing, setEditing] = useState(null)
  const total = cats.reduce((s, c) => s + c.sub.reduce((ss, sub) => ss + sub.amount, 0), 0)

  function commit(ci, si, raw) {
    const amount = Math.max(0, parseInt(raw) || 0)
    onUpdate(cats.map((c, i) => i !== ci ? c : {
      ...c, sub: c.sub.map((s, j) => j !== si ? s : { ...s, amount })
    }))
    setEditing(null)
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-gray-700 font-semibold text-sm">Variable Budget — Breakdown</h3>
        <span className="text-sm font-black text-gray-700">₹{total.toLocaleString()}</span>
      </div>
      <div className="text-xs text-gray-400 mb-3">tap any amount to edit</div>

      {cats.map((c, ci) => {
        const catTotal = c.sub.reduce((s, sub) => s + sub.amount, 0)
        const pct = total > 0 ? Math.round(catTotal / total * 100) : 0
        return (
          <div key={c.cat} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{c.emoji}</span>
                <span className="text-sm font-bold text-gray-700">{c.cat}</span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="text-sm font-bold text-gray-700">₹{catTotal.toLocaleString()}</span>
                <span className="text-xs text-gray-400 ml-1">{pct}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
            </div>
            <div className="space-y-1.5 pl-6">
              {c.sub.map((s, si) => {
                const isEd = editing?.ci === ci && editing?.si === si
                return (
                  <div key={s.label} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-gray-500">{s.label}</span>
                      <span className="text-xs text-gray-300 ml-1.5 hidden sm:inline">{s.note}</span>
                    </div>
                    {isEd ? (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <span className="text-xs text-gray-400">₹</span>
                        <input type="number"
                          className="w-20 text-right text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-300 rounded-lg px-1.5 py-0.5 focus:outline-none"
                          value={editing.val}
                          onChange={e => setEditing(ed => ({ ...ed, val: e.target.value }))}
                          onBlur={() => commit(ci, si, editing.val)}
                          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(null) }}
                          autoFocus />
                      </div>
                    ) : (
                      <button onClick={() => setEditing({ ci, si, val: s.amount })}
                        className="text-xs font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 shrink-0 px-2 py-0.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                        ₹{s.amount.toLocaleString()}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-1">
        <span className="text-xs text-gray-500 font-semibold">Total variable</span>
        <span className="text-sm font-black text-gray-700">₹{total.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Vacation Fund
// ─────────────────────────────────────────────────────────────────────────────
function VacationFund({ vacBal, onUpdateVacBal }) {
  const [editing, setEditing] = useState(false)
  const [balVal,  setBalVal]  = useState(String(vacBal))

  const pct      = Math.min(100, Math.round(vacBal / VACATION_TOTAL * 100))
  const goaPct   = Math.min(100, Math.round(vacBal / VACATIONS[0].budget * 100))
  const lakshPct = Math.min(100, Math.round(Math.max(0, vacBal - VACATIONS[0].budget) / VACATIONS[1].budget * 100))

  const goaReady   = vacBal >= VACATIONS[0].budget
  const lakshReady = vacBal >= VACATION_TOTAL
  const monthsSaved = Math.round(vacBal / VACATION_MONTHLY)

  return (
    <div className="space-y-3">
      {/* Main fund card */}
      <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Vacation Fund ✈️</div>
            <div className="text-3xl font-black text-gray-800">₹{VACATION_TOTAL.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">₹{VACATION_MONTHLY.toLocaleString()}/mo × 6 months (Jul–Dec)</div>
          </div>
          <div className="px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ml-2 bg-pink-500 text-white">
            {pct}% saved
          </div>
        </div>

        {/* Current balance chip */}
        <div className="bg-white rounded-xl p-2.5 border border-pink-100 mb-3">
          <div className="text-xs text-gray-400 mb-0.5">Vacation account balance</div>
          {editing ? (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">₹</span>
              <input type="number"
                className="flex-1 text-lg font-black text-pink-600 bg-pink-50 border border-pink-300 rounded-lg px-2 py-0.5 focus:outline-none"
                value={balVal}
                onChange={e => setBalVal(e.target.value)}
                onBlur={() => { onUpdateVacBal(Math.max(0, Number(balVal) || 0)); setEditing(false) }}
                onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false) }}
                autoFocus />
            </div>
          ) : (
            <button onClick={() => { setEditing(true); setBalVal(String(vacBal)) }}
              className="text-2xl font-black text-pink-600 hover:text-pink-800 transition-colors text-left">
              ₹{vacBal.toLocaleString()}
            </button>
          )}
          <div className="text-xs text-gray-400 mt-0.5">tap to update · {monthsSaved} of 6 months deposited</div>
        </div>

        {/* Overall progress */}
        <div className="mb-1.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">₹{vacBal.toLocaleString()} saved</span>
            <span className="font-semibold text-pink-600">₹{(VACATION_TOTAL - vacBal).toLocaleString()} to go</span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden border border-pink-100">
            <div className="h-full rounded-full transition-all duration-700 bg-pink-400"
              style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-400">
            <span>₹0</span>
            <span>₹{(VACATION_TOTAL / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      {/* Trip milestones */}
      <div className="grid grid-cols-2 gap-3">
        {VACATIONS.map((v, i) => {
          const ready   = i === 0 ? goaReady : lakshReady
          const tripPct = i === 0 ? goaPct : lakshPct
          const saved   = i === 0 ? Math.min(vacBal, v.budget) : Math.max(0, vacBal - VACATIONS[0].budget)
          return (
            <div key={v.name} className={`rounded-2xl p-3.5 border ${ready ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'} shadow-sm`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xl">{v.emoji}</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">{v.name}</div>
                  <div className="text-xs text-gray-400">{v.month}</div>
                </div>
              </div>
              <div className={`text-base font-black mb-0.5 ${ready ? 'text-emerald-600' : 'text-gray-700'}`}>
                ₹{v.budget.toLocaleString()}
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full transition-all ${ready ? 'bg-emerald-400' : 'bg-pink-400'}`}
                  style={{ width: `${tripPct}%` }} />
              </div>
              <div className="text-xs text-gray-400">{v.desc}</div>
              <div className={`text-xs font-semibold mt-1 ${ready ? 'text-emerald-600' : 'text-pink-500'}`}>
                {ready ? '✓ Funded!' : `₹${saved.toLocaleString()} / ₹${v.budget.toLocaleString()}`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Investment Portfolio (current state + editable + SIP)
// ─────────────────────────────────────────────────────────────────────────────
function InvestmentPortfolio({ portfolio, onUpdatePortfolio, sip, onUpdateSip }) {
  const tooltipStyle = useTooltipStyle()
  const [editCell,    setEditCell]    = useState(null)   // { pi, field, val }
  const [editingSip,  setEditingSip]  = useState(false)
  const [sipVal,      setSipVal]      = useState(String(sip))

  const totalInvested  = portfolio.reduce((s, p) => s + p.invested, 0)
  const totalCurrent   = portfolio.reduce((s, p) => s + p.current,  0)
  const totalGain      = totalCurrent - totalInvested
  const totalReturnPct = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : '0.0'

  function commitCell(pi, field, raw) {
    const val = Math.max(0, parseFloat(raw) || 0)
    onUpdatePortfolio(portfolio.map((p, i) => i !== pi ? p : { ...p, [field]: val }))
    setEditCell(null)
  }

  function Editable({ pi, field, value, color, bold }) {
    const isEd = editCell?.pi === pi && editCell?.field === field
    if (isEd) return (
      <div className="flex items-center gap-0.5">
        <span className="text-xs text-gray-500">₹</span>
        <input type="number"
          className="w-20 text-right text-xs font-bold bg-white border border-indigo-300 rounded-lg px-1.5 py-0.5 focus:outline-none"
          style={{ color }}
          value={editCell.val}
          onChange={e => setEditCell(ec => ({ ...ec, val: e.target.value }))}
          onBlur={() => commitCell(pi, field, editCell.val)}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditCell(null) }}
          autoFocus />
      </div>
    )
    return (
      <button onClick={() => setEditCell({ pi, field, val: value })}
        className={`text-xs ${bold ? 'font-bold text-sm' : 'font-semibold'} hover:opacity-60 transition-opacity`}
        style={{ color }}>
        ₹{Number(value).toLocaleString()}
      </button>
    )
  }

  const barData = portfolio.map(p => ({ name: p.platform, invested: p.invested, current: p.current }))

  return (
    <div className="space-y-3">
      {/* Portfolio header */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Investment Portfolio</div>
            <div className="text-3xl font-black text-gray-800">₹{totalCurrent.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">current value · ₹{totalInvested.toLocaleString()} invested</div>
          </div>
          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ml-2 border ${totalGain >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
            {totalGain >= 0 ? '▲' : '▼'} ₹{Math.abs(totalGain).toLocaleString()} ({totalReturnPct}%)
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">Invested</div>
            <div className="text-sm font-bold text-gray-700">₹{totalInvested.toLocaleString()}</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
            <div className="text-xs text-gray-400">Current</div>
            <div className="text-sm font-bold text-emerald-600">₹{totalCurrent.toLocaleString()}</div>
          </div>
          <div className={`rounded-xl p-2.5 border ${totalGain >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
            <div className="text-xs text-gray-400">Overall return</div>
            <div className={`text-sm font-bold ${totalGain >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
              {totalGain >= 0 ? '+' : ''}{totalReturnPct}%
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">tap values to update as portfolio changes</div>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-2 gap-3">
        {portfolio.map((p, pi) => {
          const gain = p.current - p.invested
          const pct  = p.invested > 0 ? ((gain / p.invested) * 100).toFixed(1) : '0.0'
          return (
            <div key={p.platform} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{p.emoji}</span>
                <span className="text-xs font-bold text-gray-700">{p.platform}</span>
              </div>
              <div className="text-xs text-gray-400 mb-0.5">current value</div>
              <Editable pi={pi} field="current" value={p.current} color={p.color} bold />
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <span>inv:</span>
                <Editable pi={pi} field="invested" value={p.invested} color="#6b7280" />
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2 mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (p.current / (p.invested * 1.5)) * 100)}%`, background: p.color }} />
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">{pct}% return</span>
                <span className={`text-xs font-bold ${gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {gain >= 0 ? '+' : ''}₹{gain.toLocaleString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Returns bar chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Invested vs Current Value</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={barData} barGap={4} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={48}
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'invested' ? 'Invested' : 'Current value']} />
            <Bar dataKey="invested" fill="#e0e7ff" radius={[3, 3, 0, 0]} name="invested" />
            <Bar dataKey="current" radius={[3, 3, 0, 0]} name="current">
              {barData.map((_, i) => <Cell key={i} fill={portfolio[i].color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-100" /><span>Invested</span></div>
          {portfolio.map(p => (
            <div key={p.platform} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: p.color }} /><span>{p.platform}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly SIP */}
      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monthly SIP</div>
          {!editingSip && (
            <button onClick={() => { setEditingSip(true); setSipVal(String(sip)) }}
              className="text-xs text-indigo-500 font-semibold hover:text-indigo-700">edit</button>
          )}
        </div>
        {editingSip ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500 font-bold">₹</span>
            <input type="number"
              className="flex-1 text-2xl font-black text-indigo-700 bg-white border border-indigo-300 rounded-xl px-3 py-1.5 focus:outline-none"
              value={sipVal}
              onChange={e => setSipVal(e.target.value)}
              onBlur={() => { const v = Math.max(0, parseInt(sipVal) || 0); onUpdateSip(v); setEditingSip(false) }}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingSip(false) }}
              autoFocus />
            <span className="text-gray-500">/ mo</span>
          </div>
        ) : (
          <div className="text-3xl font-black text-indigo-700 mt-1">
            ₹{sip.toLocaleString()}<span className="text-base font-normal text-indigo-400"> / month</span>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1.5">
          deducted from salary before bank savings · grows as part of portfolio
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — Monthly Cash Flow (balance projection)
// ─────────────────────────────────────────────────────────────────────────────
function buildCashFlow(logs, varMonthlyBudget, sip) {
  const today        = new Date()
  const startBalance = Number(logs.find(l => l.account_balance)?.account_balance || 29000)
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
    const monthKey       = `${y}-${String(mo + 1).padStart(2, '0')}`
    const daysInMonth    = new Date(y, mo + 1, 0).getDate()
    const isCurrentMonth = y === today.getFullYear() && mo === today.getMonth()
    const isPast         = new Date(y, mo + 1, 0) < new Date(today.getFullYear(), today.getMonth(), 1)
    const actualSpend    = spendByMonth[monthKey] || 0

    let varSpend, spendType
    if (isPast) {
      varSpend = actualSpend; spendType = 'actual'
    } else if (isCurrentMonth) {
      const dom = today.getDate()
      varSpend = Math.round((dom > 0 ? actualSpend / dom : 0) * daysInMonth) || varMonthlyBudget
      spendType = 'projected'
    } else {
      varSpend = varMonthlyBudget; spendType = 'budgeted'
    }

    const openBal = balance
    balance = balance + MONTHLY_SALARY - FIXED_MONTHLY - sip - varSpend
    const closeBal = Math.round(balance)
    const over     = varSpend > varMonthlyBudget
    const nextMo   = mo === 11 ? new Date(y + 1, 0, 8) : new Date(y, mo + 1, 8)

    rows.push({
      month: new Date(y, mo, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      monthKey, openBal: Math.round(openBal), closeBal, varSpend, actualSpend,
      over, spendType, isCurrentMonth, isPast, daysInMonth,
      dom: isCurrentMonth ? today.getDate() : null,
      dailyRate: isCurrentMonth && today.getDate() > 0 ? (actualSpend / today.getDate()) : null,
      reportStr: nextMo.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    })
  }
  return rows
}

function CashFlow({ logs, varMonthlyBudget, sip }) {
  const tooltipStyle = useTooltipStyle()
  const dark         = useDark()
  const rows         = buildCashFlow(logs, varMonthlyBudget, sip)
  const current      = rows.find(r => r.isCurrentMonth)
  const chartData    = rows.map(r => ({ month: r.month, spend: r.varSpend, type: r.spendType, over: r.over }))

  return (
    <div className="space-y-3">
      {/* This month tracker */}
      {current && (
        <div className={`rounded-2xl p-4 border ${current.over ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">This Month</div>
              <div className="text-xl font-bold text-gray-800 mt-0.5">{current.month} · Day {current.dom}/{current.daysInMonth}</div>
            </div>
            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${current.over ? 'bg-red-500 text-white' : 'bg-indigo-500 text-white'}`}>
              {current.over ? '⚠ Over budget' : '✓ On track'}
            </div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-bold text-gray-700">₹{current.actualSpend.toLocaleString()} spent</span>
              <span className="text-gray-400">of ₹{varMonthlyBudget.toLocaleString()} budget</span>
            </div>
            <div className="h-2.5 bg-white rounded-full overflow-hidden border border-gray-100">
              <div className={`h-full rounded-full transition-all ${current.over ? 'bg-red-400' : 'bg-indigo-400'}`}
                style={{ width: `${Math.min(100, Math.round(current.actualSpend / varMonthlyBudget * 100))}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-1 text-gray-400">
              <span>{Math.round(current.actualSpend / varMonthlyBudget * 100)}% used · {current.daysInMonth - current.dom} days left</span>
              <span>₹{Math.max(0, varMonthlyBudget - current.actualSpend).toLocaleString()} remaining</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-xl p-2.5 border border-gray-100">
              <div className="text-xs text-gray-400">₹/day rate</div>
              <div className={`text-sm font-bold ${(current.dailyRate || 0) > GOALS.dailyBudget ? 'text-red-500' : 'text-indigo-600'}`}>
                ₹{Math.round(current.dailyRate || 0)}
              </div>
              <div className="text-xs text-gray-500">target ₹{GOALS.dailyBudget}</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-gray-100">
              <div className="text-xs text-gray-400">Month-end est.</div>
              <div className={`text-sm font-bold ${current.over ? 'text-red-500' : 'text-indigo-600'}`}>₹{current.varSpend.toLocaleString()}</div>
              <div className="text-xs text-gray-500">budget ₹{varMonthlyBudget.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-gray-100">
              <div className="text-xs text-gray-400">Closing bal.</div>
              <div className="text-sm font-bold text-gray-700">₹{current.closeBal.toLocaleString()}</div>
              <div className="text-xs text-gray-500">report {current.reportStr}</div>
            </div>
          </div>
          <div className="mt-2.5 bg-white rounded-xl p-2.5 border border-gray-100">
            {current.over ? (
              <div className="text-xs font-bold text-red-500">
                ₹{(current.varSpend - varMonthlyBudget).toLocaleString()} over — spend ≤ ₹{Math.max(0, Math.round((varMonthlyBudget - current.actualSpend) / Math.max(1, current.daysInMonth - current.dom)))} /day to recover
              </div>
            ) : (
              <div className="text-xs font-semibold text-indigo-600">
                ₹{Math.max(0, varMonthlyBudget - current.actualSpend).toLocaleString()} left · ₹{Math.max(0, Math.round((varMonthlyBudget - current.actualSpend) / Math.max(1, current.daysInMonth - current.dom)))} /day from here
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly spend bar chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="mb-3">
          <h3 className="text-gray-700 font-semibold text-sm">Monthly Spend vs Budget</h3>
          <div className="text-xs text-gray-400">salary 7th · budget ₹{varMonthlyBudget.toLocaleString()}/mo</div>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={44}
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(v, _, p) => [`₹${Number(v).toLocaleString()} (${p.payload?.type})`, 'Variable spend']} />
            <ReferenceLine y={varMonthlyBudget} stroke="#6366f1" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: `₹${(varMonthlyBudget / 1000).toFixed(0)}k`, position: 'insideTopRight', fontSize: 9, fill: '#6366f1' }} />
            <Bar dataKey="spend" radius={[3, 3, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={
                  d.over ? '#f87171' :
                  d.type === 'actual'    ? '#34d399' :
                  d.type === 'projected' ? '#818cf8' :
                  dark ? '#374151' : '#cbd5e1'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span>Actual</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-400" /><span>Projected</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-400" /><span>Over budget</span></div>
        </div>
      </div>

      {/* Month table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h3 className="text-gray-700 font-semibold text-sm">Month-by-Month Balance</h3>
          <span className="text-xs text-gray-400">subs ₹{FIXED_MONTHLY.toLocaleString()} + SIP ₹{sip.toLocaleString()}/mo</span>
        </div>
        <div className="divide-y divide-gray-50">
          {rows.map(r => (
            <div key={r.monthKey}
              className={`px-4 py-2.5 ${r.isCurrentMonth ? 'bg-indigo-50/60' : r.over && r.spendType !== 'budgeted' ? 'bg-red-50/50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs font-bold w-14 shrink-0 ${r.isCurrentMonth ? 'text-indigo-600' : 'text-gray-500'}`}>{r.month}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                    r.spendType === 'budgeted' ? 'bg-gray-100 text-gray-400' :
                    r.over ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {r.spendType === 'budgeted' ? 'planned' :
                     r.over ? `+₹${(r.varSpend - varMonthlyBudget).toLocaleString()} over` :
                     `₹${(varMonthlyBudget - r.varSpend).toLocaleString()} under`}
                  </span>
                  {r.spendType === 'projected' && <span className="text-xs text-gray-400">est.</span>}
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className={`text-xs font-bold ${r.spendType === 'budgeted' ? 'text-gray-400' : r.over ? 'text-red-500' : 'text-gray-700'}`}>
                    ₹{r.varSpend.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">→ ₹{r.closeBal.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between">
          <span className="text-xs text-gray-400">+₹75k − subs − SIP − variable = closing bank balance</span>
          <span className="text-xs font-bold text-gray-500">Apr '27: ₹{rows[rows.length - 1]?.closeBal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — Balance history + Spending stats
// ─────────────────────────────────────────────────────────────────────────────
function BalanceChart({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const data = logs.filter(l => l.account_balance).slice(0, 30).reverse()
    .map(l => ({ date: l.date?.slice(5), balance: Number(l.account_balance) }))
  if (!data.length) return <div className="text-center py-8 text-gray-400 text-sm">No balance data yet.</div>
  return (
    <ResponsiveContainer width="100%" height={130}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={40}
          tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} domain={['dataMin - 1000', 'dataMax + 1000']} />
        <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${Number(v).toLocaleString()}`, 'Balance']} />
        <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2}
          fill="url(#balGrad)" dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

export default function Finance({ logs }) {
  const tooltipStyle = useTooltipStyle()

  const [budgetCats,   setBudgetCats]   = useState(loadBudgetCats)
  const [portfolio,    setPortfolio]    = useState(loadPortfolio)
  const [sip,          setSip]          = useState(loadSip)
  const [savingsBal,   setSavingsBal]   = useState(loadSavingsBal)
  const [vacBal,       setVacBal]       = useState(loadVacBal)

  const varMonthlyBudget = budgetCats.reduce((s, c) => s + c.sub.reduce((ss, sub) => ss + sub.amount, 0), 0)

  function handleBudgetUpdate(next) { setBudgetCats(next); localStorage.setItem('budgetCats_v3', JSON.stringify(next)) }
  function handlePortfolioUpdate(next) { setPortfolio(next); localStorage.setItem('portfolio', JSON.stringify(next)) }
  function handleSipUpdate(val) { setSip(val); localStorage.setItem('monthlySIP_v4', String(val)) }
  function handleSavingsBalUpdate(val) { setSavingsBal(val); localStorage.setItem('savingsAccountBal', String(val)) }
  function handleVacBalUpdate(val) { setVacBal(val); localStorage.setItem('vacationBal', String(val)) }

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

      {/* ── Goal + combined projection ── */}
      <WealthGoal
        logs={logs}
        varMonthlyBudget={varMonthlyBudget}
        sip={sip}
        portfolio={portfolio}
        savingsBal={savingsBal}
        onUpdateSavingsBal={handleSavingsBalUpdate}
      />

      <Divider label="💸 Monthly Plan" />

      {/* ── Where every rupee goes ── */}
      <MonthlyAllocation varMonthlyBudget={varMonthlyBudget} sip={sip} logs={logs} vacation={VACATION_MONTHLY} />

      {/* ── Editable variable spend ── */}
      <BudgetBreakdown cats={budgetCats} onUpdate={handleBudgetUpdate} />

      <Divider label="✈️ Vacation Fund" />

      <VacationFund vacBal={vacBal} onUpdateVacBal={handleVacBalUpdate} />

      <Divider label="📈 Investments" />

      {/* ── Portfolio + SIP ── */}
      <InvestmentPortfolio
        portfolio={portfolio}
        onUpdatePortfolio={handlePortfolioUpdate}
        sip={sip}
        onUpdateSip={handleSipUpdate}
      />

      <Divider label="💳 Cash Flow" />

      {/* ── Month-by-month balance ── */}
      <CashFlow logs={logs} varMonthlyBudget={varMonthlyBudget} sip={sip} />

      {/* ── Balance + spend summary ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Total Variable Spend — All Time</div>
        <div className="text-4xl font-black text-gray-800">₹{totalSpend.toLocaleString()}</div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>₹{avgDaily.toLocaleString()} / day avg</span>
          <span>·</span>
          <span>~₹{Math.round(avgDaily * 30).toLocaleString()} / month</span>
        </div>
      </div>

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

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Balance History</h3>
        <BalanceChart logs={logs} />
      </div>

      {catData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold text-sm mb-3">Spent by Category</h3>
          <div className="flex gap-4 items-center mb-4">
            <PieChart width={120} height={120}>
              <Pie data={catData} cx={55} cy={55} innerRadius={34} outerRadius={54} dataKey="value" paddingAngle={2}>
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
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[s.category] || '#94a3b8' }} />
                        <span className="text-gray-600 text-xs">{s.item}</span>
                        <span className="text-gray-400 text-xs">{s.category}</span>
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
