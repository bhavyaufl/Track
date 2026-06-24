import { BADGES } from '../../lib/constants'

function XPBar({ totalXP }) {
  const xpPerLevel = 500
  const level = Math.floor(totalXP / xpPerLevel) + 1
  const xpInLevel = totalXP % xpPerLevel
  const pct = (xpInLevel / xpPerLevel) * 100

  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <div>
          <div className="text-slate-400 text-sm">Power Level</div>
          <div className="text-5xl font-black text-white">{totalXP.toLocaleString()} XP</div>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-xs">Rank</div>
          <div className="text-2xl font-bold text-indigo-400">Lv.{level}</div>
        </div>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
          style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{xpInLevel} / {xpPerLevel} XP to next level</span>
        <span>Lv.{level + 1}</span>
      </div>
    </div>
  )
}

function StreakCard({ emoji, label, value }) {
  return (
    <div className="bg-slate-700/50 rounded-xl p-3 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-xs mt-0.5">{label}</div>
    </div>
  )
}

function calcStreaks(logs) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  let logStreak = 0, gymStreak = 0, proteinStreak = 0

  for (const log of sorted) {
    if (log.date) logStreak++
    else break
  }
  for (const log of sorted) {
    if (log.exercises?.length) gymStreak++
    else break
  }
  for (const log of sorted) {
    if (log.macros?.p >= 130) proteinStreak++
    else break
  }

  return { logStreak, gymStreak, proteinStreak }
}

function BadgeCabinet({ earnedBadges }) {
  const earnedKeys = new Set(earnedBadges.map(b => b.badge_key))

  return (
    <div className="grid grid-cols-2 gap-3">
      {BADGES.map(b => {
        const earned = earnedKeys.has(b.key)
        return (
          <div key={b.key} className={`rounded-xl p-3 border transition-all ${
            earned
              ? 'bg-yellow-900/30 border-yellow-700/50'
              : 'bg-slate-800/40 border-slate-700/30 opacity-40 grayscale'
          }`}>
            <div className="text-2xl mb-1">{b.emoji}</div>
            <div className={`text-sm font-semibold ${earned ? 'text-yellow-300' : 'text-slate-500'}`}>
              {b.name}
            </div>
            <div className="text-slate-500 text-xs mt-0.5">{b.desc}</div>
            {earned && earnedBadges.find(e => e.badge_key === b.key)?.earned_at && (
              <div className="text-yellow-600 text-xs mt-1">
                {earnedBadges.find(e => e.badge_key === b.key).earned_at}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function PowerLevel({ logs, badges }) {
  const totalXP = logs.reduce((sum, l) => sum + (l.xp_earned || 0), 0)
  const { logStreak, gymStreak, proteinStreak } = calcStreaks(logs)

  return (
    <div className="space-y-5">
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/40">
        <XPBar totalXP={totalXP} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StreakCard emoji="🔥" label="Log streak" value={`${logStreak}d`} />
        <StreakCard emoji="🏋️" label="Gym streak" value={`${gymStreak}d`} />
        <StreakCard emoji="🎯" label="Protein streak" value={`${proteinStreak}d`} />
      </div>

      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Badge Cabinet</h3>
        <BadgeCabinet earnedBadges={badges} />
      </div>
    </div>
  )
}
