import { useState, useEffect } from 'react'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}
import { useLogs, useExerciseLevels, useAchievements, useTodayLog } from './lib/hooks'
import { isConfigured } from './lib/supabase'
import Dashboard from './components/tabs/Dashboard'
import Today from './components/tabs/Today'
import Fitness from './components/tabs/Fitness'
import Calories from './components/tabs/Calories'
import Finance from './components/tabs/Finance'
import Calendar from './components/tabs/Calendar'
import History from './components/tabs/History'
import Log from './components/tabs/Log'
import clsx from 'clsx'

const TABS = [
  { id: 'log',       emoji: '💬', label: 'Log' },
  { id: 'dashboard', emoji: '🏠', label: 'Dashboard' },
  { id: 'today',     emoji: '📊', label: 'Today' },
  { id: 'fitness',   emoji: '💪', label: 'Fitness' },
  { id: 'calories',  emoji: '🔥', label: 'Calories' },
  { id: 'finance',   emoji: '💰', label: 'Finance' },
  { id: 'calendar',  emoji: '📅', label: 'Calendar' },
  { id: 'history',   emoji: '📋', label: 'History' },
]

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-indigo-200"
          style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>⚡</div>
        <div className="text-gray-400 text-sm font-medium">Loading your tracker…</div>
      </div>
    </div>
  )
}

export default function App() {
  const now = useClock()
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  const [activeTab, setActiveTab] = useState('log')
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)
  const { logs, loading: logsLoading } = useLogs(90, refreshKey)
  const { levels, loading: levelsLoading } = useExerciseLevels()
  const badges = useAchievements()
  const { log: todayLog, loading: todayLoading } = useTodayLog(refreshKey)

  if (logsLoading || levelsLoading || todayLoading) return <LoadingScreen />

  const totalXP = logs.reduce((sum, l) => sum + (l.xp_earned || 0), 0)
  const daysLeft = Math.max(0, Math.floor((new Date('2026-08-09') - new Date()) / 86400000))
  const todayScore = todayLog?.daily_score || 0
  const latestWeight = logs.find(l => l.weight)?.weight

  return (
    <div className="bg-gray-50" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="bg-white fixed top-0 left-0 right-0 z-20"
        style={{ boxShadow: '0 2px 0 #e2e8f0' }}>
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-md shadow-indigo-200"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>B</div>
            <div>
              <div className="text-gray-900 font-bold text-sm leading-tight">Bhavya's Tracker</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-gray-600 text-xs font-medium">{dateStr}</span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-indigo-500 text-xs font-semibold tabular-nums">{timeStr}</span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-gray-400 text-xs">{daysLeft}d left</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {latestWeight && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-1.5 text-center">
                <div className="text-xs font-bold text-gray-700">{latestWeight} kg</div>
                <div className="text-gray-400 text-xs leading-none">weight</div>
              </div>
            )}
            {todayScore > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-1.5 text-center">
                <div className="text-xs font-bold text-emerald-600">{todayScore}/100</div>
                <div className="text-gray-400 text-xs leading-none">today</div>
              </div>
            )}
            <div className="rounded-2xl px-3 py-1.5 text-center shadow-sm shadow-indigo-100"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <div className="text-xs font-black text-white">⚡ {totalXP.toLocaleString()}</div>
              <div className="text-white/60 text-xs leading-none">XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white fixed left-0 right-0 z-10 overflow-x-auto"
        style={{ top: '65px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div className="max-w-3xl mx-auto flex min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 relative',
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-500'
                  : 'text-gray-400 border-transparent hover:text-gray-700 hover:bg-gray-50'
              )}>
              <span className="text-base">{tab.emoji}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content — offset for fixed header (~61px) + tab bar (~49px) */}
      <div className="max-w-3xl mx-auto px-5 pb-16" style={{ paddingTop: '122px' }}>
        {!isConfigured && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700">
            ⚠️ Add Supabase keys to <code className="bg-amber-100 px-1 rounded">.env.local</code> then restart.
          </div>
        )}
        {activeTab === 'log'       && <Log onLogged={refresh} />}
        {activeTab === 'dashboard' && <Dashboard logs={logs} levels={levels} badges={badges} todayLog={todayLog} />}
        {activeTab === 'today'     && <Today log={todayLog} yesterdayLog={logs[0]} onRefresh={refresh} />}
        {activeTab === 'fitness'   && <Fitness logs={logs} levels={levels} />}
        {activeTab === 'calories'  && <Calories todayLog={todayLog} logs={logs} onRefresh={refresh} />}
        {activeTab === 'finance'   && <Finance logs={logs} />}
        {activeTab === 'calendar'  && <Calendar logs={logs} />}
        {activeTab === 'history'   && <History logs={logs} />}
      </div>
    </div>
  )
}
