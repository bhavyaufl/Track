import { useState, useEffect } from 'react'
import { supabase, isConfigured } from './supabase'

function noopQuery() {
  return Promise.resolve({ data: null })
}

function safeQuery(fn) {
  if (!isConfigured) return noopQuery()
  return fn()
}

export function useLogs(limit = 90, refreshKey = 0) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    safeQuery(() =>
      supabase.from('daily_logs').select('*').order('date', { ascending: false }).limit(limit)
    ).then(({ data }) => {
      setLogs(data || [])
      setLoading(false)
    })
  }, [limit, refreshKey])

  return { logs, loading }
}

export function useExerciseLevels() {
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    safeQuery(() =>
      supabase.from('exercise_levels').select('*').order('exercise_name')
    ).then(({ data }) => {
      setLevels(data || [])
      setLoading(false)
    })
  }, [])

  return { levels, loading }
}

export function useExerciseHistory(exerciseName) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!exerciseName) return
    safeQuery(() =>
      supabase.from('exercise_history').select('*')
        .eq('exercise_name', exerciseName)
        .order('date', { ascending: false })
        .limit(30)
    ).then(({ data }) => setHistory(data || []))
  }, [exerciseName])

  return history
}

export function useAchievements() {
  const [badges, setBadges] = useState([])

  useEffect(() => {
    safeQuery(() =>
      supabase.from('achievements').select('*')
    ).then(({ data }) => setBadges(data || []))
  }, [])

  return badges
}

export function useTodayLog(refreshKey = 0) {
  const today = new Date().toISOString().split('T')[0]
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    safeQuery(() =>
      supabase.from('daily_logs').select('*').eq('date', today).single()
    ).then(({ data }) => {
      setLog(data)
      setLoading(false)
    })
  }, [today, refreshKey])

  return { log, loading }
}
