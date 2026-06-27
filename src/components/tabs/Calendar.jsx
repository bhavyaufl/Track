import { useState, useEffect, useRef } from 'react'
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

// ─── Day Preview Popover ───────────────────────────────────────────────────────

function DayPopover({ date, log, cellRef, onClose }) {
  const [photo, setPhoto] = useState(null)
  const popRef = useRef(null)

  useEffect(() => {
    supabase.from('progress_photos').select('photo_thumb').eq('date', date).single()
      .then(({ data }) => setPhoto(data))
  }, [date])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (popRef.current && !popRef.current.contains(e.target) &&
          cellRef.current && !cellRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler) }
  }, [onClose, cellRef])

  const macros  = log?.macros   || { p: 0, c: 0, f: 0 }
  const cal     = log?.calories || 0
  const steps   = log?.steps    || 0
  const weight  = log?.weight
  const spent   = (log?.spending || []).reduce((s, e) => s + e.amount, 0)
  const score   = log?.daily_score || 0
  const exs     = log?.exercises || []
  const screenTime = log?.screen_time || 0

  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b'

  const d = new Date(date + 'T00:00:00')
  const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  if (!log) return (
    <div ref={popRef} className="absolute z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-56"
      style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }}>
      <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
      <div className="text-gray-400 text-xs">No log for this day</div>
    </div>
  )

  return (
    <div ref={popRef} className="absolute z-30 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-64"
      style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }}>

      {/* Photo strip */}
      {photo?.photo_thumb && (
        <img src={`data:image/jpeg;base64,${photo.photo_thumb}`} alt="progress"
          className="w-full h-28 object-cover" />
      )}

      <div className="p-3 space-y-2.5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-700">{label}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: scoreColor }}>{score}/100</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <Stat emoji="🔥" label="Calories" value={`${fmt(cal)} kcal`} hit={cal >= GOALS.calories.target} />
          <Stat emoji="💪" label="Protein"  value={`${macros.p}g`}     hit={macros.p >= GOALS.protein} />
          <Stat emoji="👣" label="Steps"    value={fmt(steps)}          hit={steps >= GOALS.steps} />
          <Stat emoji="💰" label="Spent"    value={`₹${fmt(spent)}`}    hit={spent <= GOALS.dailyBudget} />
          {weight && <Stat emoji="⚖️" label="Weight" value={`${weight} kg`} hit={false} />}
          {screenTime > 0 && (
            <Stat emoji="📱" label="Screen"
              value={`${Math.floor(screenTime/60)}h ${screenTime%60}m`}
              hit={screenTime <= 180} />
          )}
        </div>

        {/* Exercises */}
        {exs.length > 0 && (
          <div className="border-t border-gray-50 pt-2">
            <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
              💪 <span>{log.muscles?.join(', ') || 'Workout'}</span>
            </div>
            {exs.slice(0, 3).map((ex, i) => (
              <div key={i} className="text-xs text-gray-600 truncate">{ex.name} · {ex.weight}{ex.unit}</div>
            ))}
            {exs.length > 3 && <div className="text-xs text-gray-400">+{exs.length - 3} more</div>}
          </div>
        )}

        {/* Meals */}
        {(['breakfast','lunch','dinner','snacks'].some(k => log[k])) && (
          <div className="border-t border-gray-50 pt-2 space-y-0.5">
            {[['breakfast','🌅'],['lunch','☀️'],['dinner','🌙'],['snacks','🍿']].map(([key, icon]) =>
              log[key] ? (
                <div key={key} className="flex gap-1.5 text-xs">
                  <span>{icon}</span>
                  <span className="text-gray-500 truncate">{log[key]}</span>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ emoji, label, value, hit }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${hit ? 'bg-emerald-50' : 'bg-gray-50'}`}>
      <div className="text-gray-400">{emoji} {label}</div>
      <div className={`font-semibold ${hit ? 'text-emerald-600' : 'text-gray-700'}`}>{value}</div>
    </div>
  )
}

// ─── Day Cell ──────────────────────────────────────────────────────────────────

function DayCell({ day, selected, onSelect }) {
  const cellRef = useRef(null)
  const s = getDayStyle(day.log, day.inRange, day.isFuture)
  const clickable = day.inRange && !day.isFuture
  const isSelected = selected?.date === day.date

  return (
    <div ref={cellRef} className="relative">
      <button
        onClick={() => clickable && onSelect(day, cellRef)}
        disabled={!clickable}
        className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative transition-transform
          ${clickable ? 'active:scale-90 cursor-pointer' : 'cursor-default'}
          ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
        style={{
          background: s.bg,
          border: day.isToday ? '2px solid #6366f1' : s.border || 'none',
        }}>
        {day.inRange && <span className={s.text}>{day.day}</span>}
        {day.inRange && !day.isFuture && day.log?.exercises?.length > 0 && (
          <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
        )}
      </button>
      {isSelected && (
        <DayPopover date={day.date} log={day.log} cellRef={cellRef}
          onClose={() => onSelect(null)} />
      )}
    </div>
  )
}

// ─── Main Calendar ─────────────────────────────────────────────────────────────

export default function Calendar({ logs }) {
  const start = new Date(GOALS.startDate)
  const end   = new Date(GOALS.endDate)
  const today = new Date(); today.setHours(0,0,0,0)

  // Start on the tracker's start month
  const [monthOffset, setMonthOffset] = useState(0)
  const [selected, setSelected] = useState(null)
  const [selectedRef, setSelectedRef] = useState(null)

  const logMap = {}
  logs.forEach(l => { logMap[l.date] = l })

  // Current month being viewed
  const viewDate = new Date(start.getFullYear(), start.getMonth() + monthOffset, 1)
  const viewYear  = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  // Clamp navigation
  const minMonth = 0 // start month
  const maxMonth = Math.ceil((end - start) / (30 * 86400000)) + 1
  const canPrev = monthOffset > 0
  const canNext = monthOffset < maxMonth

  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  // Build weeks for this month
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay  = new Date(viewYear, viewMonth + 1, 0)
  const startSun = new Date(firstDay)
  startSun.setDate(startSun.getDate() - startSun.getDay())

  const weeks = []
  let cur = new Date(startSun)
  while (cur <= lastDay || cur.getDay() !== 0) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split('T')[0]
      const inMonth = cur.getMonth() === viewMonth
      week.push({
        date: dateStr,
        inRange: cur >= start && cur <= end && inMonth,
        isFuture: cur > today,
        log: logMap[dateStr] || null,
        day: cur.getDate(),
        isToday: cur.getTime() === today.getTime(),
        inMonth,
      })
      cur = new Date(cur); cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (weeks.length > 6) break
  }

  // Stats for the viewed month
  const monthLogs = logs.filter(l => {
    const d = new Date(l.date)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  })
  const daysInRange = (() => {
    let count = 0
    for (let d = new Date(Math.max(firstDay, start)); d <= Math.min(lastDay, end, today); d.setDate(d.getDate() + 1)) count++
    return count
  })()
  const consistency = daysInRange > 0 ? Math.round((monthLogs.length / daysInRange) * 100) : 0

  // Overall stats
  const daysLogged  = logs.length
  const daysElapsed = Math.floor((today - start) / 86400000) + 1
  const daysLeft    = Math.max(0, Math.floor((end - today) / 86400000))
  const totalConsistency = daysElapsed > 0 ? Math.round((daysLogged / daysElapsed) * 100) : 0

  function handleSelect(day, ref) {
    if (!day) { setSelected(null); setSelectedRef(null); return }
    if (selected?.date === day.date) { setSelected(null); setSelectedRef(null); return }
    setSelected(day)
    setSelectedRef(ref)
  }

  return (
    <div className="space-y-4 fade-up">
      {/* Overall stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { val: daysLogged,         label: 'Logged',      color: 'text-indigo-600',  bg: 'bg-indigo-50' },
          { val: daysElapsed,        label: 'Elapsed',     color: 'text-gray-700',    bg: 'bg-gray-100' },
          { val: daysLeft,           label: 'Remaining',   color: 'text-amber-600',   bg: 'bg-amber-50' },
          { val: `${totalConsistency}%`, label: 'Overall', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setMonthOffset(o => o - 1); setSelected(null) }}
            disabled={!canPrev}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors text-lg">
            ‹
          </button>
          <div className="text-center">
            <div className="text-gray-800 font-bold text-sm">{monthLabel}</div>
            <div className="text-gray-400 text-xs">{monthLogs.length}/{daysInRange} days logged · {consistency}%</div>
          </div>
          <button onClick={() => { setMonthOffset(o => o + 1); setSelected(null) }}
            disabled={!canNext}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors text-lg">
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="text-center text-gray-300 text-xs font-medium">{d}</div>
          ))}
        </div>

        {/* Weeks */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map(day => (
                <DayCell key={day.date} day={day} selected={selected} onSelect={handleSelect} />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {[
            { color: '#d1fae5', border: '#a7f3d0', label: '80+' },
            { color: '#eef2ff', border: '#c7d2fe', label: '50–79' },
            { color: '#fef9c3', border: '#fde68a', label: 'Logged' },
            { color: '#fef2f2', border: '#fee2e2', label: 'Missed' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: l.color, border: `1px solid ${l.border}` }} />
              <span className="text-gray-400 text-xs">{l.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-gray-400 text-xs">Gym</span>
          </div>
        </div>
      </div>
    </div>
  )
}
