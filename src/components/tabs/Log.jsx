import { useState, useRef, useEffect } from 'react'

async function resizeImageToBase64(file) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result.split(',')[1])
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.82)
    }
    img.src = url
  })
}

const QUICK_CHIPS = [
  { label: '🍽️ Meal', fill: 'meal ' },
  { label: '💪 Workout', fill: 'did ' },
  { label: '👣 Steps', fill: 'did  steps today' },
  { label: '💰 Spent', fill: 'spent ₹ on ' },
  { label: '⚖️ Weight', fill: 'weight is  kg' },
  { label: '📱 Screen', fill: ' hours screen time' },
]

function Bubble({ role, text, image }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} fade-up`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5">🤖</div>
      )}
      <div className={`max-w-[82%] rounded-2xl overflow-hidden text-sm leading-relaxed ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-sm'
          : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-bl-sm'
      }`}>
        {image && <img src={image} alt="food" className="w-full max-h-48 object-cover" />}
        {text && <div className="px-4 py-2.5">{text}</div>}
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

export default function Log({ onLogged }) {
  const today = new Date().toISOString().split('T')[0]
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: `Hey! Tell me anything about today and I'll log it instantly.\n\nTry: "had chicken salad for lunch, 449 cal" or "did chest — bench press 50kg 3×10, spent ₹290" or "7500 steps today".`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageB64, setImageB64] = useState(null)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Voice input not supported on this browser. Try Chrome on Android or Safari on iPhone.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new SR()
    recognitionRef.current = rec
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = e => {
      const transcript = e.results[0][0].transcript
      setInput(prev => (prev ? prev + ' ' + transcript : transcript))
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
    setListening(true)
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    const b64 = await resizeImageToBase64(file)
    setImageB64(b64)
    e.target.value = ''
  }

  function clearImage() {
    setImagePreview(null)
    setImageB64(null)
  }

  async function send(text) {
    const msg = (text || input).trim()
    if ((!msg && !imageB64) || loading) return
    const sentImage = imagePreview
    setInput('')
    setImagePreview(null)
    setImageB64(null)
    setMessages(prev => [...prev, { role: 'user', text: msg || '📷 Photo', image: sentImage }])
    setLoading(true)

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg || 'What food is in this image? Estimate the macros and log it.', date: today, image: imageB64 }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', text: data.message || 'Done!' }])
      if (!data.message?.startsWith('⚠️')) onLogged?.()
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

      {/* Image preview */}
      {imagePreview && (
        <div className="relative w-20 h-20 shrink-0 mb-1">
          <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-xl border border-gray-200" />
          <button onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 text-white rounded-full text-xs flex items-center justify-center leading-none">
            ×
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 shrink-0 pb-1">
        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handleImagePick} />

        {/* Camera button */}
        <button onClick={() => fileRef.current?.click()}
          className="bg-white border border-gray-200 text-gray-500 rounded-2xl px-3 py-3 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm shrink-0 text-lg"
          title="Take photo or upload image">
          📷
        </button>

        {/* Mic button */}
        <button onClick={toggleVoice}
          className={`rounded-2xl px-3 py-3 shadow-sm shrink-0 text-lg transition-all ${
            listening
              ? 'bg-red-500 text-white border border-red-400 animate-pulse'
              : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
          }`}
          title={listening ? 'Stop listening' : 'Voice input'}>
          🎤
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={imageB64 ? 'Add a note (optional)…' : 'had a protein shake, did 8000 steps…'}
          className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-indigo-400 shadow-sm"
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={(!input.trim() && !imageB64) || loading}
          className="bg-indigo-600 text-white rounded-2xl px-4 py-3 font-semibold disabled:opacity-40 hover:bg-indigo-700 active:scale-95 transition-all shrink-0 text-sm">
          {loading ? '…' : '↑'}
        </button>
      </div>
    </div>
  )
}
