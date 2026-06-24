import { BADGES, EXERCISE_GOALS, GOALS } from '../../lib/constants'

function calcStreaks(logs) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  let logStreak = 0, gymStreak = 0, proteinStreak = 0
  for (const log of sorted) { if (log.date) logStreak++; else break }
  for (const log of sorted) { if (log.exercises?.length) gymStreak++; else break }
  for (const log of sorted) { if (log.macros?.p >= 130) proteinStreak++; else break }
  return { logStreak, gymStreak, proteinStreak }
}

function GoalProgressBar({ ex, levels }) {
  if (!ex.goal) return null
  const levelEntry = levels.find(l => l.exercise_name === ex.name)
  const current = levelEntry?.current_weight || 0

  let pct = 0
  if (ex.type === 'time') {
    // lower is better — if current is 0 treat as not started
    pct = current ? Math.min((ex.goal / current) * 100, 100) : 0
  } else {
    pct = Math.min((current / ex.goal) * 100, 100)
  }

  const hit = pct >= 100
  const barColor = hit ? '#10b981' : pct >= 70 ? '#6366f1' : pct >= 40 ? '#f59e0b' : '#94a3b8'

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{ex.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{ex.scheme}</span>
          <span className="text-sm font-bold" style={{ color: hit ? '#10b981' : '#6366f1' }}>
            {current ? `${current} / ${ex.goal} ${ex.unit}` : `— / ${ex.goal} ${ex.unit}`}
          </span>
          {hit && <span className="text-emerald-500 text-xs font-bold">✓</span>}
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="text-right text-xs text-gray-400 mt-0.5">{Math.round(pct)}%</div>
    </div>
  )
}

function OverallPower({ levels }) {
  const tracked = EXERCISE_GOALS.filter(e => e.goal)
  let total = 0
  tracked.forEach(ex => {
    const entry = levels.find(l => l.exercise_name === ex.name)
    const current = entry?.current_weight || 0
    if (ex.type === 'time') {
      total += current ? Math.min((ex.goal / current) * 100, 100) : 0
    } else {
      total += Math.min((current / ex.goal) * 100, 100)
    }
  })
  const avg = tracked.length ? Math.round(total / tracked.length) : 0
  const circumference = 2 * Math.PI * 54
  const offset = circumference * (1 - avg / 100)
  const color = avg >= 80 ? '#10b981' : avg >= 50 ? '#6366f1' : '#f59e0b'

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={128} height={128} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={64} cy={64} r={54} fill="none" stroke="#f1f5f9" strokeWidth={12} />
          <circle cx={64} cy={64} r={54} fill="none" stroke={color} strokeWidth={12}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute text-center">
          <div className="text-3xl font-black" style={{ color }}>{avg}%</div>
          <div className="text-gray-400 text-xs">to goals</div>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-gray-800">Power Level</div>
        <div className="text-gray-500 text-sm mt-1">Average progress across {tracked.length} tracked lifts</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-indigo-50 rounded-lg p-2">
            <div className="text-lg font-bold text-indigo-600">{tracked.filter(ex => {
              const e = levels.find(l => l.exercise_name === ex.name)
              return e?.current_weight >= ex.goal
            }).length}</div>
            <div className="text-xs text-gray-500">Goals hit</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-2">
            <div className="text-lg font-bold text-amber-600">{Math.max(0, Math.floor((new Date('2026-08-09') - new Date()) / 86400000))}</div>
            <div className="text-xs text-gray-500">Days left</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2">
            <div className="text-lg font-bold text-emerald-600">{tracked.filter(ex => {
              const e = levels.find(l => l.exercise_name === ex.name)
              const cur = e?.current_weight || 0
              const pct = ex.type === 'time' ? (cur ? (ex.goal/cur)*100 : 0) : (cur/ex.goal)*100
              return pct >= 70
            }).length}</div>
            <div className="text-xs text-gray-500">≥ 70%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BadgeCabinet({ earnedBadges }) {
  const earnedKeys = new Set(earnedBadges.map(b => b.badge_key))
  return (
    <div className="grid grid-cols-2 gap-2">
      {BADGES.map(b => {
        const earned = earnedKeys.has(b.key)
        return (
          <div key={b.key} className={`rounded-xl p-3 border transition-all ${
            earned ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100 opacity-50 grayscale'
          }`}>
            <div className="text-xl mb-1">{b.emoji}</div>
            <div className={`text-sm font-semibold ${earned ? 'text-yellow-700' : 'text-gray-400'}`}>{b.name}</div>
            <div className="text-gray-400 text-xs">{b.desc}</div>
          </div>
        )
      })}
    </div>
  )
}

const GROUPS = ['Push', 'Pull', 'Legs', 'Cardio']

export default function PowerLevel({ logs, badges, levels }) {
  const totalXP = logs.reduce((sum, l) => sum + (l.xp_earned || 0), 0)
  const { logStreak, gymStreak, proteinStreak } = calcStreaks(logs)

  return (
    <div className="space-y-4">
      {/* Overall power ring */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <OverallPower levels={levels} />
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: '🔥', label: 'Log streak', value: logStreak, color: 'text-orange-500', bg: 'bg-orange-50' },
          { emoji: '🏋️', label: 'Gym streak', value: gymStreak, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { emoji: '🎯', label: 'Protein', value: proteinStreak, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-gray-100`}>
            <div className="text-xl">{s.emoji}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}d</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* XP pill */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <div className="text-white/70 text-xs uppercase tracking-wide">Total XP</div>
          <div className="text-white text-3xl font-black">⚡ {totalXP.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-white/70 text-xs">Days logged</div>
          <div className="text-white text-2xl font-bold">{logs.length}</div>
        </div>
      </div>

      {/* Lift progress by group */}
      {GROUPS.map(group => {
        const exercises = EXERCISE_GOALS.filter(e => e.group === group && e.goal)
        if (!exercises.length) return null
        return (
          <div key={group} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-2">{group}</h3>
            <div className="divide-y divide-gray-50">
              {exercises.map(ex => (
                <GoalProgressBar key={ex.name} ex={ex} levels={levels} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Body composition */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">Body Composition</h3>
        {[
          { label: 'Weight', current: logs.find(l=>l.weight)?.weight || GOALS.startWeight, goal: GOALS.weightTarget, unit: 'kg', type: 'time' },
          { label: 'Body Fat', current: logs.find(l=>l.body_fat)?.body_fat || GOALS.startBodyFat, goal: GOALS.bodyFatTarget, unit: '%', type: 'time' },
        ].map(m => {
          const pct = Math.min(Math.round(((m.current - (m.label==='Weight'?GOALS.startWeight:GOALS.startBodyFat)) /
            ((m.label==='Weight'?GOALS.weightTarget:GOALS.bodyFatTarget) - (m.label==='Weight'?GOALS.startWeight:GOALS.startBodyFat))) * 100), 100)
          const progress = Math.max(pct, 0)
          return (
            <div key={m.label} className="py-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{m.label}</span>
                <span className="text-sm font-bold text-indigo-600">{m.current} → {m.goal} {m.unit}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-right text-xs text-gray-400 mt-0.5">{progress}% of the way</div>
            </div>
          )
        })}
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">Badges</h3>
        <BadgeCabinet earnedBadges={badges} />
      </div>
    </div>
  )
}
