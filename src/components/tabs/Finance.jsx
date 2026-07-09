import { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTooltipStyle, useDark } from '../../lib/DarkContext'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOTAL_GOAL       = 400000
const N_MONTHS         = 12        // Jul 2026 → Jun 2027
const SPEND_CAP        = 25000     // variable spend cap
const VACATION_MONTHLY = 8000
const VACATION_TOTAL   = 80000
const PROJ_MONTHS      = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun']

const VACATIONS = [
  { name: 'Goa',         month: 'Aug', emoji: '🏖️', budget: 35000, desc: 'Aug trip' },
  { name: 'Lakshadweep', month: 'Dec', emoji: '🏝️', budget: 45000, desc: 'Dec trip' },
]
const FIXED_SUBS = [
  { name: 'Claude AI', amount: 2000 },
  { name: 'Netflix',   amount: 199  },
  { name: 'Spotify',   amount: 139  },
]
const FIXED_MONTHLY = FIXED_SUBS.reduce((s, x) => s + x.amount, 0)  // 2338

const DEFAULT_SALARY    = 64800
const DEFAULT_PORTFOLIO = [
  { platform: 'PhonePe MF', invested: 3000,  current: 3026,  color: '#6366f1', emoji: '📱' },
  { platform: 'Kite',       invested: 10266, current: 11995, color: '#f59e0b', emoji: '📈' },
]
const DEFAULT_NEEDS = [
  { label: 'Groceries',     amount: 7000, note: 'Home + office canteen' },
  { label: 'Fuel',          amount: 2000, note: 'Bike · commute + errands' },
  { label: 'Travel',        amount: 1500, note: 'Cab / auto / metro' },
  { label: 'Personal care', amount: 1500, note: 'Haircut, toiletries' },
  { label: 'Bills',         amount: 1000, note: 'Electricity, internet' },
]
const DEFAULT_WANTS = [
  { label: 'Dining / café',    amount: 5000, note: '~2–3 meals out/week' },
  { label: 'Activities',       amount: 3000, note: 'Movies, turf, events' },
  { label: 'Shopping / gifts', amount: 4000, note: 'Clothes, accessories, gifts' },
]

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadSalary()    { try { return Number(localStorage.getItem('monthlySalary_v1'))  || DEFAULT_SALARY    } catch { return DEFAULT_SALARY } }
function loadPortfolio() { try { return JSON.parse(localStorage.getItem('portfolio'))      || DEFAULT_PORTFOLIO } catch { return DEFAULT_PORTFOLIO } }
function loadVacBal()    { try { const v = localStorage.getItem('vacationBal_v2');  return v !== null ? Number(v) : 0 } catch { return 0 } }
function loadSpendBal()  { try { const v = localStorage.getItem('spendingBal_v1'); return v !== null ? Number(v) : 19352 } catch { return 19352 } }
function loadVacMonthly() { try { const v = localStorage.getItem('vacationMonthly_v1'); return v !== null ? Number(v) : VACATION_MONTHLY } catch { return VACATION_MONTHLY } }
function loadNeeds()     { try { return JSON.parse(localStorage.getItem('budgetNeeds_v2')) || DEFAULT_NEEDS     } catch { return DEFAULT_NEEDS } }
function loadWants()     { try { return JSON.parse(localStorage.getItem('budgetWants_v1')) || DEFAULT_WANTS     } catch { return DEFAULT_WANTS } }

// ── Finance helpers ───────────────────────────────────────────────────────────
function calcSip(salary, vacMonthly = VACATION_MONTHLY) { return Math.max(0, salary - FIXED_MONTHLY - vacMonthly - SPEND_CAP) }

function sipFV(monthly, rateAnnual, months) {
  if (!rateAnnual || !monthly) return monthly * months
  const r = rateAnnual / 1200
  return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
}
function lumpFV(amount, rateAnnual, months) {
  if (!rateAnnual) return amount
  return amount * Math.pow(1 + rateAnnual / 1200, months)
}

