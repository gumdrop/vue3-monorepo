import { Chart } from 'chart.js/auto'

// Keep Chart.js axis text and grid lines readable when Vuetify follows the
// system light/dark preference. The app defaults its theme to 'system'.
const applyChartTheme = (dark: boolean) => {
  Chart.defaults.color = dark ? '#94a3b8' : '#64748b'
  Chart.defaults.borderColor = dark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(0, 0, 0, 0.1)'
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  applyChartTheme(media.matches)
  media.addEventListener('change', (event) => applyChartTheme(event.matches))
}
