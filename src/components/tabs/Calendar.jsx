import { useState, useEffect } from 'react'
import { GOALS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

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

function fmt(n) { return Number(n || 0).toLocaleString() }

function DayModal({ date, log, onClose }) {
  const [photo, setPhoto] = useState(null)
  const [loadingPhoto, setLoadingPhoto] = useState(true)

  useEffect(() => {
    supabase.from('progress_photos')
      .select('photo_thumb, analysis')
      .eq('date', date)
      .single()
      .then(({ data }) => { setPhoto(data); setLoadingPhoto(false) })
  }, [date])

  const macros  = log?.macros   || { p: 0, c: 0, f: 0 }
  const cal     = log?.calories || 0
  const steps   = log?.steps    || 0
  const weight  = log?.weight
  const spent   = (log?.spending || []).reduce((s, e) => s + e.amount, 0)
  const score   = log?.daily_score || 0
  const exs     = log?.exercises || []
  const muscles = log?.muscles   || []

  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-indigo-600' : 'text-amber-500'

  const d = new Date(date + 'T00:00:00')
  const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white rounded-t-3xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <div className="font-bold text-gray-800">{label}</div>
            {log && <div className={`text-xs font-semibold mt-0.5 ${scoreColor}`}>Score {score}/100</div>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors text-lg">
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 pb-8">
          {!log ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">📭</div>
              <div className="text-gray-500 font-medium text-sm">No log for this day</div>
              <div className="text-gray-400 text-xs mt-1">Use the Log tab to add data</div>
            </div>
          ) : (
            <>
              {/* Progress photo */}
              {!loadingPhoto && photo?.photo_thumb && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={`data:image/jpeg;base64,${photo.photo_thumb}`}
                    alt="progress" className="w-full object-cover max-h-52" />
                  {photo.analysis && (
                    <div className="px-3 py-2.5 bg-gray-50">
                      <p className="text-xs text-gray-500 leading-relaxed">{photo.analysis}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <Stat icon="🔥" label="Calories" value={`${fmt(cal)} kcal`}
                  sub={cal >= GOALS.calories.target ? '✓ Goal hit' : `${GOALS.calories.target - cal} under`}
                  hit={cal >= GOALS.calories.target} />
                <Stat icon="💪" label="Protein" value={`${fmt(macros.p)}g`}
                  sub={macros.p >= GOALS.protein ? '✓ Goal hit' : `${GOALS.protein - macros.p}g under`}
                  hit={macros.p >= GOALS.protein} />
                <Stat icon="👣" label="Steps" value={fmt(steps)}
                  sub={steps >= GOALS.steps ? '✓ 10k hit' : `${fmt(GOALS.steps - steps)} to go`}
                  hit={steps >= GOALS.steps} />
                <Stat icon="💰" label="Spent" value={`₹${fmt(spent)}`}
                  sub={spent <= GOALS.dailyBudget ? `₹${fmt(GOALS.dailyBudget - spent)} under` : `₹${fmt(spent - GOALS.dailyBudget)} over`}
                  hit={spent <= GOALS.dailyBudget} />
                {weight && (
                  <Stat icon="⚖️" label="Weight" value={`${weight} kg`}
                    sub={`${(weight - GOALS.weightTarget).toFixed(1)} kg to goal`} hit={false} />
                )}
                {log.screen_time > 0 && (
                  <Stat icon="📱" label="Screen" value={`${Math.floor(log.screen_time/60)}h ${log.screen_time%60}m`}
                    sub={log.screen_time <= 180 ? '✓ Under 3h' : `${log.screen_time-180}m over`}
                    hit={log.screen_time <= 180} />
                )}
              </div>

              {/* Macros detail */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex justify-around text-center">
                {[['Carbs', macros.c, 'g', '#6366f1'],['Protein', macros.p, 'g', '#8b5cf6'],['Fat', macros.f, 'g', '#f59e0b']].map(([label, val, unit, color]) => (
                  <div key={label}>
                    <div className="text-lg font-bold" style={{ color }}>{val}{unit}</div>
                    <div className="text-gray-400 text-xs">{label}</div>
                  </div>
                ))}
              </div>

              {/* Meals */}
              {(['breakfast','lunch','dinner','snacks'].some(k => log[k])) && (
                <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                  <h4 className="text-gray-700 font-semibold text-sm mb-2">Meals</h4>
                  <div className="space-y-1.5">
                    {[['breakfast','🌅'],['lunch','☀️'],['dinner','🌙'],['snacks','🍿']].map(([key, icon]) =>
                      log[key] ? (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="shrink-0">{icon}</span>
                          <span className="text-gray-600">{log[key]}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* Exercises */}
              {(exs.length > 0 || log.cardio_type) && (
                <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-gray-700 font-semibold text-sm">Workout</h4>
                    {muscles.map(m => (
                      <span key={m} className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {exs.map((ex, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 font-medium">{ex.name}</span>
                        <span className="text-gray-400">{ex.weight}{ex.unit} · {ex.sets?.join('/')} reps</span>
                      </div>
                    ))}
                    {log.cardio_type && (
                      <div className="text-xs text-gray-500 mt-1">
                        🏃 {log.cardio_type} · {log.cardio_duration} min · {log.cardio_intensity}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Spending */}
              {log.spending?.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-gray-700 font-semibold text-sm">Spending</h4>
                    <span className="text-xs text-gray-500 font-medium">₹{fmt(spent)} total</span>
                  </div>
                  <div className="space-y-1">
                    {log.spending.map((s, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-600">{s.item}</span>
                          <span className="text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{s.category}</span>
                        </div>
                        <span className="text-gray-700 font-medium">₹{s.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value, sub, hit }) {
  return (
    <div className={`rounded-2xl p-3 border ${hit ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <div className={`text-lg font-bold ${hit ? 'text-emerald-600' : 'text-gray-700'}`}>{value}</div>
      <div className={`text-xs mt-0.5 ${hit ? 'text-emerald-500' : 'text-gray-400'}`}>{sub}</div>
    </div>
  )
}

export default function Calendar({ logs }) {
  const [selected, setSelected] = useState(null)

  const start = new Date(GOALS.startDate)
  const end   = new Date(GOALS.endDate)
  const today = new Date(); today.setHours(0,0,0,0)

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

  const daysLogged  = logs.length
  const daysElapsed = Math.floor((today - start) / 86400000) + 1
  const daysLeft    = Math.max(0, Math.floor((end - today) / 86400000))
  const consistency = daysElapsed > 0 ? Math.round((daysLogged / daysElapsed) * 100) : 0

  function handleDayClick(day) {
    if (!day.inRange || day.isFuture) return
    setSelected(day)
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="grid grid-cols-4 gap-3">
        {[
          { val: daysLogged,     label: 'Logged',      color: 'text-indigo-600',  bg: 'bg-indigo-50' },
          { val: daysElapsed,    label: 'Elapsed',     color: 'text-gray-700',    bg: 'bg-gray-100' },
          { val: daysLeft,       label: 'Remaining',   color: 'text-amber-600',   bg: 'bg-amber-50' },
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
                  const clickable = day.inRange && !day.isFuture
                  return (
                    <button key={day.date}
                      onClick={() => handleDayClick(day)}
                      disabled={!clickable}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative transition-transform ${clickable ? 'active:scale-90 cursor-pointer hover:ring-2 hover:ring-indigo-300 hover:ring-offset-1' : 'cursor-default'}`}
                      style={{
                        background: s.bg,
                        border: day.isToday ? '2px solid #6366f1' : s.border || 'none',
                      }}>
                      {day.inRange && (
                        <span className={s.text}>{day.day}</span>
                      )}
                      {day.inRange && !day.isFuture && day.log?.exercises?.length > 0 && (
                        <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      )}
                    </button>
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
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-indigo-400 rounded-full" />
            <span className="text-gray-400 text-xs">Gym day</span>
          </div>
        </div>
      </div>

      {selected && (
        <DayModal
          date={selected.date}
          log={selected.log}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
