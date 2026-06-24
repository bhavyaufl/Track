import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS } from '../../lib/constants'

function MacroRing({ label, value, target, color, emoji }) {
  const size = 90
  const stroke = 9
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / target, 1)
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute text-center">
          <div className="text-base font-bold text-white">{value}</div>
          <div className="text-slate-500 text-xs">/{target}</div>
        </div>
      </div>
      <div className="text-slate-400 text-xs">{emoji} {label}</div>
    </div>
  )
}

function CalorieBar({ log }) {
  const cal = log?.calories || 0
  const pct = Math.min((cal / GOALS.calories.max) * 100, 110)
  const inRange = cal >= GOALS.calories.min && cal <= GOALS.calories.max

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-300">Today's Intake</span>
        <span className={inRange ? 'text-emerald-400 font-bold' : 'text-yellow-400'}>{cal} kcal</span>
      </div>
      <div className="h-4 bg-slate-700 rounded-full overflow-hidden relative">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: inRange ? '#10b981' : '#f59e0b' }} />
        {/* Range markers */}
        <div className="absolute top-0 h-full border-l-2 border-blue-400 opacity-60"
          style={{ left: `${(GOALS.calories.min / GOALS.calories.max) * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>0</span>
        <span className="text-blue-400">{GOALS.calories.min} min</span>
        <span>{GOALS.calories.max} max</span>
      </div>
    </div>
  )
}

function SevenDayChart({ logs }) {
  const last7 = logs.slice(0, 7).reverse().map(l => ({
    date: l.date?.slice(5),
    calories: l.calories || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={last7} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11 }} domain={[0, 2000]} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <ReferenceLine y={GOALS.calories.min} stroke="#6366f1" strokeDasharray="4 2" label={{ value: '1200', fill: '#6366f1', fontSize: 10 }} />
        <ReferenceLine y={GOALS.calories.max} stroke="#6366f1" strokeDasharray="4 2" label={{ value: '1600', fill: '#6366f1', fontSize: 10 }} />
        <Bar dataKey="calories" fill="#6366f1" radius={[4,4,0,0]} name="Calories" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function DeficitCalc({ logs }) {
  const target = GOALS.calories.target
  let totalDeficit = 0
  logs.forEach(l => {
    if (l.calories) totalDeficit += target - l.calories
  })
  const kgLost = (totalDeficit / 7700).toFixed(2)
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-indigo-400">{totalDeficit > 0 ? '+' : ''}{totalDeficit.toLocaleString()}</div>
        <div className="text-slate-400 text-xs mt-0.5">Cumulative deficit (kcal)</div>
      </div>
      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-emerald-400">~{Math.max(kgLost, 0)} kg</div>
        <div className="text-slate-400 text-xs mt-0.5">Estimated fat lost</div>
      </div>
    </div>
  )
}

export default function Calories({ todayLog, logs }) {
  const macros = todayLog?.macros || { p: 0, c: 0, f: 0 }

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Today's Calories</h3>
        <CalorieBar log={todayLog} />
      </div>

      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-4">Macros</h3>
        <div className="flex justify-around">
          <MacroRing label="Protein" value={macros.p} target={GOALS.protein} color="#6366f1" emoji="💪" />
          <MacroRing label="Carbs" value={macros.c} target={GOALS.carbs} color="#f59e0b" emoji="🌾" />
          <MacroRing label="Fat" value={macros.f} target={GOALS.fat} color="#ec4899" emoji="🧈" />
        </div>

        {/* Meal breakdown */}
        {todayLog?.meal_macros && (
          <div className="mt-4 space-y-2">
            <div className="text-slate-500 text-xs uppercase tracking-wider">Per meal</div>
            {['breakfast','lunch','dinner','snacks'].map(meal => {
              const m = todayLog.meal_macros[meal]
              if (!m) return null
              const cal = m.p * 4 + m.c * 4 + m.f * 9
              return (
                <div key={meal} className="flex justify-between text-sm">
                  <span className="text-slate-400 capitalize">{meal}</span>
                  <span className="text-slate-300">{cal} kcal · P{m.p} C{m.c} F{m.f}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">7-Day Trend</h3>
        <SevenDayChart logs={logs} />
      </div>

      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Cumulative Deficit</h3>
        <DeficitCalc logs={logs} />
      </div>
    </div>
  )
}
