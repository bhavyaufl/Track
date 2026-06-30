import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
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
  const daysLeft = Math.max(0, Math.floor((new Date(GOALS.endDate) - new Date()) / 86400000))
  const projectedTotal = avgDaily * (logsWithSpend.length + daysLeft)

  // Category totals
  const catTotals = {}
  logsWithSpend.forEach(l => l.spending.forEach(s => {
    catTotals[s.category] = (catTotals[s.category] || 0) + s.amount
  }))
  const catData = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-3 fade-up">

      {/* Hero — total spent */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Spent — All Time</div>
        <div className="text-4xl font-black text-gray-800">₹{totalSpend.toLocaleString()}</div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span>₹{avgDaily.toLocaleString()} / day avg</span>
          <span>·</span>
          <span>~₹{projectedTotal.toLocaleString()} projected by Aug 9</span>
        </div>
      </div>

      {/* Balance + daily budget row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-100">
          <div className="text-gray-500 text-xs mb-1">Balance</div>
          <div className="text-xl font-bold text-emerald-600">
            {latestBalance ? `₹${Number(latestBalance).toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-3.5 border border-indigo-100">
          <div className="text-gray-500 text-xs mb-1">Daily Budget</div>
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

          {/* Donut + legend side by side */}
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

          {/* Full category bars */}
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