// ── Inline editable value ─────────────────────────────────────────────────────
function InlineEdit({ value, onSave, prefix = '₹', className = '', inputClass = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(value))
  function commit() { onSave(Math.max(0, Number(val) || 0)); setEditing(false) }
  if (editing) return (
    <div className="flex items-center gap-0.5">
      <span className="text-xs text-gray-400">{prefix}</span>
      <input type="number" value={val} onChange={e => setVal(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false) }}
        className={`text-right bg-indigo-50 border border-indigo-300 rounded-lg px-1.5 py-0.5 focus:outline-none ${inputClass}`}
        autoFocus />
    </div>
  )
  return (
    <button onClick={() => { setEditing(true); setVal(String(value)) }}
      className={`hover:text-indigo-600 transition-colors ${className}`}>
      {prefix}{Number(value).toLocaleString()}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO TAB
// ─────────────────────────────────────────────────────────────────────────────

function GoalCard({ portfolio, salary, vacMonthly }) {
  const tooltipStyle = useTooltipStyle()
  const sip          = calcSip(salary, vacMonthly)
  const totalCurrent = portfolio.reduce((s, p) => s + p.current, 0)

  const projPortfolio = Math.round(lumpFV(totalCurrent, 15, N_MONTHS) + sipFV(sip, 15, N_MONTHS))
  const onTrack       = projPortfolio >= TOTAL_GOAL
  const nowPct        = Math.min(100, Math.round(totalCurrent / TOTAL_GOAL * 100))
  const projPct       = Math.min(100, Math.round(projPortfolio / TOTAL_GOAL * 100))

  const chartData = PROJ_MONTHS.map((month, i) => {
    const n   = i + 1
    const inv = Math.round(lumpFV(totalCurrent, 15, n) + sipFV(sip, 15, n))
    return { month, investments: inv }
  })

  const SCENARIOS = [
    { label: '10% p.a.', rate: 10, color: '#94a3b8' },
    { label: '15% p.a.', rate: 15, color: '#6366f1' },
    { label: '20% p.a.', rate: 20, color: '#10b981' },
  ]

  return (
    <div className="space-y-3">
      {/* Goal card */}
      <div className={`rounded-2xl p-4 border ${onTrack ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Portfolio Goal · Jun 2027</div>
            <div className="text-3xl font-black text-gray-800">₹4,00,000</div>
            <div className="text-xs text-gray-500 mt-0.5">SIP ₹{sip.toLocaleString()}/mo at 15% CAGR · {N_MONTHS} months</div>
          </div>
          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ml-2 ${onTrack ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
            {onTrack ? '✓ On track' : '⚠ Below'}
          </div>
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">Now: ₹{totalCurrent.toLocaleString()} <span className="text-gray-400">({nowPct}%)</span></span>
            <span className={`font-semibold ${onTrack ? 'text-emerald-600' : 'text-orange-500'}`}>
              Projected: ₹{projPortfolio.toLocaleString()} ({projPct}%)
            </span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-100">
            <div className={`h-full rounded-full transition-all duration-700 ${onTrack ? 'bg-emerald-400' : 'bg-orange-400'}`}
              style={{ width: `${projPct}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-400">
            <span>₹0</span><span>₹4L</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'SIP / mo',    val: `₹${sip.toLocaleString()}`,              color: 'text-indigo-600', bg: 'bg-white' },
            { label: 'Current',     val: `₹${totalCurrent.toLocaleString()}`,      color: 'text-gray-700',   bg: 'bg-white' },
            { label: 'Projected',   val: `₹${(projPortfolio/1000).toFixed(0)}k`,   color: onTrack ? 'text-emerald-600' : 'text-orange-500', bg: 'bg-white' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2.5 border border-gray-100`}>
              <div className="text-xs text-gray-400">{s.label}</div>
              <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Projection chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-gray-700 font-semibold text-sm">Portfolio Projection</h3>
            <div className="text-xs text-gray-400">existing portfolio + SIP at 15% CAGR</div>
          </div>
          <div className={`text-sm font-bold ${onTrack ? 'text-emerald-600' : 'text-orange-500'}`}>
            ₹{(projPortfolio/1000).toFixed(0)}k by Jun '27
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} width={48}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={v => [`₹${Number(v).toLocaleString()}`, 'Portfolio']} />
            <ReferenceLine y={TOTAL_GOAL} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: '₹4L goal', position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />
            <Area type="monotone" dataKey="investments" stroke="#6366f1" strokeWidth={2} fill="url(#invGrad)" name="Portfolio" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scenarios */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-1">Return Scenarios</h3>
        <div className="text-xs text-gray-400 mb-3">SIP ₹{sip.toLocaleString()}/mo · ₹{totalCurrent.toLocaleString()} existing</div>
        <div className="space-y-3">
          {SCENARIOS.map(s => {
            const proj = Math.round(lumpFV(totalCurrent, s.rate, N_MONTHS) + sipFV(sip, s.rate, N_MONTHS))
            const pct  = Math.min(100, Math.round(proj / TOTAL_GOAL * 100))
            const hits = proj >= TOTAL_GOAL
            return (
              <div key={s.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-600">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">₹{(proj/1000).toFixed(0)}k</span>
                    <span className={`text-xs font-bold ${hits ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {hits ? `✓ +₹${((proj-TOTAL_GOAL)/1000).toFixed(0)}k` : `${pct}%`}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InvestmentPortfolio({ portfolio, onUpdatePortfolio, salary, vacMonthly }) {
  const tooltipStyle  = useTooltipStyle()
  const sip           = calcSip(salary, vacMonthly)
  const [editCell, setEditCell] = useState(null)
  const [editingSip,  setEditingSip]  = useState(false)
  const [sipOverride, setSipOverride] = useState(null)
  const [sipVal, setSipVal] = useState(String(sip))

  const displaySip     = sipOverride !== null ? sipOverride : sip
  const totalInvested  = portfolio.reduce((s, p) => s + p.invested, 0)
  const totalCurrent   = portfolio.reduce((s, p) => s + p.current,  0)
  const totalGain      = totalCurrent - totalInvested
  const totalReturnPct = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : '0.0'

  function commitCell(pi, field, raw) {
    const val = Math.max(0, parseFloat(raw) || 0)
    onUpdatePortfolio(portfolio.map((p, i) => i !== pi ? p : { ...p, [field]: val }))
    setEditCell(null)
  }

  function EditableCell({ pi, field, value, color, bold }) {
    const isEd = editCell?.pi === pi && editCell?.field === field
    if (isEd) return (
      <div className="flex items-center gap-0.5">
        <span className="text-xs text-gray-500">₹</span>
        <input type="number" value={editCell.val} autoFocus
          className={`w-20 text-right text-xs font-bold bg-white border border-indigo-300 rounded-lg px-1.5 py-0.5 focus:outline-none`}
          style={{ color }}
          onChange={e => setEditCell(ec => ({ ...ec, val: e.target.value }))}
          onBlur={() => commitCell(pi, field, editCell.val)}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditCell(null) }} />
      </div>
    )
    return (
      <button onClick={() => setEditCell({ pi, field, val: value })}
        className={`text-xs ${bold ? 'font-bold text-sm' : 'font-semibold'} hover:opacity-60 transition-opacity`}
        style={{ color }}>
        ₹{Number(value).toLocaleString()}
      </button>
    )
  }

  const barData = portfolio.map(p => ({ name: p.platform, invested: p.invested, current: p.current }))

  return (
    <div className="space-y-3">
      {/* Portfolio summary */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Portfolio Value</div>
            <div className="text-3xl font-black text-gray-800">₹{totalCurrent.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">₹{totalInvested.toLocaleString()} invested</div>
          </div>
          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ml-2 border ${totalGain >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-500'}`}>
            {totalGain >= 0 ? '▲' : '▼'} ₹{Math.abs(totalGain).toLocaleString()} ({totalReturnPct}%)
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
            <div className="text-xs text-gray-400">Invested</div>
            <div className="text-sm font-bold text-gray-700">₹{totalInvested.toLocaleString()}</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
            <div className="text-xs text-gray-400">Current</div>
            <div className="text-sm font-bold text-emerald-600">₹{totalCurrent.toLocaleString()}</div>
          </div>
          <div className={`rounded-xl p-2.5 border ${totalGain >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
            <div className="text-xs text-gray-400">Return</div>
            <div className={`text-sm font-bold ${totalGain >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
              {totalGain >= 0 ? '+' : ''}{totalReturnPct}%
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">tap values to update</div>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-2 gap-3">
        {portfolio.map((p, pi) => {
          const gain = p.current - p.invested
          const pct  = p.invested > 0 ? ((gain / p.invested) * 100).toFixed(1) : '0.0'
          return (
            <div key={p.platform} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{p.emoji}</span>
                <span className="text-xs font-bold text-gray-700">{p.platform}</span>
              </div>
              <div className="text-xs text-gray-400 mb-0.5">current value</div>
              <EditableCell pi={pi} field="current" value={p.current} color={p.color} bold />
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <span>inv:</span>
                <EditableCell pi={pi} field="invested" value={p.invested} color="#6b7280" />
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2 mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (p.current / (p.invested * 1.5)) * 100)}%`, background: p.color }} />
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">{pct}% return</span>
                <span className={`text-xs font-bold ${gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {gain >= 0 ? '+' : ''}₹{gain.toLocaleString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* SIP card */}
      <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monthly SIP</div>
          {sipOverride !== null && (
            <button onClick={() => { setSipOverride(null) }}
              className="text-xs text-gray-400 hover:text-indigo-600">↺ reset to auto</button>
          )}
          {sipOverride === null && !editingSip && (
            <button onClick={() => { setEditingSip(true); setSipVal(String(displaySip)) }}
              className="text-xs text-indigo-500 font-semibold hover:text-indigo-700">override</button>
          )}
        </div>
        {editingSip ? (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500 font-bold">₹</span>
            <input type="number" value={sipVal} autoFocus
              className="flex-1 text-2xl font-black text-indigo-700 bg-white border border-indigo-300 rounded-xl px-3 py-1.5 focus:outline-none"
              onChange={e => setSipVal(e.target.value)}
              onBlur={() => { setSipOverride(Math.max(0, parseInt(sipVal)||0)); setEditingSip(false) }}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingSip(false) }} />
            <span className="text-gray-500">/ mo</span>
          </div>
        ) : (
          <div className="text-3xl font-black text-indigo-700 mt-1">
            ₹{displaySip.toLocaleString()}<span className="text-base font-normal text-indigo-400"> / month</span>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1.5">
          {sipOverride !== null ? 'manually overridden' : `auto: salary − subs − vacation − ₹${SPEND_CAP.toLocaleString()} spend`}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SPENDING TAB
// ─────────────────────────────────────────────────────────────────────────────

function MonthlyAllocation({ salary, onUpdateSalary, spendBal, onUpdateSpendBal, vacMonthly, onUpdateVacMonthly, spendTotal }) {
  const tooltipStyle = useTooltipStyle()
  const sip = calcSip(salary, vacMonthly)
  const varDisplay = spendTotal ?? SPEND_CAP

  const allocData = [
    { name: 'SIP',      value: sip,          color: '#6366f1' },
    { name: 'Vacation', value: vacMonthly,   color: '#f472b6' },
    { name: 'Variable', value: varDisplay,   color: '#f59e0b' },
    { name: 'Subs',     value: FIXED_MONTHLY,color: '#06b6d4' },
  ]

  return (
    <div className="space-y-3">
      {/* Salary + balance inputs */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">This Month</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <div className="text-xs text-gray-400 mb-1">Salary credited (7th)</div>
            <InlineEdit value={salary} onSave={v => { onUpdateSalary(v); localStorage.setItem('monthlySalary_v1', v) }}
              className="text-xl font-black text-emerald-600"
              inputClass="w-24 text-base font-black text-emerald-700" />
            <div className="text-xs text-gray-400 mt-0.5">tap to update</div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <div className="text-xs text-gray-400 mb-1">Spending a/c balance</div>
            <InlineEdit value={spendBal} onSave={v => { onUpdateSpendBal(v); localStorage.setItem('spendingBal_v1', v) }}
              className="text-xl font-black text-indigo-600"
              inputClass="w-24 text-base font-black text-indigo-700" />
            <div className="text-xs text-gray-400 mt-0.5">tap to update</div>
          </div>
        </div>
      </div>

      {/* Allocation */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Allocation — ₹{salary.toLocaleString()}</h3>
        <div className="flex gap-4 items-center mb-4">
          <PieChart width={110} height={110}>
            <Pie data={allocData} cx={50} cy={50} innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
              {allocData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${Number(v).toLocaleString()}`, '']} />
          </PieChart>
          <div className="flex-1 space-y-2">
            {allocData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                <span className="text-xs font-bold text-gray-700">₹{d.value.toLocaleString()}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{Math.round(d.value / salary * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
        {/* Line items */}
        <div className="space-y-1 border-t border-gray-50 pt-3 text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
            <span className="font-bold text-gray-700">Salary (7th)</span>
            <span className="font-black text-emerald-600">+₹{salary.toLocaleString()}</span>
          </div>
          {FIXED_SUBS.map(s => (
            <div key={s.name} className="flex items-center justify-between py-0.5">
              <span className="text-gray-500">{s.name}</span>
              <span className="text-gray-400">−₹{s.amount}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Monthly SIP</span>
              <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.5 rounded">investing</span>
            </div>
            <span className="font-semibold text-indigo-600">−₹{sip.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Vacation fund ✈️</span>
              {vacMonthly > VACATION_MONTHLY
                ? <span className="text-xs bg-orange-50 text-orange-500 font-semibold px-1.5 py-0.5 rounded">Goa month 🏖️</span>
                : <span className="text-xs bg-pink-50 text-pink-600 font-semibold px-1.5 py-0.5 rounded">Jul–Apr</span>}
            </div>
            <InlineEdit value={vacMonthly}
              onSave={v => { onUpdateVacMonthly(v); localStorage.setItem('vacationMonthly_v1', v) }}
              className="font-semibold text-pink-500"
              inputClass="w-20 text-sm font-semibold text-pink-700" />
          </div>
          <div className="flex items-center justify-between py-0.5 border-t border-gray-50 mt-1 pt-1.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Variable spend</span>
              <span className="text-xs text-gray-400">(Needs + Wants)</span>
            </div>
            <span className="text-gray-400">−₹{varDisplay.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-700">Remainder</span>
            <span className={`text-lg font-black ${salary - FIXED_MONTHLY - sip - vacMonthly - varDisplay === 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
              ₹{Math.max(0, salary - FIXED_MONTHLY - sip - vacMonthly - varDisplay).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BudgetSection({ title, emoji, color, storageKey, defaults, onTotalChange }) {
  const [cats, setCats] = useState(() => { try { return JSON.parse(localStorage.getItem(storageKey)) || defaults } catch { return defaults } })
  const [editIdx, setEditIdx] = useState(null)
  const [editVal, setEditVal] = useState('')

  const total = cats.reduce((s, c) => s + c.amount, 0)

  function commit(i, raw) {
    const amount  = Math.max(0, parseInt(raw) || 0)
    const updated = cats.map((c, j) => j !== i ? c : { ...c, amount })
    setCats(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    onTotalChange?.(updated.reduce((s, c) => s + c.amount, 0))
    setEditIdx(null)
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <div>
            <h3 className="text-gray-700 font-semibold text-sm">{title}</h3>
            <div className="text-xs text-gray-400">tap to edit</div>
          </div>
        </div>
        <span className="text-sm font-black text-gray-700">₹{total.toLocaleString()}</span>
      </div>

      {/* Bar */}
      <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: color + '22' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, total / SPEND_CAP * 100)}%`, background: color }} />
      </div>

      <div className="space-y-2">
        {cats.map((c, i) => {
          const isEd = editIdx === i
          const pct  = total > 0 ? Math.round(c.amount / total * 100) : 0
          return (
            <div key={c.label} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs font-semibold text-gray-600 truncate">{c.label}</span>
                  <span className="text-xs text-gray-300 hidden sm:inline truncate">{c.note}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 shrink-0 w-8 text-right">{pct}%</span>
              {isEd ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-xs text-gray-400">₹</span>
                  <input type="number" autoFocus value={editVal}
                    className="w-20 text-right text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-300 rounded-lg px-1.5 py-0.5 focus:outline-none"
                    onChange={e => setEditVal(e.target.value)}
                    onBlur={() => commit(i, editVal)}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditIdx(null) }} />
                </div>
              ) : (
                <button onClick={() => { setEditIdx(i); setEditVal(String(c.amount)) }}
                  className="text-xs font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 shrink-0 px-2 py-0.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                  ₹{c.amount.toLocaleString()}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100">
        <span className="text-xs text-gray-500">of ₹{SPEND_CAP.toLocaleString()} cap</span>
        <span className={`text-xs font-bold ${total > SPEND_CAP / 2 + 1000 ? 'text-orange-500' : 'text-emerald-600'}`}>
          {Math.round(total / SPEND_CAP * 100)}% of budget
        </span>
      </div>
    </div>
  )
}

const CAT_COLORS = {
  Food: '#6366f1', Transport: '#f59e0b', Shopping: '#ec4899',
  Entertainment: '#8b5cf6', Health: '#10b981', Rent: '#06b6d4',
  Subscriptions: '#f97316', Bills: '#64748b', Education: '#84cc16',
}

function SpendingThisMonth({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const today    = new Date()
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const monthLogs = logs.filter(l => l.date?.startsWith(monthKey) && l.spending?.length)
  const allSpend  = monthLogs.flatMap(l => l.spending.map(s => ({ ...s, date: l.date })))
  const total     = allSpend.reduce((s, e) => s + e.amount, 0)
  const remaining = Math.max(0, SPEND_CAP - total)
  const over      = total > SPEND_CAP
  const pct       = Math.min(100, Math.round(total / SPEND_CAP * 100))
  const dom       = today.getDate()
  const dailyRate = dom > 0 ? Math.round(total / dom) : 0
  const daysLeft  = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - dom

  // Category breakdown for pie chart
  const catMap = {}
  allSpend.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value, color: CAT_COLORS[name] || '#94a3b8' }))
    .sort((a, b) => b.value - a.value)

  // Daily spend bar chart
  const last14 = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const dayTotal = allSpend.filter(e => e.date === key).reduce((s, e) => s + e.amount, 0)
    last14.push({ date: key.slice(5), amount: dayTotal })
  }

  const recentTx = [...allSpend].sort((a, b) => b.date?.localeCompare(a.date)).slice(0, 20)

  if (!monthLogs.length) return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center text-gray-400 text-sm py-8">
      <div className="text-3xl mb-2">💳</div>
      No spending logged yet this month
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Summary card */}
      <div className={`rounded-2xl p-4 border ${over ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Actual Spend · {today.toLocaleDateString('en-IN', { month: 'short' })}</div>
            <div className={`text-3xl font-black mt-0.5 ${over ? 'text-red-500' : 'text-gray-800'}`}>₹{total.toLocaleString()}</div>
          </div>
          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${over ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {over ? '⚠ Over' : '✓ On track'}
          </div>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : 'bg-indigo-400'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-3">
          <span>{pct}% used · {daysLeft} days left</span>
          <span>{over ? `₹${(total - SPEND_CAP).toLocaleString()} over` : `₹${remaining.toLocaleString()} left`}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '₹/day rate',   val: `₹${dailyRate}`,    sub: `ideal ₹${Math.round(SPEND_CAP/30)}`, color: dailyRate > SPEND_CAP/30 ? 'text-red-500' : 'text-indigo-600' },
            { label: 'Spent',        val: `₹${total.toLocaleString()}`, sub: `of ₹${(SPEND_CAP/1000).toFixed(0)}k cap`, color: 'text-gray-700' },
            { label: 'Daily budget', val: `₹${daysLeft > 0 ? Math.round(remaining / daysLeft) : 0}`, sub: 'left per day', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-2.5 border border-gray-100">
              <div className="text-xs text-gray-400">{s.label}</div>
              <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category wheel + breakdown */}
      {catData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold text-sm mb-3">By Category</h3>
          <div className="flex gap-4 items-center">
            <PieChart width={120} height={120}>
              <Pie data={catData} cx={55} cy={55} innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={2}>
                {catData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${Number(v).toLocaleString()}`, '']} />
            </PieChart>
            <div className="flex-1 space-y-1.5 min-w-0">
              {catData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-600 flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-bold text-gray-700 shrink-0">₹{d.value.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 w-7 text-right shrink-0">{Math.round(d.value / total * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily spend bar chart */}
      {last14.some(d => d.amount > 0) && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold text-sm mb-3">Daily Spend · Last 14 days</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={last14} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis stroke="#cbd5e1" tick={{ fontSize: 9, fill: '#94a3b8' }} width={36}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${Number(v).toLocaleString()}`, 'Spent']} />
              <ReferenceLine y={Math.round(SPEND_CAP / 30)} stroke="#f59e0b" strokeDasharray="3 3"
                label={{ value: 'daily avg', position: 'insideTopRight', fontSize: 8, fill: '#f59e0b' }} />
              <Bar dataKey="amount" fill="#6366f1" radius={[3, 3, 0, 0]}
                cell={({ amount }) => <rect fill={amount > SPEND_CAP / 30 ? '#ef4444' : '#6366f1'} />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Transactions</span>
          <span className="text-xs text-gray-400">{allSpend.length} items</span>
        </div>
        {recentTx.length === 0 ? (
          <div className="text-center text-gray-300 text-sm py-6">No transactions</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTx.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                  style={{ background: CAT_COLORS[tx.category] || '#94a3b8' }}>
                  {tx.category?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 font-medium truncate">{tx.item}</div>
                  <div className="text-xs text-gray-400">{tx.category} · {tx.date?.slice(5)}</div>
                </div>
                <span className="text-sm font-bold text-gray-700 shrink-0">₹{tx.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VacationFund({ vacBal, onUpdateVacBal }) {
  const pct      = Math.min(100, Math.round(vacBal / VACATION_TOTAL * 100))
  const goaReady = vacBal >= VACATIONS[0].budget
  const lakshReady = vacBal >= VACATION_TOTAL

  return (
    <div className="space-y-3">
      <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Vacation Fund ✈️</div>
            <div className="text-3xl font-black text-gray-800">₹{VACATION_TOTAL.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">₹{VACATION_MONTHLY.toLocaleString()}/mo · ₹20k lump + 10 months</div>
          </div>
          <div className="px-2.5 py-1 rounded-xl text-xs font-bold bg-pink-500 text-white">{pct}% saved</div>
        </div>
        <div className="bg-white rounded-xl p-2.5 border border-pink-100 mb-3">
          <div className="text-xs text-gray-400 mb-0.5">Balance</div>
          <InlineEdit value={vacBal} onSave={v => { onUpdateVacBal(v); localStorage.setItem('vacationBal_v2', v) }}
            className="text-2xl font-black text-pink-600"
            inputClass="w-28 text-xl font-black text-pink-700" />
          <div className="text-xs text-gray-400 mt-0.5">tap to update</div>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden border border-pink-100">
          <div className="h-full rounded-full bg-pink-400 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-400">
          <span>₹{vacBal.toLocaleString()} saved</span>
          <span>₹{Math.max(0, VACATION_TOTAL - vacBal).toLocaleString()} to go</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {VACATIONS.map((v, i) => {
          const ready   = i === 0 ? goaReady : lakshReady
          const saved   = i === 0 ? Math.min(vacBal, v.budget) : Math.max(0, vacBal - VACATIONS[0].budget)
          const tripPct = Math.min(100, Math.round(saved / v.budget * 100))
          return (
            <div key={v.name} className={`rounded-2xl p-3.5 border ${ready ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'} shadow-sm`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xl">{v.emoji}</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">{v.name}</div>
                  <div className="text-xs text-gray-400">{v.month} · ₹{(v.budget/1000).toFixed(0)}k</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full transition-all ${ready ? 'bg-emerald-400' : 'bg-pink-400'}`}
                  style={{ width: `${tripPct}%` }} />
              </div>
              <div className={`text-xs font-semibold ${ready ? 'text-emerald-600' : 'text-pink-500'}`}>
                {ready ? '✓ Funded!' : `₹${saved.toLocaleString()} / ₹${v.budget.toLocaleString()}`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Finance({ logs }) {
  const [tab,        setTab]        = useState('portfolio')
  const [salary,     setSalary]     = useState(loadSalary)
  const [portfolio,  setPortfolio]  = useState(loadPortfolio)
  const [vacBal,     setVacBal]     = useState(loadVacBal)
  const [spendBal,   setSpendBal]   = useState(loadSpendBal)
  const [vacMonthly, setVacMonthly] = useState(loadVacMonthly)
  const [needsTotal, setNeedsTotal] = useState(() => (loadNeeds()).reduce((s, c) => s + c.amount, 0))
  const [wantsTotal, setWantsTotal] = useState(() => (loadWants()).reduce((s, c) => s + c.amount, 0))

  const spendTotal = needsTotal + wantsTotal

  function updatePortfolio(p) {
    setPortfolio(p)
    localStorage.setItem('portfolio', JSON.stringify(p))
  }

  return (
    <div className="space-y-3 fade-up">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[['portfolio','💼','Portfolio'],['spending','💳','Spending']].map(([id, emoji, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-1.5 text-sm rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === id ? 'bg-white text-indigo-600 shadow-sm font-semibold' : 'text-gray-400 hover:text-gray-600'
            }`}>
            <span>{emoji}</span><span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'portfolio' && (
        <div className="space-y-3">
          <GoalCard portfolio={portfolio} salary={salary} vacMonthly={vacMonthly} />
          <InvestmentPortfolio portfolio={portfolio} onUpdatePortfolio={updatePortfolio} salary={salary} vacMonthly={vacMonthly} />
        </div>
      )}

      {tab === 'spending' && (
        <div className="space-y-3">
          <MonthlyAllocation salary={salary} onUpdateSalary={setSalary} spendBal={spendBal} onUpdateSpendBal={setSpendBal} vacMonthly={vacMonthly} onUpdateVacMonthly={setVacMonthly} spendTotal={spendTotal} />
          <SpendingThisMonth logs={logs} />
          <BudgetSection title="Needs" emoji="🧾" color="#6366f1"
            storageKey="budgetNeeds_v2" defaults={DEFAULT_NEEDS} onTotalChange={setNeedsTotal} />
          <BudgetSection title="Wants" emoji="🎉" color="#ec4899"
            storageKey="budgetWants_v1" defaults={DEFAULT_WANTS} onTotalChange={setWantsTotal} />
          <VacationFund vacBal={vacBal} onUpdateVacBal={setVacBal} />
        </div>
      )}
    </div>
  )
}
