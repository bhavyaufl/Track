import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { todayIST } from '../../lib/dateIST'

async function resizeToBase64(file, maxPx) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result.split(',')[1])
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.8)
    }
    img.src = url
  })
}

function BodyProgress() {
  const today = new Date().toISOString().split('T')[0]
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    supabase.from('progress_photos')
      .select('id,date,photo_thumb,analysis')
      .order('date', { ascending: false })
      .limit(60)
      .then(({ data }) => setPhotos(data || []))
  }, [])

  const todayPhoto = photos.find(p => p.date === today)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const [full, thumb] = await Promise.all([
        resizeToBase64(file, 800),
        resizeToBase64(file, 300),
      ])
      const res = await fetch('/api/progress-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, image: full, thumb, note }),
      })
      const data = await res.json()
      setNote('')
      // Refresh
      const { data: updated } = await supabase.from('progress_photos')
        .select('id,date,photo_thumb,analysis').order('date', { ascending: false }).limit(60)
      setPhotos(updated || [])
      if (data.analysis) setSelected({ photo_thumb: `data:image/jpeg;base64,${thumb}`, analysis: data.analysis, date: today })
    } catch { /* silent */ }
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      {/* Upload card */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-gray-700 font-semibold text-sm">Daily Progress Photo</h3>
            <div className="text-gray-400 text-xs">{today}</div>
          </div>
          {todayPhoto && <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium">✓ Logged today</span>}
        </div>

        {!todayPhoto && (
          <input
            className="w-full text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:border-indigo-300"
            placeholder="Optional note (e.g. morning, after pump...)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all ${
            uploading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : todayPhoto
              ? 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
          }`}>
          {uploading ? '⏳ Analysing with Claude…' : todayPhoto ? '📸 Update today\'s photo' : '📸 Take today\'s progress photo'}
        </button>
      </div>

      {/* Gallery */}
      {photos.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold text-sm mb-3">Progress Gallery · {photos.length} photos</h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => (
              <button key={p.id} onClick={() => setSelected(p)}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:ring-2 hover:ring-indigo-400 transition-all">
                {p.photo_thumb
                  ? <img src={`data:image/jpeg;base64,${p.photo_thumb}`} alt={p.date}
                      className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</div>
                }
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-0.5">
                  {p.date?.slice(5)}
                </div>
                {p.date === today && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
          <div className="text-4xl mb-2">📸</div>
          <div className="text-gray-500 text-sm font-medium">No photos yet</div>
          <div className="text-gray-400 text-xs mt-1">Take your first progress photo above</div>
        </div>
      )}

      {/* Selected photo modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col" onClick={() => setSelected(null)}>
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl">
              {selected.photo_thumb && (
                <img src={`data:image/jpeg;base64,${selected.photo_thumb}`} alt="progress"
                  className="w-full object-cover max-h-72" />
              )}
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 text-xs font-medium">{selected.date}</span>
                  <button onClick={() => setSelected(null)} className="text-gray-400 text-xs">Close ✕</button>
                </div>
                {selected.analysis && (
                  <p className="text-gray-600 text-sm leading-relaxed">{selected.analysis}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS, EXERCISE_GOALS } from '../../lib/constants'
import { useTooltipStyle } from '../../lib/DarkContext'
import { DAY_WORKOUT, GROUP_LABEL, GROUP_EMOJI, GROUP_COLOR, WORKOUT_GROUPS, CARDIO_PLAN } from '../../lib/workoutPlan'

const SCREEN_TIME_GOAL = 180 // minutes — 3 hours

function fmt(mins) {
  if (!mins) return '0h 0m'
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function ScreenTime({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const today = new Date().toISOString().split('T')[0]
  const todayLog = logs.find(l => l.date === today)
  const todayMins = todayLog?.screen_time || 0

  const last7 = logs.slice(0, 7).reverse().map(l => ({
    date: l.date?.slice(5),
    mins: l.screen_time || 0,
    hrs: ((l.screen_time || 0) / 60).toFixed(1),
  }))

  const avg = last7.length
    ? Math.round(last7.reduce((s, d) => s + d.mins, 0) / last7.length)
    : 0

  const overGoal = todayMins > SCREEN_TIME_GOAL
  const pct = Math.min((todayMins / SCREEN_TIME_GOAL) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Today card */}
      <div className={`rounded-2xl p-5 border ${overGoal ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">Today's Screen Time</div>
            <div className={`text-4xl font-black mt-1 ${overGoal ? 'text-red-500' : 'text-gray-800'}`}>
              {fmt(todayMins)}
            </div>
            <div className={`text-xs mt-1 ${overGoal ? 'text-red-400' : 'text-gray-400'}`}>
              {overGoal
                ? `${fmt(todayMins - SCREEN_TIME_GOAL)} over limit`
                : todayMins ? `${fmt(SCREEN_TIME_GOAL - todayMins)} under goal ✓` : 'Not logged yet'}
            </div>
          </div>
          <div className="text-4xl">📱</div>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: overGoal ? '#ef4444' : '#6366f1' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0</span>
          <span className="text-indigo-400">Goal: {fmt(SCREEN_TIME_GOAL)}</span>
          <span>{fmt(todayMins)}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', val: fmt(todayMins), color: overGoal ? 'text-red-500' : 'text-gray-800', bg: overGoal ? 'bg-red-50' : 'bg-gray-50' },
          { label: '7-day avg', val: fmt(avg), color: avg > SCREEN_TIME_GOAL ? 'text-amber-500' : 'text-emerald-600', bg: 'bg-gray-50' },
          { label: 'Goal', val: fmt(SCREEN_TIME_GOAL), color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center border border-gray-100`}>
            <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
            <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 7-day chart */}
      {last7.some(d => d.mins > 0) ? (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold mb-3">Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last7} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={v => `${(v/60).toFixed(0)}h`} domain={[0, Math.max(SCREEN_TIME_GOAL * 1.5, 60)]} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={v => [fmt(v), 'Screen time']} />
              <ReferenceLine y={SCREEN_TIME_GOAL} stroke="#a5b4fc" strokeDasharray="4 2"
                label={{ value: '3h goal', fill: '#818cf8', fontSize: 10, position: 'right' }} />
              <Bar dataKey="mins" radius={[6, 6, 0, 0]} name="mins"
                fill="#6366f1"
                label={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
          <div className="text-3xl mb-2">📱</div>
          <div className="text-gray-400 text-sm">No screen time logged yet.</div>
          <div className="text-gray-300 text-xs mt-1">Log it during /checkin each morning.</div>
        </div>
      )}
    </div>
  )
}

function WeightChart({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const weightLogs = logs.filter(l => l.weight).reverse()
  const actualMap  = Object.fromEntries(weightLogs.map(l => [l.date.slice(5), Number(l.weight)]))

  const start = new Date(GOALS.startDate)
  const end   = new Date(GOALS.endDate)
  const totalDays = (end - start) / 86400000

  const pts = []
  let cur = new Date(start)
  while (cur <= end) {
    const day   = (cur - start) / 86400000
    const ideal = Number((GOALS.startWeight + (day / totalDays) * (GOALS.weightTarget - GOALS.startWeight)).toFixed(1))
    const dateKey = cur.toISOString().split('T')[0].slice(5)
    pts.push({ date: dateKey, ideal, actual: actualMap[dateKey] ?? null })
    cur.setDate(cur.getDate() + 7)
  }

  if (!weightLogs.length && pts.every(p => p.actual === null)) return (
    <div className="text-center py-10 text-gray-400 text-sm">No weight data yet.</div>
  )

  const allWeights = weightLogs.map(l => l.weight)
  const yMin = Math.min(GOALS.startWeight - 1, ...allWeights)
  const yMax = Math.max(GOALS.weightTarget + 1, ...allWeights)

  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={pts}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }}
            domain={[yMin, yMax]} width={32} />
          <Tooltip contentStyle={tooltipStyle}
            formatter={(v, name) => [`${v} kg`, name === 'ideal' ? 'Ideal' : 'Actual']} />
          <Line dataKey="ideal" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls name="ideal" />
          <Line dataKey="actual" stroke="#6366f1" strokeWidth={2.5}
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} connectNulls={false} name="actual" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block rounded" /> Actual</span>
        <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-gray-400 inline-block" /> Ideal (91→93 kg)</span>
      </div>
    </>
  )
}

function LevelsTable({ levels }) {
  const GROUPS = ['Push', 'Pull', 'Legs']
  if (!levels.length) return (
    <div className="text-center py-10 text-gray-400 text-sm">No exercise data yet.</div>
  )

  return (
    <div className="space-y-4">
      {GROUPS.map(group => {
        const rows = EXERCISE_GOALS.filter(e => e.group === group).map(ex => {
          const lvl = levels.find(l => l.exercise_name === ex.name)
          return { ...ex, current: lvl?.current_weight || 0, level: lvl?.current_level || 1, lastSets: lvl?.last_sets || [] }
        })

        return (
          <div key={group}>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</div>
            <div className="space-y-1.5">
              {rows.map(r => {
                const started = r.current > 0
                const readyToLevel = started && r.lastSets.length >= 3 && r.lastSets.every(s => s >= 12)
                const pct = r.goal && started
                  ? Math.min(r.type === 'time' ? (r.current ? (r.goal / r.current) * 100 : 0) : (r.current / r.goal) * 100, 100)
                  : 0
                const barColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#6366f1' : '#a5b4fc'

                return (
                  <div key={r.name}
                    className={`rounded-xl px-3 py-2.5 flex items-center justify-between border ${started ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${started ? 'text-gray-700' : 'text-gray-400'}`}>{r.name}</span>
                        {readyToLevel && <span className="text-amber-500 text-xs bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">⬆️ add weight</span>}
                        {!started && <span className="text-gray-300 text-xs">not started</span>}
                      </div>
                      {r.goal && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{Math.round(pct)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-bold text-sm ${started ? 'text-indigo-600' : 'text-gray-300'}`}>
                        {started ? `${r.current} ${r.unit}` : '—'}
                      </div>
                      {r.goal && <div className="text-gray-400 text-xs">/ {r.goal} {r.unit}</div>}
                      {r.scheme && <div className="text-gray-300 text-xs">{r.scheme}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WorkoutHistory({ logs }) {
  const workouts = logs.filter(l => l.exercises?.length || l.cardio_type).slice(0, 14)
  if (!workouts.length) return (
    <div className="text-center py-10 text-gray-400 text-sm">No workouts yet.</div>
  )

  return (
    <div className="space-y-2">
      {workouts.map(l => (
        <div key={l.date} className="bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-700 text-sm font-medium">{l.date}</span>
            <div className="flex gap-1.5">
              {l.muscles?.map(m => (
                <span key={m} className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">{m}</span>
              ))}
              {l.cardio_type && (
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{l.cardio_type}</span>
              )}
            </div>
          </div>
          {l.exercises?.slice(0, 3).map((ex, i) => (
            <div key={i} className="text-gray-400 text-xs">
              {ex.name} · {ex.weight}{ex.unit} · {ex.sets?.join('/')} reps
            </div>
          ))}
          {l.exercises?.length > 3 && (
            <div className="text-gray-300 text-xs">+{l.exercises.length - 3} more</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Weekly Exercise Plan ─────────────────────────────────────────────────────
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function WeeklyPlan({ levels, logs }) {
  const today    = new Date().getDay()
  const [viewDay, setViewDay] = useState(today)
  const goalMap  = Object.fromEntries(EXERCISE_GOALS.map(g => [g.name, g]))
  const levelMap = Object.fromEntries(levels.map(l => [l.exercise_name, l]))

  // find the log for the viewDay this week
  const todayDate = new Date()
  const diffDays  = viewDay - today
  const viewDate  = new Date(todayDate)
  viewDate.setDate(todayDate.getDate() + diffDays)
  const viewDateStr = viewDate.toISOString().split('T')[0]
  const dayLog    = logs.find(l => l.date === viewDateStr)
  const loggedMap = Object.fromEntries((dayLog?.exercises || []).map(e => [e.name, e]))

  const group     = DAY_WORKOUT[viewDay]
  const cardio    = CARDIO_PLAN[viewDay]
  const color     = GROUP_COLOR[group] || '#6366f1'
  const gymExercises = WORKOUT_GROUPS[group] || []
  const doneCount    = gymExercises.filter(n => loggedMap[n]).length

  return (
    <div className="space-y-3">
      {/* Weekly strip */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">This Week</div>
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES_SHORT.map((d, i) => {
            const g = DAY_WORKOUT[i]
            const isToday   = i === today
            const isViewing = i === viewDay
            return (
              <button key={i} onClick={() => setViewDay(i)}
                className={`rounded-xl py-2 flex flex-col items-center gap-0.5 transition-all ${
                  isViewing ? 'ring-2' : 'hover:bg-gray-50'
                }`}
                style={isViewing ? { ringColor: color, outline: `2px solid ${color}`, outlineOffset: 1 } : {}}>
                <div className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>{d}</div>
                <div className="text-base">{GROUP_EMOJI[g]}</div>
                <div className={`text-xs font-medium ${isViewing ? 'text-gray-700' : 'text-gray-400'}`}
                  style={isViewing ? { color } : {}}>
                  {g === 'rest' ? 'Rest' : g === 'cardio' ? '5k' : g}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day plan */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `2px solid ${color}33` }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{GROUP_EMOJI[group]}</span>
              <span className="text-base font-bold text-gray-800">{GROUP_LABEL[group]}</span>
              {viewDay === today && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">Today</span>}
            </div>
            {cardio && <div className="text-xs text-gray-400 mt-0.5 ml-8">{cardio.desc}</div>}
          </div>
          {gymExercises.length > 0 && (
            <div className={`text-sm font-bold px-2.5 py-1 rounded-full ${
              doneCount === gymExercises.length ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
            }`}>{doneCount}/{gymExercises.length} done</div>
          )}
        </div>

        {group === 'rest' && (
          <div className="px-4 py-6 text-center">
            <div className="text-4xl mb-2">😴</div>
            <div className="text-sm font-semibold text-gray-600">Gym is closed — full recovery day</div>
            <div className="text-xs text-gray-500 mt-1">Stretch, walk, or do active recovery</div>
          </div>
        )}

        {group === 'buffer' && (
          <div className="px-4 py-6 text-center">
            <div className="text-4xl mb-2">🔄</div>
            <div className="text-sm font-semibold text-gray-600">Flexible day — gym is open</div>
            <div className="text-xs text-gray-500 mt-1">Makeup session if you missed one, or take the rest</div>
          </div>
        )}

        {gymExercises.length > 0 && group !== 'rest' && group !== 'buffer' && (
          <div className="divide-y divide-gray-50">
            {gymExercises.map(name => {
              const level  = levelMap[name]
              const goal   = goalMap[name]
              const logged = loggedMap[name]
              return (
                <FitnessExRow key={name} name={name} level={level} goal={goal} logged={logged} color={color} />
              )
            })}
          </div>
        )}

        {gymExercises.length > 0 && doneCount === gymExercises.length && (
          <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 text-center">
            <span className="text-xs font-bold text-emerald-600">Session complete 🎉</span>
          </div>
        )}
      </div>
    </div>
  )
}

function FitnessExRow({ name, level, goal, logged, color }) {
  const scheme   = goal?.scheme || '3×12'
  const isDone   = !!logged
  const readyUp  = !isDone && level?.last_sets?.length >= 3 && level.last_sets.every(s => s >= 12)
  const hasLevel = !!level

  let pct = null
  if (hasLevel && goal?.goal != null && level.unit === goal?.unit && goal.goal > 0) {
    pct = Math.min(100, Math.round((level.current_weight / goal.goal) * 100))
  }

  return (
    <div className={`px-4 py-3 ${isDone ? 'bg-emerald-50/40' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
            isDone ? 'bg-emerald-400' : readyUp ? 'bg-amber-400' : hasLevel ? 'bg-indigo-300' : 'bg-gray-200'
          }`} />
          <div className="min-w-0">
            <div className={`text-sm font-semibold ${isDone ? 'text-emerald-700' : 'text-gray-800'}`}>{name}</div>
            {isDone && logged.sets && (
              <div className="text-xs text-emerald-600 mt-0.5 font-medium">
                ✓ {logged.weight} {logged.unit} · sets [{logged.sets.join(', ')}]
              </div>
            )}
            {readyUp && (
              <div className="text-xs text-amber-600 font-semibold mt-0.5">⬆ Ready to increase weight</div>
            )}
            {!hasLevel && !isDone && (
              <div className="text-xs text-gray-600 mt-0.5">Not started — find your starting weight</div>
            )}
            {pct != null && !isDone && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#10b981' : color }} />
                </div>
                <span className="text-xs text-gray-500 shrink-0">{pct}% to goal</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-semibold text-gray-600">{scheme}</div>
          {hasLevel && !isDone && (
            <div className={`text-base font-bold mt-0.5 ${readyUp ? 'text-amber-600' : 'text-indigo-600'}`}>
              {level.current_weight} <span className="text-sm font-medium text-gray-500">{level.unit}</span>
            </div>
          )}
          {goal?.goal != null && (
            <div className="text-xs text-gray-500">→ {goal.goal} {goal.unit}</div>
          )}
          {!hasLevel && <div className="text-sm font-bold text-gray-500 mt-0.5">—</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Cardio Section ───────────────────────────────────────────────────────────
const STEPS_PER_KM = 1250

function loadCardioSessions() {
  try { return JSON.parse(localStorage.getItem('cardio_v1') || '[]') } catch { return [] }
}
function saveCardioSessions(arr) {
  localStorage.setItem('cardio_v1', JSON.stringify(arr))
}

function CardioSection() {
  const today = todayIST()
  const fileRef = useRef(null)
  const [sessions, setSessions] = useState(() => loadCardioSessions())
  const [form, setForm] = useState({ type: 'Treadmill', duration: '', distance: '', caloriesBurned: '' })
  const [photo, setPhoto] = useState(null)
  const [saved, setSaved] = useState(false)

  const todaySession = sessions.find(s => s.date === today)
  const stepsPreview = form.distance ? Math.round(Number(form.distance) * STEPS_PER_KM) : null

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function logSession() {
    const dist = Number(form.distance) || 0
    const session = {
      date: today,
      type: form.type,
      duration: Number(form.duration) || 0,
      distance: dist,
      caloriesBurned: Number(form.caloriesBurned) || 0,
      steps: dist ? Math.round(dist * STEPS_PER_KM) : 0,
      photo: photo || null,
      savedAt: new Date().toISOString(),
    }
    const updated = [...sessions.filter(s => s.date !== today), session]
    saveCardioSessions(updated)
    setSessions(updated)
    setForm({ type: 'Treadmill', duration: '', distance: '', caloriesBurned: '' })
    setPhoto(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const recentSessions = [...sessions].reverse().slice(0, 7)
  const hasData = form.duration || form.distance || form.caloriesBurned

  return (
    <div className="space-y-3">
      {/* Today summary (if logged) */}
      {todaySession && (
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏃</span>
            <span className="text-sm font-bold text-emerald-700">Today's Cardio</span>
            <span className="ml-auto text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">{todaySession.type}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              ['⏱', `${todaySession.duration}m`, 'Duration'],
              ['📏', `${todaySession.distance}km`, 'Distance'],
              ['🔥', `${todaySession.caloriesBurned}`, 'Burned'],
              ['👣', todaySession.steps.toLocaleString(), 'Steps'],
            ].map(([icon, val, label]) => (
              <div key={label} className="bg-white rounded-xl px-2 py-2 text-center border border-emerald-100">
                <div className="text-base leading-none mb-1">{icon}</div>
                <div className="text-sm font-bold text-gray-800 leading-none">{val}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {todaySession.photo && (
            <img src={todaySession.photo} alt="treadmill" className="w-full h-24 object-contain rounded-xl mt-3 bg-white border border-emerald-100" />
          )}
        </div>
      )}

      {/* Log form */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">{todaySession ? 'Update Today' : 'Log Cardio'}</h3>

        {/* Activity type */}
        <div className="flex gap-1.5 mb-3">
          {['Treadmill', 'Run', 'Cycle', 'Other'].map(t => (
            <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
              className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                form.type === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>{t}</button>
          ))}
        </div>

        {/* Photo upload */}
        <div className="mb-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          {photo ? (
            <div className="relative">
              <img src={photo} alt="Treadmill display" className="w-full h-40 object-contain rounded-xl bg-gray-50 border border-gray-100" />
              <button onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full hover:bg-black/70">✕</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3.5 text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2">
              <span>📷</span>
              <span>Add treadmill photo (optional)</span>
            </button>
          )}
        </div>

        {/* Input fields */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Duration (min)</label>
            <input type="number" min="0" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="0"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center font-semibold text-gray-700 focus:outline-none focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Distance (km)</label>
            <input type="number" min="0" step="0.1" value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
              placeholder="0.0"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center font-semibold text-gray-700 focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1 block">Calories Burned (kcal)</label>
            <input type="number" min="0" value={form.caloriesBurned} onChange={e => setForm(f => ({ ...f, caloriesBurned: e.target.value }))}
              placeholder="0"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-center font-semibold text-gray-700 focus:outline-none focus:border-indigo-400" />
          </div>
        </div>

        {stepsPreview && (
          <div className="text-xs text-indigo-500 text-center mb-3 bg-indigo-50 rounded-lg py-1.5">
            👣 ~{stepsPreview.toLocaleString()} steps from {form.distance} km
          </div>
        )}

        <button onClick={logSession} disabled={!hasData}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 active:scale-95 transition-all">
          {saved ? '✓ Saved!' : todaySession ? 'Update Session' : 'Save Session'}
        </button>
      </div>

      {/* Recent history */}
      {recentSessions.length > 0 && (
        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold text-sm mb-2">Recent Sessions</h3>
          <div className="space-y-1">
            {recentSessions.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 py-2 ${i < recentSessions.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <span className="text-xs text-gray-400 shrink-0 w-10">{s.date.slice(5)}</span>
                <span className="text-xs font-medium text-gray-600 shrink-0 w-16">{s.type}</span>
                <div className="flex gap-2 ml-auto text-xs text-gray-500 flex-wrap justify-end">
                  {s.duration > 0 && <span>⏱{s.duration}m</span>}
                  {s.distance > 0 && <span>📏{s.distance}km</span>}
                  {s.caloriesBurned > 0 && <span>🔥{s.caloriesBurned}</span>}
                  {s.steps > 0 && <span>👣{(s.steps).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentSessions.length === 0 && !todaySession && (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
          <div className="text-4xl mb-2">🏃</div>
          <div className="text-gray-500 text-sm font-medium">No cardio logged yet</div>
          <div className="text-gray-400 text-xs mt-1">Log your first session above</div>
        </div>
      )}
    </div>
  )
}

// ─── Relapse / Rejuvenated Calendar ──────────────────────────────────────────
const RELAPSE_KEY = 'relapseLog_v1'

function loadRelapseLog() {
  try { return JSON.parse(localStorage.getItem(RELAPSE_KEY) || '{}') } catch { return {} }
}

function RelapseCalendar() {
  const [log, setLog]       = useState(loadRelapseLog)
  const [picker, setPicker] = useState(null)  // date string being picked

  const today = todayIST()
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(today)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  function mark(date, state) {
    const updated = { ...log }
    if (state === null) delete updated[date]
    else updated[date] = state
    setLog(updated)
    localStorage.setItem(RELAPSE_KEY, JSON.stringify(updated))
    setPicker(null)
  }

  function prevMonth() {
    setViewDate(v => {
      const m = v.month === 0 ? 11 : v.month - 1
      const y = v.month === 0 ? v.year - 1 : v.year
      return { year: y, month: m }
    })
  }
  function nextMonth() {
    setViewDate(v => {
      const m = v.month === 11 ? 0 : v.month + 1
      const y = v.month === 11 ? v.year + 1 : v.year
      return { year: y, month: m }
    })
  }

  const { year, month } = viewDate
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const relapseCount     = Object.values(log).filter(v => v === 'relapsed').length
  const rejuvenatedCount = Object.values(log).filter(v => v === 'rejuvenated').length
  const streak = (() => {
    let s = 0, d = new Date(today)
    while (true) {
      const k = d.toISOString().split('T')[0]
      if (log[k] === 'rejuvenated') { s++; d.setDate(d.getDate() - 1) }
      else break
    }
    return s
  })()

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
          <div className="text-2xl font-black text-emerald-600">{rejuvenatedCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Rejuvenated 💚</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center">
          <div className="text-2xl font-black text-red-500">{relapseCount}</div>
          <div className="text-xs text-gray-500 mt-0.5">Relapsed 🔴</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-center">
          <div className="text-2xl font-black text-indigo-600">{streak}</div>
          <div className="text-xs text-gray-500 mt-0.5">Day streak 🔥</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 text-lg">‹</button>
          <span className="text-sm font-bold text-gray-700">{monthName}</span>
          <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 text-lg">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-300 py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMon }).map((_, i) => {
            const day  = i + 1
            const date = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const state   = log[date]
            const isToday = date === today
            const isFuture = date > today

            return (
              <button key={day} disabled={isFuture}
                onClick={() => !isFuture && setPicker(date)}
                className={`aspect-square rounded-xl mx-0.5 flex items-center justify-center text-xs font-bold transition-all
                  ${isFuture ? 'opacity-20 cursor-default' : 'hover:opacity-80 cursor-pointer'}
                  ${state === 'relapsed'    ? 'bg-red-500 text-white'     :
                    state === 'rejuvenated' ? 'bg-emerald-500 text-white' :
                    isToday                 ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400' :
                                              'text-gray-500 hover:bg-gray-50'}
                `}>
                {day}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Rejuvenated</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Relapsed</div>
          <div className="ml-auto">tap a day to mark</div>
        </div>
      </div>

      {/* Picker sheet */}
      {picker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setPicker(null)}>
          <div className="bg-white rounded-t-3xl w-full p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="text-center text-xs text-gray-400 mb-1">Mark day</div>
            <div className="text-center font-bold text-gray-700 mb-5">{picker}</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button onClick={() => mark(picker, 'relapsed')}
                className="bg-red-500 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-red-600 transition-colors">
                🔴 Relapsed
              </button>
              <button onClick={() => mark(picker, 'rejuvenated')}
                className="bg-emerald-500 text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-emerald-600 transition-colors">
                💚 Rejuvenated
              </button>
            </div>
            {log[picker] && (
              <button onClick={() => mark(picker, null)}
                className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
                Clear mark
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Fitness({ logs, levels }) {
  const [tab, setTab] = useState('plan')

  return (
    <div className="space-y-4 fade-up">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[['plan','📅'],['levels','🏋️'],['weight','⚖️'],['body','📸'],['screen','📱'],['cardio','🏃'],['relapse','🔴']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-1.5 text-sm rounded-lg transition-all ${
              tab === id ? 'bg-white text-indigo-600 shadow-sm font-medium' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'plan' && <WeeklyPlan levels={levels} logs={logs} />}

      {tab === 'levels' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold mb-3">Exercise Progress</h3>
          <LevelsTable levels={levels} />
        </div>
      )}

      {tab === 'weight' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-gray-700 font-semibold">Weight Trend</div>
              <div className="text-gray-400 text-xs mt-0.5">Start: 91 kg → Target: 80 kg @ 14% BF</div>
            </div>
            {logs.find(l => l.weight) && (
              <div className="text-right">
                <div className="text-indigo-600 font-bold">{logs.find(l=>l.weight)?.weight} kg</div>
                <div className="text-xs text-gray-400">current</div>
              </div>
            )}
          </div>
          <WeightChart logs={logs} />
        </div>
      )}

      {tab === 'body' && <BodyProgress />}

      {tab === 'screen' && <ScreenTime logs={logs} />}

      {tab === 'cardio' && <CardioSection />}

      {tab === 'relapse' && <RelapseCalendar />}
    </div>
  )
}
