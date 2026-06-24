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
  { id: 'today',    label: '🏠', full: 'Today' },
  { id: 'fitness',  label: '💪', full: 'Fitness' },
  { id: 'calories', label: '🔥', full: 'Calories' },
  { id: 'finance',  label: '💰', full: 'Finance' },
  { id: 'power',    label: '🏆', full: 'Power' },
  { id: 'calendar', label: '📅', full: 'Calendar' },
  { id: 'history',  label: '📋', full: 'History' },
]

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center space-y-3">
        <div className="text-5xl animate-pulse">⚡</div>
        <div className="text-gray-400 text-sm">Loading your tracker…</div>
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

  if (logsLoading || levelsLoading || todayLoading) return <LoadingScreen />

  const totalXP = logs.reduce((sum, l) => sum + (l.xp_earned || 0), 0)
  const latestWeight = logs.find(l => l.weight)?.weight
  const daysLeft = Math.max(0, Math.floor((new Date('2026-08-09') - new Date()) / 86400000))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">Bhavya's Tracker</h1>
            <div className="text-xs text-gray-400">{daysLeft} days to Aug 9</div>
          </div>
          <div className="flex items-center gap-3">
            {latestWeight && (
              <div className="text-right">
                <div className="text-xs text-gray-400">Weight</div>
                <div className="text-sm font-bold text-gray-700">{latestWeight} kg</div>
              </div>
            )}
            <div className="bg-indigo-50 rounded-xl px-3 py-1.5 text-center">
              <div className="text-xs text-indigo-400">XP</div>
              <div className="text-sm font-black text-indigo-600">⚡{totalXP.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 sticky top-[57px] z-10">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors border-b-2',
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              )}>
              <span className="text-base">{tab.label}</span>
              <span className="text-xs mt-0.5 hidden sm:block">{tab.full}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Setup banner */}
      {!isConfigured && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            ⚠️ Add your Supabase keys to <code className="bg-amber-100 px-1 rounded">.env.local</code> then restart.
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 pb-10">
        {activeTab === 'today'    && <Today log={todayLog} />}
        {activeTab === 'fitness'  && <Fitness logs={logs} levels={levels} />}
        {activeTab === 'calories' && <Calories todayLog={todayLog} logs={logs} />}
        {activeTab === 'finance'  && <Finance logs={logs} />}
        {activeTab === 'power'    && <PowerLevel logs={logs} badges={badges} levels={levels} />}
        {activeTab === 'calendar' && <Calendar logs={logs} />}
        {activeTab === 'history'  && <History logs={logs} />}
      </div>
    </div>
  )
}
