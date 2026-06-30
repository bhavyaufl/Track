import { createContext, useContext } from 'react'
export const DarkContext = createContext(false)
export const useDark = () => useContext(DarkContext)

export function useTooltipStyle() {
  const dark = useContext(DarkContext)
  return dark
    ? { background: '#1e1e28', border: '1px solid #2c2c3c', borderRadius: 12, fontSize: 12, color: '#e0e0f0' }
    : { background: '#fff',    border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }
}
