import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { GOALS } from '../../lib/constants'
import { useTooltipStyle } from '../../lib/DarkContext'

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

// ── Savings goal config ──────────────────────────────────────────────────────
const MONTHLY_SALARY   = 75000
const SAVINGS_GOAL     = 500000
const PROJ_MONTHS      = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
const REQUIRED_MONTHLY = SAVINGS_GOAL / PROJ_MONTHS.length   // ₹50,000 / month

const FIXED_SUBS = [
  { name: 'Claude AI', amount: 2000 },
  { name: 'Netflix',   amount: 199  },
  { name: 'Spotify',   amount: 139  },
]
const FIXED_MONTHLY = FIXED_SUBS.reduce((s, x) => s + x.amount, 0)  // ₹2,338

function buildProjection(varMonthlySpend, startBalance) {
  const totalMonthlySpend = varMonthlySpend + FIXED_MONTHLY
  let balance  = startBalance || 0
  let cumSaved = 0
  return PROJ_MONTHS.map((m, i) => {
    const surplus = MONTHLY_SALARY - totalMonthlySpend
    balance  += surplus
    cumSaved += surplus
    return {
      month:     m,
      projected: Math.round(cumSaved),
      target:    REQUIRED_MONTHLY * (i + 1),
      balance:   Math.round(balance),
    }
  })
}

