import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'system',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#f8fafc',
          surface: '#ffffff',
          primary: '#2563eb',
          'on-primary': '#ffffff',
          secondary: '#64748b',
          'on-secondary': '#ffffff',
          error: '#ef4444',
          'on-error': '#ffffff',
          info: '#3b82f6',
          'on-info': '#ffffff',
          success: '#10b981',
          'on-success': '#ffffff',
          warning: '#f59e0b',
          'on-warning': '#ffffff',
          'on-background': '#1e293b',
          'on-surface': '#1e293b',
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#0f172a',
          surface: '#1e293b',
          primary: '#3b82f6',
          'on-primary': '#ffffff',
          secondary: '#94a3b8',
          'on-secondary': '#0f172a',
          error: '#f87171',
          'on-error': '#0f172a',
          info: '#60a5fa',
          'on-info': '#0f172a',
          success: '#34d399',
          'on-success': '#0f172a',
          warning: '#fbbf24',
          'on-warning': '#0f172a',
          'on-background': '#e2e8f0',
          'on-surface': '#e2e8f0',
        },
      },
    },
  },
  display: {
    thresholds: {
      md: 960,
      lg: 1280,
      xl: 1920,
      xxl: 2560,
    },
  },
})
