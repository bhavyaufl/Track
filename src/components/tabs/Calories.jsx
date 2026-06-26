import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS } from '../../lib/constants'

function MacroBar({ label, value, target, color, emoji }) {
  const pct = Math.min((value / target) * 100, 100)
  const remaining = Math.max(target - value, 0)
  const over = value > target
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{emoji}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-800">{value}</span>
          <span className="text-gray-400 text-xs"> / {target}g</span>
          {remaining > 0
            ? <span className="text-xs text-gray-400 ml-2">{remaining}g left</span>
            : <span className="text-xs text-emerald-500 ml-2">✓ done</span>
          }
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: over ? '#10b981' : color }} />
      </div>
    </div>
  )
}

function SevenDayChart({ logs }) {
  const data = logs.slice(0, 7).reverse().map(l => ({ date: l.date?.slice(5), calories: l.calories || 0 }))
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barSize={22}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 4000]} width={32} />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
        <ReferenceLine y={GOALS.calories.target} stroke="#a5b4fc" strokeDasharray="4 2"
          label={{ value: '1800', fill: '#818cf8', fontSize: 9, position: 'right' }} />
        <Bar dataKey="calories" fill="#6366f1" radius={[5,5,0,0]} name="kcal" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Calories({ todayLog, logs }) {
  const cal = todayLog?.calories || 0
  const macros = todayLog?.macros || { p: 0, c: 0, f: 0 }
  const remaining = Math.max(GOALS.calories.target - cal, 0)
  const over = cal > GOALS.calories.target
  const onTarget = cal >= GOALS.calories.target
  const pct = Math.min((cal / GOALS.calories.target) * 100, 100)

  const totalDeficit = logs.reduce((sum, l) => l.calories ? sum + (GOALS.calories.target - l.calories) : sum, 0)
  const kgLost = Math.max((totalDeficit / 7700).toFixed(2), 0)

  return (
    <div className="space-y-3 fade-up">
      {/* Hero: calories eaten + left */}
      <div className={`rounded-2xl p-4 border shadow-sm ${onTarget ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">Today</div>
            <div className={`text-4xl font-black mt-0.5 ${onTarget ? 'text-emerald-600' : 'text-gray-800'}`}>
              {cal.toLocaleString()}
              <span className="text-base font-medium text-gray-400 ml-1">kcal</span>
            </div>
          </div>
          <div className="text-right">
            {over ? (
              <div className="bg-amber-50 text-amber-500 text-xs font-bold px-2.5 py-1 rounded-full">
                +{(cal - GOALS.calories.target).toLocaleString()} over
              </div>
            ) : (
              <div>
                <div className={`text-2xl font-black ${remaining === 0 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                  {remaining.toLocaleString()}
                </div>
                <div className="text-gray-400 text-xs">kcal left</div>
              </div>
            )}
          </div>
        </div>
        <div className="h-2.5 bg-white/70 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: onTarget ? '#10b981' : '#6366f1' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{cal.toLocaleString()} eaten</span>
          <span className="text-indigo-400">target: {GOALS.calories.target.toLocaleString()}</span>
        </div>
      </div>

      {/* Macros */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-700 font-semibold text-sm">Macros</h3>
          <span className="text-xs text-gray-400">P·{macros.p} C·{macros.c} F·{macros.f}</span>
        </div>
        <MacroBar label="Protein" value={macros.p} target={GOALS.protein} color="#6366f1" emoji="💪" />
        <MacroBar label="Carbs"   value={macros.c} target={GOALS.carbs}   color="#f59e0b" emoji="🌾" />
        <MacroBar label="Fat"     value={macros.f} target={GOALS.fat}     color="#ec4899" emoji="🧈" />

        {todayLog?.meal_macros && (
          <div className="border-t border-gray-50 pt-3 space-y-1.5">
            {['breakfast','lunch','dinner','snacks'].map(meal => {
              const m = todayLog.meal_macros[meal]
              if (!m || (!m.p && !m.c && !m.f)) return null
              const c = m.p*4 + m.c*4 + m.f*9
              return (
                <div key={meal} className="flex justify-between text-xs">
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
        <h3 className="text-gray-700 font-semibold text-sm mb-3">7-Day Trend</h3>
        <SevenDayChart logs={logs} />
      </div>

      {/* Deficit */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Cumulative Deficit</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-indigo-600">{totalDeficit > 0 ? '+' : ''}{totalDeficit.toLocaleString()}</div>
            <div className="text-gray-400 text-xs mt-0.5">kcal deficit</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-600">~{kgLost} kg</div>
            <div className="text-gray-400 text-xs mt-0.5">estimated fat lost</div>
          </div>
        </div>
      </div>
    </div>
  )
}
