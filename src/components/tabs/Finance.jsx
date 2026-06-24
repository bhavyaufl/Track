import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CATEGORY_COLORS = {
  Food: '#f59e0b', Transport: '#6366f1', Shopping: '#ec4899',
  Entertainment: '#8b5cf6', Health: '#10b981', Rent: '#ef4444',
  Subscriptions: '#06b6d4', Bills: '#f97316', Education: '#14b8a6',
}

function BalanceChart({ logs }) {
  const data = logs.filter(l => l.account_balance).slice(0, 30).reverse()
    .map(l => ({ date: l.date?.slice(5), balance: Number(l.account_balance) }))
  if (!data.length) return <div className="text-center py-8 text-gray-400 text-sm">No balance data yet.</div>
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}
          formatter={v => [`₹${v.toLocaleString()}`, 'Balance']} />
        <Line dataKey="balance" stroke="#10b981" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SpendingBreakdown({ logs }) {
  const totals = {}
  logs.forEach(l => (l.spending || []).forEach(s => {
    totals[s.category] = (totals[s.category] || 0) + s.amount
  }))
  const data = Object.entries(totals).sort((a,b) => b[1]-a[1]).map(([name, value]) => ({ name, value }))
  if (!data.length) return <div className="text-center py-8 text-gray-400 text-sm">No spending yet.</div>

  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex gap-4 items-center">
      <PieChart width={150} height={150}>
        <Pie data={data} cx={70} cy={70} innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={2}>
          {data.map((e, i) => <Cell key={i} fill={CATEGORY_COLORS[e.name] || '#94a3b8'} />)}
        </Pie>
        <Tooltip formatter={v => [`₹${v.toLocaleString()}`, '']}
          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }} />
      </PieChart>
      <div className="flex-1 space-y-1.5">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[d.name] || '#94a3b8' }} />
              <span className="text-gray-600">{d.name}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-700 font-medium">₹{d.value.toLocaleString()}</span>
              <span className="text-gray-400 text-xs ml-1">{Math.round(d.value/total*100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Finance({ logs }) {
  const logsWithSpend = logs.filter(l => l.spending?.length)
  const totalSpend = logsWithSpend.reduce((s, l) => s + l.spending.reduce((a, e) => a + e.amount, 0), 0)
  const avgDaily = logsWithSpend.length ? Math.round(totalSpend / logsWithSpend.length) : 0
  const latestBalance = logs.find(l => l.account_balance)?.account_balance

  return (
    <div className="space-y-4 fade-up">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs">Balance</div>
          <div className="text-2xl font-bold text-emerald-600 mt-0.5">
            {latestBalance ? `₹${latestBalance.toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs">Daily avg spend</div>
          <div className="text-2xl font-bold text-gray-800 mt-0.5">₹{avgDaily.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-3">Balance Trend</h3>
        <BalanceChart logs={logs} />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-3">By Category</h3>
        <SpendingBreakdown logs={logs} />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-3">Recent Spending</h3>
        {logsWithSpend.slice(0, 5).length ? (
          <div className="space-y-3">
            {logsWithSpend.slice(0, 5).map(l => (
              <div key={l.date}>
                <div className="text-gray-400 text-xs mb-1">{l.date}</div>
                {l.spending.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[s.category] || '#94a3b8' }} />
                      <span className="text-gray-600">{s.item}</span>
                    </div>
                    <span className="text-gray-800 font-medium">₹{s.amount}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">No spending logged yet.</div>
        )}
      </div>
    </div>
  )
}
