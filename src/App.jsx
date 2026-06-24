import { useState } from 'react'
import { useLogs, useExerciseLevels, useAchievements, useTodayLog } from './lib/hooks'
import { isConfigured } from './lib/supabase'
import Today from './components/tabs/Today'
import Fitness from './components/tabs/Fitness'
import Calories from './components/tabs/Calories'
import Finance from './components/tabs/Finance'
import PowerLevel from './components/tabs/PowerLevel'
import Calendar from './components/tabs/Calendar'
import History from './components/tabs/History'
import clsx from 'clsx'

const TABS = [
  { id: 'today', label: '🏠 Today' },
  { id: 'fitness', label: '💪 Fitness' },
  { id: 'calories', label: '🔥 Calories' },
  { id: 'finance', label: '💰 Finance' },
  { id: 'power', label: '🏆 Power Level' },
  { id: 'calendar', label: '📅 Calendar' },
  { id: 'history', label: '📋 History' },
]

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <div className="text-5xl animate-pulse">⚡</div>
        <div className="text-slate-400">Loading your tracker…</div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('today')
  const { logs, loading: logsLoading } = useLogs(90)
  const { levels, loading: levelsLoading } = useExerciseLevels()
  const badges = useAchievements()
  const { log: todayLog, loading: todayLoading } = useTodayLog()

  const loading = logsLoading || levelsLoading || todayLoading

  if (loading) return <LoadingScreen />

  const totalXP = logs.reduce((sum, l) => sum + (l.xp_earned || 0), 0)
  const latestWeight = logs.find(l => l.weight)?.weight

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-slate-800/80 border-b border-slate-700/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Bhavya's Tracker</h1>
            <div className="text-xs text-slate-400">Jun 8 → Aug 9, 2026</div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 text-sm font-bold">⚡ {totalXP.toLocaleString()} XP</div>
            {latestWeight && (
              <div className="text-slate-400 text-xs">{latestWeight} kg</div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-slate-800/50 border-b border-slate-700/30 sticky top-[57px] z-10 overflow-x-auto">
        <div className="max-w-2xl mx-auto px-2 flex gap-0.5 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-3 py-2.5 text-xs whitespace-nowrap font-medium transition-all border-b-2',
                activeTab === tab.id
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Setup banner */}
      {!isConfigured && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-yellow-900/40 border border-yellow-700/50 rounded-xl px-4 py-3 text-sm text-yellow-300">
            ⚠️ <strong>Supabase not connected.</strong> Add your project URL and anon key to{' '}
            <code className="text-yellow-200 bg-yellow-900/50 px-1 rounded">.env.local</code>{' '}
            then restart the dev server. Showing empty state.
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {activeTab === 'today' && <Today log={todayLog} />}
        {activeTab === 'fitness' && <Fitness logs={logs} levels={levels} />}
        {activeTab === 'calories' && <Calories todayLog={todayLog} logs={logs} />}
        {activeTab === 'finance' && <Finance logs={logs} />}
        {activeTab === 'power' && <PowerLevel logs={logs} badges={badges} />}
        {activeTab === 'calendar' && <Calendar logs={logs} />}
        {activeTab === 'history' && <History logs={logs} />}
      </div>
    </div>
  )
}
