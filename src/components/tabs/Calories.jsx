import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS } from '../../lib/constants'

function MacroRing({ label, value, target, color, emoji }) {
  const size = 84, stroke = 8, r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / target, 1)
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
        </svg>
        <div className="absolute text-center">
          <div className="text-sm font-bold text-gray-800">{value}</div>
          <div className="text-gray-400 text-xs">/{target}</div>
        </div>
      </div>
      <div className="text-gray-500 text-xs font-medium">{emoji} {label}</div>
    </div>
  )
}

function SevenDayChart({ logs }) {
  const data = logs.slice(0, 7).reverse().map(l => ({ date: l.date?.slice(5), calories: l.calories || 0 }))
  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data} barSize={24}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 2000]} />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }} />
        <ReferenceLine y={GOALS.calories.target} stroke="#6366f1" strokeDasharray="4 2"
          label={{ value: '1800', fill: '#6366f1', fontSize: 10, position: 'right' }} />
        <Bar dataKey="calories" fill="#6366f1" radius={[6,6,0,0]} name="kcal" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Calories({ todayLog, logs }) {
  const cal = todayLog?.calories || 0
  const macros = todayLog?.macros || { p: 0, c: 0, f: 0 }
  const onTarget = cal >= GOALS.calories.target
  const pct = Math.min((cal / GOALS.calories.target) * 100, 100)

  const totalDeficit = logs.reduce((sum, l) => l.calories ? sum + (GOALS.calories.target - l.calories) : sum, 0)
  const kgLost = Math.max((totalDeficit / 7700).toFixed(2), 0)

  return (
    <div className="space-y-4 fade-up">
      {/* Today's intake */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-gray-500 text-sm">Today's calories</div>
            <div className={`text-4xl font-black mt-0.5 ${onTarget ? 'text-emerald-600' : 'text-amber-500'}`}>{cal}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-semibold px-3 py-1 rounded-full ${onTarget ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
              {onTarget ? '✓ On target' : '↓ Under'}
            </div>
            <div className="text-gray-400 text-xs mt-1">target: 1800 kcal</div>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: onTarget ? '#10b981' : '#6366f1' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span><span className="text-indigo-400">1800 kcal target</span>
        </div>
      </div>

      {/* Macro rings */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-4">Macros</h3>
        <div className="flex justify-around mb-4">
          <MacroRing label="Protein" value={macros.p} target={GOALS.protein} color="#6366f1" emoji="💪" />
          <MacroRing label="Carbs" value={macros.c} target={GOALS.carbs} color="#f59e0b" emoji="🌾" />
          <MacroRing label="Fat" value={macros.f} target={GOALS.fat} color="#ec4899" emoji="🧈" />
        </div>
        {todayLog?.meal_macros && (
          <div className="border-t border-gray-50 pt-3 space-y-1.5">
            {['breakfast','lunch','dinner','snacks'].map(meal => {
              const m = todayLog.meal_macros[meal]
              if (!m || (!m.p && !m.c && !m.f)) return null
              const c = m.p*4 + m.c*4 + m.f*9
              return (
                <div key={meal} className="flex justify-between text-sm">
                  <span className="text-gray-400 capitalize">{meal}</span>
                  <span className="text-gray-600">{c} kcal · P{m.p} C{m.c} F{m.f}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 7-day chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-3">7-Day Trend</h3>
        <SevenDayChart logs={logs} />
      </div>

      {/* Deficit */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-3">Cumulative Deficit</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600">{totalDeficit > 0 ? '+' : ''}{totalDeficit.toLocaleString()}</div>
            <div className="text-gray-400 text-xs mt-0.5">kcal deficit</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">~{kgLost} kg</div>
            <div className="text-gray-400 text-xs mt-0.5">estimated fat lost</div>
          </div>
        </div>
      </div>
    </div>
  )
}
