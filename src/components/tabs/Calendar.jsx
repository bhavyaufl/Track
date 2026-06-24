import { GOALS } from '../../lib/constants'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDayColor(log) {
  if (!log) return '#1e293b' // no data
  const score = log.daily_score || 0
  if (score >= 80) return '#10b981'
  if (score >= 50) return '#f59e0b'
  if (score > 0) return '#6366f1'
  return '#334155' // logged but 0 score
}

function getDayEmoji(log) {
  if (!log) return ''
  if (log.exercises?.length) return '🏋️'
  if (log.cardio_type) return '🏃'
  return '😴'
}

export default function Calendar({ logs }) {
  const start = new Date(GOALS.startDate)
  const end = new Date(GOALS.endDate)
  const today = new Date()

  // Build a map of date → log
  const logMap = {}
  logs.forEach(l => { logMap[l.date] = l })

  // Build calendar weeks from start
  const startDay = new Date(start)
  startDay.setDate(startDay.getDate() - startDay.getDay()) // back to Sunday

  const weeks = []
  let cur = new Date(startDay)

  while (cur <= end || weeks.length < 10) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split('T')[0]
      const inRange = cur >= start && cur <= end
      const isFuture = cur > today
      week.push({
        date: dateStr,
        inRange,
        isFuture,
        log: logMap[dateStr] || null,
        dayNum: cur.getDate(),
        month: cur.getMonth(),
      })
      cur = new Date(cur)
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (cur > end && !weeks.some(w => w.some(d => d.inRange && !d.isFuture && !d.log))) break
    if (weeks.length > 15) break
  }

  const daysLogged = logs.length
  const totalDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1
  const daysLeft = Math.floor((end - today) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/40">
          <div className="text-2xl font-bold text-indigo-400">{daysLogged}</div>
          <div className="text-slate-400 text-xs">Days logged</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/40">
          <div className="text-2xl font-bold text-emerald-400">{totalDays}</div>
          <div className="text-slate-400 text-xs">Days elapsed</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/40">
          <div className="text-2xl font-bold text-yellow-400">{Math.max(daysLeft, 0)}</div>
          <div className="text-slate-400 text-xs">Days to Aug 9</div>
        </div>
      </div>

      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 mb-2 min-w-[350px]">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-slate-500 text-xs">{d}</div>
          ))}
        </div>

        <div className="space-y-1 min-w-[350px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map(day => (
                <div key={day.date}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative cursor-default"
                  style={{
                    background: !day.inRange ? 'transparent' :
                      day.isFuture ? '#0f172a' :
                      getDayColor(day.log),
                    opacity: !day.inRange ? 0.2 : 1,
                    border: day.date === new Date().toISOString().split('T')[0] ? '2px solid #6366f1' : '2px solid transparent',
                  }}
                  title={day.date}>
                  {day.inRange && !day.isFuture && (
                    <>
                      <span className="text-xs">{getDayEmoji(day.log)}</span>
                      <span className="text-white/70 text-xs leading-none">{day.dayNum}</span>
                    </>
                  )}
                  {day.inRange && day.isFuture && (
                    <span className="text-slate-700 text-xs">{day.dayNum}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-4 flex-wrap">
          {[
            { color: '#10b981', label: '80+ score' },
            { color: '#f59e0b', label: '50–79 score' },
            { color: '#6366f1', label: 'Logged' },
            { color: '#334155', label: 'Rest' },
            { color: '#1e293b', label: 'Missed' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: l.color }} />
              <span className="text-slate-400 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
