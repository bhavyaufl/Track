import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS, EXERCISE_GOALS, BADGES } from '../../lib/constants'

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

  const weightPct = Math.min(
    Math.round(((GOALS.startWeight - curWeight) / (GOALS.startWeight - GOALS.weightTarget)) * 100), 100
  )

  const circ = 2 * Math.PI * 44
  const offset = circ * (1 - power / 100)
  const ringColor = power >= 70 ? '#34d399' : power >= 40 ? '#a78bfa' : '#fbbf24'

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)' }}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Overall Progress</div>
            <div className="text-white text-4xl font-black mt-0.5">{power}%</div>
            <div className="text-white/60 text-xs mt-0.5">of Aug 9 goals</div>
          </div>
          <div className="relative">
            <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={44} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={10} />
              <circle cx={50} cy={50} r={44} fill="none" stroke={ringColor} strokeWidth={10}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-white text-xl font-black">{power}%</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Days left', value: left, icon: '⏳', color: 'bg-white/10' },
            { label: 'Weight', value: `${curWeight} kg`, icon: '⚖️', color: 'bg-white/10' },
            { label: 'Total XP', value: `⚡${totalXP}`, icon: null, color: 'bg-white/10' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center backdrop-blur`}>
              {s.icon && <div className="text-lg">{s.icon}</div>}
              <div className="text-white font-bold text-sm">{s.value}</div>
              <div className="text-white/50 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weight progress bar */}
      <div className="px-5 pb-5">
        <div className="flex justify-between text-xs text-white/50 mb-1.5">
          <span>Weight: {GOALS.startWeight} kg</span>
          <span>{weightPct}% to goal</span>
          <span>Target: {GOALS.weightTarget} kg</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
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
    { label: 'Protein',  hit: macros.p >= 130 },
    { label: 'Calories', hit: cal >= 1200 && cal <= 1600 },
    { label: 'Steps',    hit: steps >= 10000 },
    { label: 'Workout',  hit: !!(todayLog?.exercises?.length || todayLog?.cardio_type) },
  ]
  const goalsHit = goals.filter(g => g.hit).length

  const circ = 2 * Math.PI * 28
  const offset = circ * (1 - score / 100)
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b'

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Today</h3>
        <span className="text-gray-400 text-xs">{new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}</span>
      </div>
      <div className="flex items-center gap-4">
        {/* mini score ring */}
        <div className="relative shrink-0">
          <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={36} cy={36} r={28} fill="none" stroke="#f1f5f9" strokeWidth={8} />
            <circle cx={36} cy={36} r={28} fill="none" stroke={color} strokeWidth={8}
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-black text-gray-800">{score}</div>
          </div>
        </div>
        {/* goal dots */}
        <div className="flex-1">
          <div className="text-gray-500 text-sm mb-2">{goalsHit}/5 goals hit</div>
          <div className="flex gap-1.5">
            {goals.map(g => (
              <div key={g.label} title={g.label}
                className={`flex-1 h-2 rounded-full ${g.hit ? 'bg-emerald-400' : 'bg-gray-100'}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {goals.map(g => (
              <div key={g.label} className="text-xs text-gray-300 text-center"
                style={{ width: `${100/goals.length}%` }}>{g.label.slice(0,3)}</div>
            ))}
          </div>
        </div>
      </div>

      {/* quick stats */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: 'Calories', val: cal || '—', target: '1500', unit: 'kcal', ok: cal >= 1200 && cal <= 1600 },
          { label: 'Protein',  val: macros.p || '—', target: '130', unit: 'g', ok: macros.p >= 130 },
          { label: 'Steps',    val: steps ? (steps/1000).toFixed(1)+'k' : '—', target: '10k', unit: '', ok: steps >= 10000 },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-2.5 text-center ${s.ok ? 'bg-emerald-50' : 'bg-gray-50'}`}>
            <div className={`text-lg font-bold ${s.ok ? 'text-emerald-600' : 'text-gray-700'}`}>{s.val}</div>
            <div className="text-gray-400 text-xs">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalorieTrend({ logs }) {
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
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 2200]} width={35} />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
          <ReferenceLine y={1200} stroke="#a5b4fc" strokeDasharray="4 2" />
          <ReferenceLine y={1600} stroke="#a5b4fc" strokeDasharray="4 2" />
          <Area type="monotone" dataKey="cal" stroke="#6366f1" strokeWidth={2.5}
            fill="url(#calGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} name="kcal" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function WeightTrend({ logs }) {
  const weightLogs = logs.filter(l => l.weight).slice(0, 30).reverse()
  // Always include start point
  const data = weightLogs.length
    ? weightLogs.map(l => ({ date: l.date?.slice(5), w: Number(l.weight) }))
    : [{ date: GOALS.startDate.slice(5), w: GOALS.startWeight }]

  const latest = weightLogs[weightLogs.length - 1]?.weight || GOALS.startWeight
  const lost = (GOALS.startWeight - latest).toFixed(1)

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-gray-700">Weight</h3>
        <div className="text-right">
          <div className="text-lg font-black text-emerald-600">{latest} kg</div>
          <div className="text-xs text-gray-400">
            {lost > 0 ? `−${lost} kg lost` : `goal: ${GOALS.weightTarget} kg`}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }}
            domain={[Math.min(GOALS.weightTarget - 1, latest - 1), GOALS.startWeight + 1]} width={32} />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
            formatter={v => [`${v} kg`, 'Weight']} />
          <ReferenceLine y={GOALS.weightTarget} stroke="#6ee7b7" strokeDasharray="4 2"
            label={{ value: `${GOALS.weightTarget}kg`, fill: '#6ee7b7', fontSize: 9, position: 'right' }} />
          <Area type="monotone" dataKey="w" stroke="#10b981" strokeWidth={2.5}
            fill="url(#wGrad)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} name="kg" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function BalanceTrend({ logs }) {
  const balanceLogs = logs.filter(l => l.account_balance).slice(0, 30).reverse()
  const data = balanceLogs.map(l => ({ date: l.date?.slice(5), bal: Number(l.account_balance) }))
  const latest = balanceLogs[balanceLogs.length - 1]?.account_balance

  if (!data.length) return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between" style={{ minHeight: 200 }}>
      <h3 className="font-semibold text-gray-700">Balance</h3>
      <div className="text-center text-gray-300 text-sm py-6">No balance data yet</div>
    </div>
  )

  const first = data[0]?.bal || 0
  const diff = latest - first
  const up = diff >= 0

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-gray-700">Balance</h3>
        <div className="text-right">
          <div className="text-lg font-black text-indigo-600">₹{Number(latest).toLocaleString()}</div>
          <div className={`text-xs font-medium ${up ? 'text-emerald-500' : 'text-red-400'}`}>
            {up ? '+' : ''}₹{diff.toLocaleString()} this period
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={40}
            tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} domain={['dataMin - 1000', 'dataMax + 1000']} />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }}
            formatter={v => [`₹${Number(v).toLocaleString()}`, 'Balance']} />
          <Area type="monotone" dataKey="bal" stroke="#6366f1" strokeWidth={2.5}
            fill="url(#balGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} name="Balance" />
        </AreaChart>
      </ResponsiveContainer>
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
    <div className="grid grid-cols-3 gap-3">
      {[
        { emoji: '🔥', val: log, label: 'Log streak', color: 'text-orange-500', bg: 'from-orange-50 to-red-50', border: 'border-orange-100' },
        { emoji: '🏋️', val: gym, label: 'Gym streak', color: 'text-indigo-600', bg: 'from-indigo-50 to-purple-50', border: 'border-indigo-100' },
        { emoji: '🎯', val: protein, label: 'Protein', color: 'text-emerald-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
      ].map(s => (
        <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-3 text-center`}>
          <div className="text-2xl">{s.emoji}</div>
          <div className={`text-2xl font-black ${s.color}`}>{s.val}d</div>
          <div className="text-gray-400 text-xs">{s.label}</div>
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
  const curBF = logs.find(l => l.body_fat)?.body_fat || GOALS.startBodyFat

  const weightPct = Math.max(0, Math.min(
    Math.round(((GOALS.startWeight - curWeight) / (GOALS.startWeight - GOALS.weightTarget)) * 100), 100
  ))
  const bfPct = Math.max(0, Math.min(
    Math.round(((GOALS.startBodyFat - curBF) / (GOALS.startBodyFat - GOALS.bodyFatTarget)) * 100), 100
  ))

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-3">Body Composition</h3>
      {[
        { label: 'Weight', cur: `${curWeight} kg`, goal: `${GOALS.weightTarget} kg`, pct: weightPct, color: '#6366f1' },
        { label: 'Body Fat', cur: `${curBF}%`, goal: `${GOALS.bodyFatTarget}%`, pct: bfPct, color: '#ec4899' },
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
          <div className="text-right text-xs text-gray-400 mt-0.5">{m.pct}% there</div>
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
