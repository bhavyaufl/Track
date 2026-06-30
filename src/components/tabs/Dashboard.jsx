import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS, EXERCISE_GOALS, BADGES } from '../../lib/constants'
import { useTooltipStyle } from '../../lib/DarkContext'

// ─── helpers ────────────────────────────────────────────────────────────────

function daysLeft() {
  return Math.max(0, Math.floor((new Date('2026-08-09') - new Date()) / 86400000))
}

function overallPower(levels) {
  const tracked = EXERCISE_GOALS.filter(e => e.goal)
  if (!tracked.length) return 0
  let total = 0
  tracked.forEach(ex => {
    const entry = levels.find(l => l.exercise_name === ex.name)
    const cur = entry?.current_weight || 0
    total += ex.type === 'time'
      ? (cur ? Math.min((ex.goal / cur) * 100, 100) : 0)
      : Math.min((cur / ex.goal) * 100, 100)
  })
  return Math.round(total / tracked.length)
}

function calcStreaks(logs) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  let log = 0, gym = 0, protein = 0
  for (const l of sorted) { if (l.date) log++; else break }
  for (const l of sorted) { if (l.exercises?.length) gym++; else break }
  for (const l of sorted) { if ((l.macros?.p || 0) >= 130) protein++; else break }
  return { log, gym, protein }
}

// ─── sub-components ─────────────────────────────────────────────────────────

