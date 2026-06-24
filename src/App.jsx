import { useState } from 'react'
import { useLogs, useExerciseLevels, useAchievements, useTodayLog } from './lib/hooks'
import { isConfigured } from './lib/supabase'
import Dashboard from './components/tabs/Dashboard'
import Today from './components/tabs/Today'
import Fitness from './components/tabs/Fitness'
import Calories from './components/tabs/Calories'
import Finance from './components/tabs/Finance'
import PowerLevel from './components/tabs/PowerLevel'
import Calendar from './components/tabs/Calendar'
import History from './components/tabs/History'
import clsx from 'clsx'

const TABS = [
  { id: 'dashboard', emoji: '🏠', label: 'Dashboard' },
  { id: 'today',     emoji: '📊', label: 'Today' },
  { id: 'fitness',   emoji: '💪', label: 'Fitness' },
  { id: 'calories',  emoji: '🔥', label: 'Calories' },
  { id: 'finance',   emoji: '💰', label: 'Finance' },
  { id: 'power',     emoji: '🏆', label: 'Power' },
  { id: 'calendar',  emoji: '📅', label: 'Calendar' },
  { id: 'history',   emoji: '📋', label: 'History' },
]

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl mx-auto animate-pulse">⚡</div>
        <div className="text-gray-400 text-sm">Loading your tracker…</div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { logs, loading: logsLoading } = useLogs(90)
  const { levels, loading: levelsLoading } = useExerciseLevels()
  const badges = useAchievements()
  const { log: todayLog, loading: todayLoading } = useTodayLog()

  if (logsLoading || levelsLoading || todayLoading) return <LoadingScreen />

  const totalXP = logs.reduce((sum, l) => sum + (l.xp_earned || 0), 0)
  const daysLeft = Math.max(0, Math.floor((new Date('2026-08-09') - new Date()) / 86400000))
  const todayScore = todayLog?.daily_score || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">B</div>
            <div>
              <div className="text-gray-900 font-bold text-sm leading-none">Bhavya's Tracker</div>
              <div className="text-gray-400 text-xs">{daysLeft} days to Aug 9</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {todayScore > 0 && (
              <div className="bg-gray-100 rounded-xl px-2.5 py-1.5 text-center">
                <div className="text-xs font-bold text-gray-600">{todayScore}/100</div>
                <div className="text-gray-400 text-xs leading-none">today</div>
              </div>
            )}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl px-2.5 py-1.5 text-center">
              <div className="text-xs font-black text-white">⚡{totalXP.toLocaleString()}</div>
              <div className="text-white/60 text-xs leading-none">XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar — scrollable */}
      <div className="bg-white border-b border-gray-100 sticky top-[57px] z-10 overflow-x-auto">
        <div className="max-w-2xl mx-auto flex min-w-max px-2">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2',
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-500'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              )}>
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {!isConfigured && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            ⚠️ Add Supabase keys to <code className="bg-amber-100 px-1 rounded">.env.local</code> then restart.
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5 pb-12">
        {activeTab === 'dashboard' && <Dashboard logs={logs} levels={levels} badges={badges} todayLog={todayLog} />}
        {activeTab === 'today'     && <Today log={todayLog} />}
        {activeTab === 'fitness'   && <Fitness logs={logs} levels={levels} />}
        {activeTab === 'calories'  && <Calories todayLog={todayLog} logs={logs} />}
        {activeTab === 'finance'   && <Finance logs={logs} />}
        {activeTab === 'power'     && <PowerLevel logs={logs} badges={badges} levels={levels} />}
        {activeTab === 'calendar'  && <Calendar logs={logs} />}
        {activeTab === 'history'   && <History logs={logs} />}
      </div>
    </div>
  )
}
