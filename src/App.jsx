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
import Log from './components/tabs/Log'
import Food from './components/tabs/Food'
import { DarkContext } from './lib/DarkContext'
import { yesterdayIST } from './lib/dateIST'
import clsx from 'clsx'

const TABS = [
  { id: 'log',       emoji: '💬', label: 'Log'       },
  { id: 'dashboard', emoji: '🏠', label: 'Dashboard' },
  { id: 'today',     emoji: '📊', label: 'Today'     },
  { id: 'food',      emoji: '🥗', label: 'Food'      },
  { id: 'fitness',   emoji: '💪', label: 'Fitness'   },
  { id: 'calories',  emoji: '🔥', label: 'Calories'  },
  { id: 'finance',   emoji: '💰', label: 'Finance'   },
  { id: 'calendar',  emoji: '📅', label: 'Calendar'  },
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
  const yesterdayDate = yesterdayIST()
  const yesterdayLog  = logs.find(l => l.date === yesterdayDate) || null

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('darkMode', dark)
  }, [dark])

  if (logsLoading || levelsLoading || todayLoading) return <LoadingScreen />

  const totalXP = logs.reduce((sum, l) => sum + (l.xp_earned || 0), 0)
  const daysLeft = Math.max(0, Math.floor((new Date('2026-08-09') - new Date()) / 86400000))
  const todayScore = todayLog?.daily_score || 0
  const latestWeight = logs.find(l => l.weight)?.weight

  return (
    <DarkContext.Provider value={dark}>
    <div style={{ minHeight: '100dvh', background: 'var(--c-page)' }}>
      {/* ── Header ── fixed 52px */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center"
        style={{ height: 52, background: 'var(--c-header)', borderBottom: '1px solid var(--c-border)', boxShadow: '0 1px 8px var(--c-shadow)' }}>
        <div className="max-w-3xl mx-auto w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>B</div>
            <div className="leading-none">
              <div className="text-gray-800 font-bold text-sm">Bhavya's Tracker</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-gray-500 text-xs">{dateStr}</span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-indigo-500 text-xs font-semibold tabular-nums">{timeStr}</span>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-gray-400 text-xs">{daysLeft}d</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {latestWeight && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-2 py-1 leading-none text-center">
                <div className="text-xs font-bold text-gray-700">{latestWeight}<span className="font-normal text-gray-400">kg</span></div>
              </div>
            )}
            {todayScore > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-2 py-1 leading-none">
                <div className="text-xs font-bold text-emerald-600">{todayScore}<span className="font-normal text-emerald-400">/100</span></div>
              </div>
            )}
            <div className="rounded-xl px-2.5 py-1 leading-none"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <div className="text-xs font-bold text-white">⚡{totalXP.toLocaleString()}</div>
            </div>
            <button onClick={refresh}
              className="w-7 h-7 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100 text-sm transition-colors hover:bg-gray-100"
              title="Refresh data">
              🔄
            </button>
            <button onClick={() => setDark(d => !d)}
              className="w-7 h-7 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100 text-sm transition-colors hover:bg-gray-100"
              title="Toggle dark mode">
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab bar ── mobile: 2×4 grid 80px · desktop: single row 40px */}
      <nav className="fixed left-0 right-0 z-10 h-20 md:h-10"
        style={{ top: 52, background: 'var(--c-header)', borderBottom: '1px solid var(--c-border)', boxShadow: '0 2px 8px var(--c-shadow)' }}>

        {/* Mobile: two rows of 4 */}
        <div className="md:hidden flex flex-col h-full">
          {[TABS.slice(0, 4), TABS.slice(4)].map((row, ri) => (
            <div key={ri} className="flex flex-1"
              style={{ borderBottom: ri === 0 ? '1px solid var(--c-border)' : 'none' }}>
              {row.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors',
                    activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'
                  )}>
                  <span className="text-base leading-none">{tab.emoji}</span>
                  <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Desktop: single scrollable row */}
        <div className="hidden md:flex max-w-3xl mx-auto h-full overflow-x-auto">
          <div className="flex h-full min-w-max">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 h-full text-xs font-semibold whitespace-nowrap transition-colors relative',
                  activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                )}>
                <span className="text-sm">{tab.emoji}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Content — mobile: 52+80+8=140px · desktop: 52+40+8=100px ── */}
      <div className="max-w-3xl mx-auto px-4 pb-8 pt-[140px] md:pt-[100px]">
        {!isConfigured && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700">
            ⚠️ Add Supabase keys to <code className="bg-amber-100 px-1 rounded">.env.local</code> then restart.
          </div>
        )}
        {activeTab === 'log'       && <Log onLogged={refresh} />}
        {activeTab === 'food'      && <Food todayLog={todayLog} />}
        {activeTab === 'dashboard' && <Dashboard logs={logs} levels={levels} badges={badges} todayLog={todayLog} />}
        {activeTab === 'today'     && <Today log={todayLog} yesterdayLog={yesterdayLog} onRefresh={refresh} levels={levels} />}
        {activeTab === 'fitness'   && <Fitness logs={logs} levels={levels} />}
        {activeTab === 'calories'  && <Calories todayLog={todayLog} logs={logs} onRefresh={refresh} />}
        {activeTab === 'finance'   && <Finance logs={logs} />}
        {activeTab === 'calendar'  && <Calendar logs={logs} />}
      </div>
    </div>
    </DarkContext.Provider>
  )
}
