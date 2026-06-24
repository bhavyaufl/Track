import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { SPENDING_CATEGORIES } from '../../lib/constants'

const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Transport: '#6366f1',
  Shopping: '#ec4899',
  Entertainment: '#8b5cf6',
  Health: '#10b981',
  Rent: '#ef4444',
  Subscriptions: '#06b6d4',
  Bills: '#f97316',
  Education: '#14b8a6',
}

function BalanceChart({ logs }) {
  const data = logs
    .filter(l => l.account_balance)
    .slice(0, 30)
    .reverse()
    .map(l => ({ date: l.date?.slice(5), balance: Number(l.account_balance) }))

  if (!data.length) return <div className="text-slate-500 text-sm text-center py-6">No balance data yet.</div>

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          formatter={(v) => [`₹${v.toLocaleString()}`, 'Balance']}
        />
        <Line dataKey="balance" stroke="#10b981" strokeWidth={2} dot={false} name="Balance" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SpendingByCategory({ logs }) {
  const totals = {}
  logs.forEach(l => {
    (l.spending || []).forEach(s => {
      totals[s.category] = (totals[s.category] || 0) + s.amount
    })
  })

  const data = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({ name: cat, value: amt }))

  if (!data.length) return <div className="text-slate-500 text-sm text-center py-6">No spending data yet.</div>

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      <PieChart width={180} height={180}>
        <Pie data={data} cx={85} cy={85} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
          {data.map((entry, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Amount']}
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
      </PieChart>
      <div className="flex-1 space-y-1.5">
        {data.map(d => (
          <div key={d.name} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[d.name] || '#64748b' }} />
              <span className="text-slate-300">{d.name}</span>
            </div>
            <span className="text-slate-400">₹{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DailyAvg({ logs }) {
  const logsWithSpending = logs.filter(l => l.spending?.length)
  if (!logsWithSpending.length) return null

  const totalSpend = logsWithSpending.reduce((sum, l) =>
    sum + (l.spending || []).reduce((a, s) => a + s.amount, 0), 0)
  const avg = Math.round(totalSpend / logsWithSpending.length)

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-yellow-400">₹{avg.toLocaleString()}</div>
        <div className="text-slate-400 text-xs mt-0.5">Daily average spend</div>
      </div>
      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-indigo-400">₹{totalSpend.toLocaleString()}</div>
        <div className="text-slate-400 text-xs mt-0.5">Total spent ({logsWithSpending.length} days)</div>
      </div>
    </div>
  )
}

export default function Finance({ logs }) {
  const recentSpend = logs
    .filter(l => l.spending?.length)
    .slice(0, 7)

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Balance Trend</h3>
        <BalanceChart logs={logs} />
      </div>

      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Spending by Category</h3>
        <SpendingByCategory logs={logs} />
      </div>

      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Averages</h3>
        <DailyAvg logs={logs} />
      </div>

      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Recent Spending</h3>
        {recentSpend.length ? (
          <div className="space-y-3">
            {recentSpend.map(l => (
              <div key={l.date}>
                <div className="text-slate-500 text-xs mb-1">{l.date}</div>
                {l.spending.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-slate-300">{s.item}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-700 rounded">{s.category}</span>
                      <span className="text-slate-200">₹{s.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-sm text-center py-4">No spending logged yet.</div>
        )}
      </div>
    </div>
  )
}
