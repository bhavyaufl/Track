import { useState, useRef, useEffect } from 'react'

const QUICK_CHIPS = [
  { label: '🍽️ Meal', fill: 'meal ' },
  { label: '💪 Workout', fill: 'did ' },
  { label: '👣 Steps', fill: 'did  steps today' },
  { label: '💰 Spent', fill: 'spent ₹ on ' },
  { label: '⚖️ Weight', fill: 'weight is  kg' },
  { label: '📱 Screen', fill: ' hours screen time' },
]

function Bubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} fade-up`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5">🤖</div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-sm'
          : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-bl-sm'
      }`}>
        {text}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0 mr-2">🤖</div>
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce"
              style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Log() {
  const today = new Date().toISOString().split('T')[0]
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: `Hey! Tell me anything about today and I'll log it instantly.\n\nTry: "had chicken salad for lunch, 449 cal" or "did chest — bench press 50kg 3×10, spent ₹290" or "7500 steps today".`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, date: today }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.message || 'Done!' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Network error. Check your connection and try again.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleChip(fill) {
    setInput(fill)
    inputRef.current?.focus()
    // Position cursor in middle of template if there's a gap
    setTimeout(() => {
      const idx = fill.indexOf('  ')
      if (idx !== -1) inputRef.current?.setSelectionRange(idx + 1, idx + 1)
    }, 10)
  }

  return (
    <div className="flex flex-col fade-up" style={{ height: 'calc(100dvh - 128px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-gray-800 font-bold">Quick Log</h2>
          <div className="text-gray-400 text-xs">{today}</div>
        </div>
        <div className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full">
          Powered by Claude
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
        {loading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      <div className="flex gap-2 overflow-x-auto py-2 shrink-0" style={{ scrollbarWidth: 'none' }}>
        {QUICK_CHIPS.map(c => (
          <button key={c.label} onClick={() => handleChip(c.fill)}
            className="shrink-0 bg-white border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors whitespace-nowrap shadow-sm">
            {c.label}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2 shrink-0 pb-1">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="had a protein shake, did 8000 steps..."
          className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-indigo-400 shadow-sm"
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="bg-indigo-600 text-white rounded-2xl px-4 py-3 font-semibold disabled:opacity-40 hover:bg-indigo-700 active:scale-95 transition-all shrink-0 text-sm">
          {loading ? '...' : '↑'}
        </button>
      </div>
    </div>
  )
}
