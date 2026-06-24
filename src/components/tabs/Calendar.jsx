import { GOALS } from '../../lib/constants'

const DAY_LABELS = ['S','M','T','W','T','F','S']

function getDayStyle(log, inRange, isFuture) {
  if (!inRange) return { bg: 'transparent', text: 'text-gray-200' }
  if (isFuture) return { bg: '#f8fafc', text: 'text-gray-300', border: '1px solid #f1f5f9' }
  if (!log) return { bg: '#fef2f2', text: 'text-red-300', border: '1px solid #fee2e2' }
  const score = log.daily_score || 0
  if (score >= 80) return { bg: '#d1fae5', text: 'text-emerald-700', border: '1px solid #a7f3d0' }
  if (score >= 50) return { bg: '#eef2ff', text: 'text-indigo-600', border: '1px solid #c7d2fe' }
  return { bg: '#fef9c3', text: 'text-yellow-600', border: '1px solid #fde68a' }
}

export default function Calendar({ logs }) {
  const start = new Date(GOALS.startDate)
  const end = new Date(GOALS.endDate)
  const today = new Date()
  today.setHours(0,0,0,0)

  const logMap = {}
  logs.forEach(l => { logMap[l.date] = l })

  const startSun = new Date(start)
  startSun.setDate(startSun.getDate() - startSun.getDay())

  const weeks = []
  let cur = new Date(startSun)
  while (cur <= end) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split('T')[0]
      week.push({
        date: dateStr,
        inRange: cur >= start && cur <= end,
        isFuture: cur > today,
        log: logMap[dateStr] || null,
        day: cur.getDate(),
        isToday: cur.getTime() === today.getTime(),
      })
      cur = new Date(cur); cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (weeks.length > 16) break
  }

  const daysLogged = logs.length
  const daysElapsed = Math.floor((today - start) / 86400000) + 1
  const daysLeft = Math.max(0, Math.floor((end - today) / 86400000))
  const consistency = daysElapsed > 0 ? Math.round((daysLogged / daysElapsed) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { val: daysLogged, label: 'Logged', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { val: daysElapsed, label: 'Elapsed', color: 'text-gray-700', bg: 'bg-gray-100' },
          { val: daysLeft, label: 'Remaining', color: 'text-amber-600', bg: 'bg-amber-50' },
          { val: `${consistency}%`, label: 'Consistency', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm overflow-x-auto">
        <div className="min-w-[320px]">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="text-center text-gray-300 text-xs font-medium">{d}</div>
            ))}
          </div>
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map(day => {
                  const s = getDayStyle(day.log, day.inRange, day.isFuture)
                  return (
                    <div key={day.date}
                      className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative"
                      style={{
                        background: s.bg,
                        border: day.isToday ? '2px solid #6366f1' : s.border || 'none',
                      }}
                      title={`${day.date}${day.log ? ` · Score: ${day.log.daily_score}` : ''}`}>
                      {day.inRange && (
                        <span className={s.text}>{day.day}</span>
                      )}
                      {day.inRange && !day.isFuture && day.log?.exercises?.length > 0 && (
                        <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-4 flex-wrap">
          {[
            { color: '#d1fae5', border: '#a7f3d0', label: '80+ score' },
            { color: '#eef2ff', border: '#c7d2fe', label: '50–79 score' },
            { color: '#fef9c3', border: '#fde68a', label: 'Logged' },
            { color: '#fef2f2', border: '#fee2e2', label: 'Missed' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: l.color, border: `1px solid ${l.border}` }} />
              <span className="text-gray-400 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