function HeroBanner({ logs, levels, todayLog }) {
  const power = overallPower(levels)
  const left = daysLeft()
  const curWeight = logs.find(l => l.weight)?.weight || GOALS.startWeight
  const totalXP = logs.reduce((s, l) => s + (l.xp_earned || 0), 0)
  const score = todayLog?.daily_score || 0

  // Cut: progress = how much weight lost toward target (going DOWN)
  const weightPct = Math.max(0, Math.min(
    Math.round(((GOALS.startWeight - curWeight) / (GOALS.startWeight - GOALS.weightTarget)) * 100), 100
  ))

  const circ = 2 * Math.PI * 44
  const offset = circ * (1 - power / 100)
  const ringColor = power >= 70 ? '#34d399' : power >= 40 ? '#a78bfa' : '#fbbf24'

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)' }}>
      <div className="px-4 pt-4 pb-3">
        {/* Top row: text + ring */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Overall Power</div>
            <div className="text-white text-3xl font-black leading-none mt-0.5">{power}%</div>
            <div className="text-white/50 text-xs mt-0.5">of Aug 9 goals · {left}d left</div>
          </div>
          <div className="relative">
            <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8} />
              <circle cx={40} cy={40} r={34} fill="none" stroke={ringColor} strokeWidth={8}
                strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - power / 100)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-sm font-black">{power}%</div>
            </div>
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Weight',  value: `${curWeight} kg`, icon: '⚖️' },
            { label: 'Total XP', value: `⚡${totalXP.toLocaleString()}`, icon: null },
            { label: 'Score',   value: `${score}/100`, icon: null },
          ].map(s => (
            <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl px-2 py-2 text-center">
              <div className="text-white font-bold text-xs">{s.value}</div>
              <div className="text-white/50 text-xs leading-none mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weight progress bar */}
      <div className="px-4 pb-3">
        <div className="flex justify-between text-xs text-white/50 mb-1">
          <span>{GOALS.startWeight} kg</span>
          <span>{weightPct}% to goal</span>
          <span>{GOALS.weightTarget} kg ↓</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${Math.max(weightPct, 0)}%` }} />
        </div>
      </div>
    </div>
  )
}

function TodaySnapshot({ todayLog }) {
  const score = todayLog?.daily_score || 0
  const macros = todayLog?.macros || { p: 0, c: 0, f: 0 }
  const cal = todayLog?.calories || 0
  const steps = todayLog?.steps || 0

  const goals = [
    { label: 'Logged',   hit: !!todayLog },
    { label: 'Protein',  hit: macros.p >= GOALS.protein },
    { label: 'Calories', hit: cal >= 1400 && cal <= 1600 },
    { label: 'Steps',    hit: steps >= 10000 },
    { label: 'Workout',  hit: !!(todayLog?.exercises?.length || todayLog?.cardio_type) },
  ]
  const goalsHit = goals.filter(g => g.hit).length

  const circ = 2 * Math.PI * 28
  const offset = circ * (1 - score / 100)
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today</span>
        <span className="text-xs font-bold text-indigo-500">{goalsHit}/5 goals</span>
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="relative shrink-0">
          <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={26} cy={26} r={20} fill="none" stroke="#f1f5f9" strokeWidth={5.5} />
            <circle cx={26} cy={26} r={20} fill="none" stroke={color} strokeWidth={5.5}
              strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - score / 100)} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm font-black text-gray-800">{score}</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-1 mb-1.5">
            {goals.map(g => (
              <div key={g.label} title={g.label}
                className={`flex-1 h-2 rounded-full ${g.hit ? 'bg-emerald-400' : 'bg-gray-100'}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Cal', val: cal ? `${cal}` : '—', ok: cal >= 1400 && cal <= 1600 },
              { label: 'Protein', val: macros.p ? `${macros.p}g` : '—', ok: macros.p >= GOALS.protein },
              { label: 'Steps', val: steps ? `${(steps/1000).toFixed(1)}k` : '—', ok: steps >= 10000 },
            ].map(s => (
              <div key={s.label} className={`rounded-lg px-1.5 py-1 text-center ${s.ok ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                <div className={`text-xs font-bold ${s.ok ? 'text-emerald-600' : 'text-gray-600'}`}>{s.val}</div>
                <div className="text-gray-400 text-xs leading-none">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CalorieTrend({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const data = logs.slice(0, 10).reverse().map(l => ({
    date: l.date?.slice(5),
    cal: l.calories || 0,
    p: l.macros?.p || 0,
  }))
  if (!data.length) return null

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Calorie Trend</h3>
        <div className="flex gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"/>Calories</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 2400]} width={35} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine y={GOALS.calories.target} stroke="#a5b4fc" strokeDasharray="4 2"
            label={{ value: `${GOALS.calories.target}`, fill: '#818cf8', fontSize: 9, position: 'right' }} />
          <Area type="monotone" dataKey="cal" stroke="#6366f1" strokeWidth={2.5}
            fill="url(#calGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} name="kcal" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function buildWeightProjection() {
  const start = new Date(GOALS.startDate)
  const end   = new Date(GOALS.endDate)
  const totalDays = (end - start) / 86400000
  const pts = []
  let cur = new Date(start)
  while (cur <= end) {
    const day = (cur - start) / 86400000
    pts.push({
      date: cur.toISOString().split('T')[0].slice(5),
      ideal: Number((GOALS.startWeight + (day / totalDays) * (GOALS.weightTarget - GOALS.startWeight)).toFixed(1)),
    })
    cur.setDate(cur.getDate() + 7)
  }
  pts.push({ date: GOALS.endDate.slice(5), ideal: GOALS.weightTarget })
  return pts
}

function WeightTrend({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const weightLogs = logs.filter(l => l.weight).reverse()
  const actualMap = Object.fromEntries(weightLogs.map(l => [l.date.slice(5), Number(l.weight)]))
  const projection = buildWeightProjection()
  const data = projection.map(p => ({ ...p, actual: actualMap[p.date] ?? null }))

  const latest = weightLogs[weightLogs.length - 1]?.weight || GOALS.startWeight
  const gained = (latest - GOALS.startWeight).toFixed(1)
  const toGoal = (GOALS.weightTarget - latest).toFixed(1)

  const yMin = Math.min(GOALS.startWeight - 1, ...weightLogs.map(l => l.weight))
  const yMax = Math.max(GOALS.weightTarget + 1, ...weightLogs.map(l => l.weight))

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h3 className="font-semibold text-gray-700">Weight</h3>
          <div className="text-xs text-gray-400 mt-0.5">🔥 Cut · target {GOALS.weightTarget} kg ↓</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-indigo-600">{latest} kg</div>
          <div className="text-xs text-gray-400">
            {gained > 0 ? `+${gained} kg gained` : `${toGoal} kg to goal`}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }}
            domain={[yMin, yMax]} width={32} />
          <Tooltip contentStyle={tooltipStyle}
            formatter={(v, name) => [`${v} kg`, name === 'ideal' ? 'Ideal' : 'Actual']} />
          <Line dataKey="ideal" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3"
            dot={false} connectNulls name="ideal" />
          <Line dataKey="actual" stroke="#6366f1" strokeWidth={2.5}
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} connectNulls={false} name="actual" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block rounded" /> Actual</span>
        <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-gray-400 inline-block" /> Ideal trajectory</span>
      </div>
    </div>
  )
}

function BalanceTrend({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const balanceLogs = logs.filter(l => l.account_balance).reverse()
  if (!balanceLogs.length) return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between" style={{ minHeight: 200 }}>
      <h3 className="font-semibold text-gray-700">Balance</h3>
      <div className="text-center text-gray-300 text-sm py-6">No balance data yet</div>
    </div>
  )

  // Build combined actual + projection
  const actualMap = Object.fromEntries(balanceLogs.map(l => [l.date.slice(5), Number(l.account_balance)]))
  const latestLog = balanceLogs[balanceLogs.length - 1]
  const latestBal = Number(latestLog.account_balance)
  const latestDate = new Date(latestLog.date)
  const endDate = new Date(GOALS.endDate)

  // Projection: from latest date → end date, spending ₹1000/day
  const projMap = {}
  let cur = new Date(latestDate)
  let bal = latestBal
  while (cur <= endDate) {
    projMap[cur.toISOString().split('T')[0].slice(5)] = Number(bal.toFixed(0))
    cur.setDate(cur.getDate() + 7)
    bal -= 7000
  }
  projMap[endDate.toISOString().split('T')[0].slice(5)] = Number(bal.toFixed(0))

  // Merge: weekly points from first actual entry
  const allDates = new Set([...Object.keys(actualMap), ...Object.keys(projMap)])
  const data = Array.from(allDates).sort().map(date => ({
    date,
    actual: actualMap[date] ?? null,
    forecast: projMap[date] ?? null,
  }))

  const first = balanceLogs[0]?.account_balance || 0
  const diff = latestBal - first
  const up = diff >= 0

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h3 className="font-semibold text-gray-700">Balance</h3>
          <div className="text-xs text-gray-400 mt-0.5">Projected at ₹1k/day spend</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-indigo-600">₹{latestBal.toLocaleString()}</div>
          <div className={`text-xs font-medium ${up ? 'text-emerald-500' : 'text-red-400'}`}>
            {up ? '+' : ''}₹{diff.toLocaleString()} change
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={42}
            tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} domain={['dataMin - 2000', 'dataMax + 2000']} />
          <Tooltip contentStyle={tooltipStyle}
            formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'forecast' ? 'Forecast' : 'Actual']} />
          <Line dataKey="forecast" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3"
            dot={false} connectNulls name="forecast" />
          <Line dataKey="actual" stroke="#6366f1" strokeWidth={2.5}
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} connectNulls={false} name="actual" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block rounded" /> Actual</span>
        <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-gray-400 inline-block" /> Forecast</span>
      </div>
    </div>
  )
}

function LiftSnapshot({ levels }) {
  const top = EXERCISE_GOALS.filter(e => e.goal).slice(0, 6)
  if (!levels.length) return null

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-3">Lift Goals</h3>
      <div className="space-y-2.5">
        {top.map(ex => {
          const entry = levels.find(l => l.exercise_name === ex.name)
          const cur = entry?.current_weight || 0
          const pct = ex.type === 'time'
            ? (cur ? Math.min((ex.goal / cur) * 100, 100) : 0)
            : Math.min((cur / ex.goal) * 100, 100)
          const barColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#6366f1' : '#f59e0b'

          return (
            <div key={ex.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">{ex.name}</span>
                <span className="text-gray-400">
                  {cur ? `${cur}` : '—'} / {ex.goal} {ex.unit}
                  <span className="ml-1.5 font-semibold" style={{ color: barColor }}>{Math.round(pct)}%</span>
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Streaks({ logs }) {
  const { log, gym, protein } = calcStreaks(logs)
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { emoji: '🔥', val: log,     label: 'Log streak',  color: 'text-orange-500',  bg: 'from-orange-50 to-red-50',    border: 'border-orange-100' },
        { emoji: '🏋️', val: gym,     label: 'Gym streak',  color: 'text-indigo-600',  bg: 'from-indigo-50 to-purple-50', border: 'border-indigo-100' },
        { emoji: '🎯', val: protein, label: 'Protein',      color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50',  border: 'border-emerald-100' },
      ].map(s => (
        <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-xl p-2.5 text-center`}>
          <div className="text-lg">{s.emoji}</div>
          <div className={`text-xl font-black leading-none ${s.color}`}>{s.val}d</div>
          <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function RecentWorkouts({ logs }) {
  const workouts = logs.filter(l => l.exercises?.length || l.cardio_type).slice(0, 3)
  if (!workouts.length) return null

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-3">Recent Workouts</h3>
      <div className="space-y-2">
        {workouts.map(l => (
          <div key={l.date} className="flex items-center gap-3 py-1.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-sm shrink-0">
              {l.cardio_type ? '🏃' : '🏋️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-700 text-sm font-medium">
                {l.muscles?.join(' + ') || l.cardio_type}
              </div>
              <div className="text-gray-400 text-xs">
                {l.exercises?.slice(0,2).map(e => `${e.name} ${e.weight}${e.unit}`).join(' · ')}
              </div>
            </div>
            <div className="text-gray-400 text-xs shrink-0">{l.date?.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BodyComp({ logs }) {
  const curWeight = logs.find(l => l.weight)?.weight || GOALS.startWeight
  const curBF     = logs.find(l => l.body_fat)?.body_fat || GOALS.startBodyFat

  // Cut: weight goes DOWN — progress = how far from start toward target
  const weightPct = Math.max(0, Math.min(
    Math.round(((GOALS.startWeight - curWeight) / (GOALS.startWeight - GOALS.weightTarget)) * 100), 100
  ))
  // BF: drops from 25% → 12%
  const bfPct = Math.max(0, Math.min(
    Math.round(((GOALS.startBodyFat - curBF) / (GOALS.startBodyFat - GOALS.bodyFatTarget)) * 100), 100
  ))
  const weightLost = (GOALS.startWeight - curWeight).toFixed(1)
  const bfLost     = (GOALS.startBodyFat - curBF).toFixed(1)

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Body Composition</h3>
        <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium border border-orange-100">🔥 Cut</span>
      </div>
      {[
        { label: 'Weight', cur: `${curWeight} kg`, goal: `${GOALS.weightTarget} kg`, pct: weightPct, color: '#6366f1',
          note: weightLost > 0 ? `−${weightLost} kg lost` : `${Math.abs(GOALS.startWeight - GOALS.weightTarget)} kg to lose` },
        { label: 'Body Fat', cur: `${curBF}%`, goal: `${GOALS.bodyFatTarget}%`, pct: bfPct, color: '#ec4899',
          note: bfLost > 0 ? `−${bfLost}% dropped` : `target: ${GOALS.bodyFatTarget}%` },
      ].map(m => (
        <div key={m.label} className="mb-3">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600 font-medium">{m.label}</span>
            <span className="text-gray-400">{m.cur} → <span className="font-semibold text-gray-600">{m.goal}</span></span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${m.pct}%`, background: m.color }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>{m.note}</span>
            <span>{m.pct}% there</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function EarnedBadges({ badges }) {
  if (!badges.length) return null
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-3">Badges Earned</h3>
      <div className="flex gap-2 flex-wrap">
        {badges.map(b => {
          const def = BADGES.find(d => d.key === b.badge_key)
          return (
            <div key={b.badge_key} className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-xl">{def?.emoji}</span>
              <div>
                <div className="text-yellow-700 text-xs font-semibold">{def?.name}</div>
                <div className="text-yellow-500 text-xs">{b.earned_at}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── main ────────────────────────────────────────────────────────────────────

export default function Dashboard({ logs, levels, badges, todayLog }) {
  return (
    <div className="space-y-4 fade-up">
      <HeroBanner logs={logs} levels={levels} todayLog={todayLog} />
      <TodaySnapshot todayLog={todayLog} />
      <Streaks logs={logs} />
      <CalorieTrend logs={logs} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WeightTrend logs={logs} />
        <BalanceTrend logs={logs} />
      </div>
      <LiftSnapshot levels={levels} />
      <BodyComp logs={logs} />
      <RecentWorkouts logs={logs} />
      <EarnedBadges badges={badges} />
    </div>
  )
}
