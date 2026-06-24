import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GOALS } from '../../lib/constants'

function LevelBadge({ level }) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#06b6d4']
  const color = colors[Math.min(level - 1, colors.length - 1)]
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + '33', color }}>
      Lv.{level}
    </span>
  )
}

function LevelTable({ levels }) {
  if (!levels.length) return (
    <div className="text-slate-500 text-sm text-center py-8">No exercise data yet.</div>
  )

  const groups = {
    'Push': ['Bench Press','Incline Bench Press','Shoulder Press','Lateral Raises','Tricep Pushdowns','Cable Chest Flies'],
    'Pull': ['Deadlift','Pull-ups','Lat Pulldown','Back Rows','Bicep Curls'],
    'Legs': ['Squats','Leg Press','Leg Curl','Calf Raises'],
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([group, exercises]) => {
        const groupLevels = levels.filter(l => exercises.includes(l.exercise_name))
        if (!groupLevels.length) return null
        return (
          <div key={group}>
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">{group}</div>
            <div className="space-y-1">
              {groupLevels.map(l => {
                const lastSets = l.last_sets || []
                const allMaxReps = lastSets.every(s => s >= 12)
                return (
                  <div key={l.exercise_name} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 text-sm">{l.exercise_name}</span>
                      {allMaxReps && lastSets.length >= 3 && (
                        <span className="text-yellow-400 text-xs">⬆️ ready</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">{l.current_weight} {l.unit}</span>
                      <LevelBadge level={l.current_level || 1} />
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

function WeightChart({ logs }) {
  const data = logs
    .filter(l => l.weight)
    .slice(0, 30)
    .reverse()
    .map(l => ({ date: l.date?.slice(5), weight: Number(l.weight) }))

  if (!data.length) return <div className="text-slate-500 text-sm text-center py-8">No weight data yet.</div>

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11 }} domain={['dataMin - 1', 'dataMax + 1']} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8' }}
        />
        <Line dataKey="weight" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }}
          name="Weight (kg)" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function WorkoutHistory({ logs }) {
  const workoutLogs = logs.filter(l => l.exercises?.length || l.cardio_type).slice(0, 14)
  if (!workoutLogs.length) return <div className="text-slate-500 text-sm text-center py-4">No workouts yet.</div>

  return (
    <div className="space-y-2">
      {workoutLogs.map(l => (
        <div key={l.date} className="bg-slate-800/60 rounded-lg px-3 py-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm font-medium">{l.date}</span>
            <span className="text-slate-500 text-xs">{l.muscles?.join(', ') || l.cardio_type}</span>
          </div>
          {l.exercises?.slice(0, 3).map((ex, i) => (
            <div key={i} className="text-slate-500 text-xs mt-0.5">
              {ex.name} {ex.weight}kg — {ex.sets?.join('/')} reps
            </div>
          ))}
          {l.cardio_type && (
            <div className="text-slate-500 text-xs mt-0.5">
              {l.cardio_type} · {l.cardio_duration} min
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Fitness({ logs, levels }) {
  const [tab, setTab] = useState('levels')

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {['levels', 'weight', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
              tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}>
            {t === 'levels' ? '🏋️ Levels' : t === 'weight' ? '⚖️ Weight' : '📋 History'}
          </button>
        ))}
      </div>

      {tab === 'levels' && (
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
          <h3 className="text-slate-300 font-semibold mb-3">Exercise Levels</h3>
          <LevelTable levels={levels} />
        </div>
      )}

      {tab === 'weight' && (
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
          <h3 className="text-slate-300 font-semibold mb-1">Weight Trend</h3>
          <div className="flex gap-4 text-sm mb-4">
            <span className="text-slate-500">Start: {GOALS.startWeight} kg</span>
            <span className="text-slate-500">Target: {GOALS.weightTarget} kg</span>
            {logs.find(l => l.weight) && (
              <span className="text-emerald-400">
                Current: {logs.find(l => l.weight)?.weight} kg
              </span>
            )}
          </div>
          <WeightChart logs={logs} />
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
          <h3 className="text-slate-300 font-semibold mb-3">Workout History</h3>
          <WorkoutHistory logs={logs} />
        </div>
      )}
    </div>
  )
}