function SavingsProjection({ logs }) {
  const tooltipStyle = useTooltipStyle()

  const logsWithSpend   = logs.filter(l => l.spending?.length)
  const totalSpend      = logsWithSpend.reduce((s, l) => s + l.spending.reduce((a, e) => a + e.amount, 0), 0)
  const avgDailySpend   = logsWithSpend.length ? totalSpend / logsWithSpend.length : GOALS.dailyBudget
  const varMonthlySpend = Math.round(avgDailySpend * 30)
  const totalMonthly    = varMonthlySpend + FIXED_MONTHLY

  const startBalance   = Number(logs.find(l => l.account_balance)?.account_balance || 0)
  const monthlySurplus = MONTHLY_SALARY - totalMonthly
  const projectedSaved = monthlySurplus * PROJ_MONTHS.length
  const onTrack        = projectedSaved >= SAVINGS_GOAL
  const gap            = SAVINGS_GOAL - projectedSaved
  const maxVarMonthly  = MONTHLY_SALARY - REQUIRED_MONTHLY - FIXED_MONTHLY  // max variable spend
  const needToCut      = Math.max(0, varMonthlySpend - maxVarMonthly)
  const maxDailyVar    = Math.round(maxVarMonthly / 30)

  const data        = buildProjection(varMonthlySpend, startBalance)
  const finalBal    = data[data.length - 1]?.balance || 0

  return (
    <div className="space-y-3">
      {/* ── Hero card ── */}
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

        {/* 3 stat tiles */}
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

        {/* Verdict row */}
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

      {/* ── Monthly breakdown ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Monthly Budget Breakdown</h3>

        <div className="space-y-2">
          {/* Income */}
          <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">IN</span>
              <span className="text-sm text-gray-700 font-semibold">Salary (7th)</span>
            </div>
            <span className="text-sm font-black text-emerald-600">+₹75,000</span>
          </div>

          {/* Fixed subs */}
          <div className="pt-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Fixed subscriptions — ₹{FIXED_MONTHLY.toLocaleString()}/mo</div>
            {FIXED_SUBS.map(s => (
              <div key={s.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded">📱</span>
                  <span className="text-sm text-gray-600">{s.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-500">−₹{s.amount}</span>
              </div>
            ))}
          </div>

          {/* Variable */}
          <div className="pt-1 border-t border-gray-50">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Variable spend — avg from logs</div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">~</span>
                <div>
                  <span className="text-sm text-gray-600">Daily expenses</span>
                  <span className="text-xs text-gray-400 ml-1.5">₹{Math.round(avgDailySpend)}/day × 30</span>
                </div>
              </div>
              <span className={`text-sm font-semibold ${varMonthlySpend > maxVarMonthly ? 'text-red-500' : 'text-gray-500'}`}>
                −₹{varMonthlySpend.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Net */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-1">
            <span className="text-sm font-bold text-gray-700">Net saved / month</span>
            <span className={`text-lg font-black ${monthlySurplus >= REQUIRED_MONTHLY ? 'text-emerald-600' : 'text-red-500'}`}>
              ₹{monthlySurplus.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-gray-400">Need ₹50,000/month to hit ₹5L by Apr 2027</span>
            <span className={`text-xs font-bold ${monthlySurplus >= REQUIRED_MONTHLY ? 'text-emerald-500' : 'text-red-400'}`}>
              {monthlySurplus >= REQUIRED_MONTHLY
                ? `+₹${(monthlySurplus - REQUIRED_MONTHLY).toLocaleString()} buffer`
                : `₹${(REQUIRED_MONTHLY - monthlySurplus).toLocaleString()} short`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Projection chart ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-gray-700 font-semibold text-sm">Savings Projection</h3>
            <div className="text-xs text-gray-400">Jul 2026 → Apr 2027 · cumulative savings</div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <div className="text-xs text-gray-400">Projected Apr 2027</div>
            <div className={`text-sm font-bold ${onTrack ? 'text-emerald-600' : 'text-orange-500'}`}>
              ₹{projectedSaved.toLocaleString()}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={46}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(v, name) => [
                `₹${Number(v).toLocaleString()}`,
                name === 'projected' ? 'Your savings' : '₹5L target',
              ]} />
            <Line type="monotone" dataKey="target" stroke="#d1d5db" strokeWidth={1.5}
              strokeDasharray="5 4" dot={false} name="target" />
            <Line type="monotone" dataKey="projected"
              stroke={onTrack ? '#10b981' : '#f97316'} strokeWidth={2.5}
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
        <Tooltip contentStyle={tooltipStyle}
          formatter={v => [`₹${Number(v).toLocaleString()}`, 'Balance']} />
        <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2}
          fill="url(#balGradFin)" dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default function Finance({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const logsWithSpend = logs.filter(l => l.spending?.length)
  const totalSpend = logsWithSpend.reduce((s, l) => s + l.spending.reduce((a, e) => a + e.amount, 0), 0)
  const avgDaily = logsWithSpend.length ? Math.round(totalSpend / logsWithSpend.length) : 0
  const latestBalance = logs.find(l => l.account_balance)?.account_balance

  // Category totals
  const catTotals = {}
  logsWithSpend.forEach(l => l.spending.forEach(s => {
    catTotals[s.category] = (catTotals[s.category] || 0) + s.amount
  }))
  const catData = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-3 fade-up">

      {/* ── Savings projection (top) ── */}
      <SavingsProjection logs={logs} />

      {/* Hero — total spent */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Variable Spend — All Time</div>
        <div className="text-4xl font-black text-gray-800">₹{totalSpend.toLocaleString()}</div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>₹{avgDaily.toLocaleString()} / day avg</span>
          <span>·</span>
          <span>~₹{Math.round(avgDaily * 30).toLocaleString()} / month variable</span>
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
          <div className="text-gray-500 text-xs mb-1">Daily Variable Budget</div>
          <div className="text-xl font-bold text-indigo-600">₹{GOALS.dailyBudget.toLocaleString()}</div>
        </div>
      </div>

      {/* Balance trend */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Balance Trend</h3>
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
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`, '']}
                contentStyle={tooltipStyle} />
            </PieChart>
            <div className="flex-1 space-y-1.5">
              {catData.slice(0, 4).map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[d.name] || '#94a3b8' }} />
                  <span className="text-gray-600 text-xs flex-1">{d.name}</span>
                  <span className="text-gray-700 text-xs font-semibold">₹{d.value.toLocaleString()}</span>
                  <span className="text-gray-400 text-xs w-7 text-right">{Math.round(d.value/totalSpend*100)}%</span>
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
