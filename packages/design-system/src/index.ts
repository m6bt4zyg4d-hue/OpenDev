export const colors = {
  background: '#05070b',
  surface: '#0f141d',
  elevated: '#161b26',
  border: '#263042',
  primary: '#4f8cff',
  primarySoft: '#dbe7ff',
  text: '#f7f9fc',
  muted: '#8d9aad',
  danger: '#ff4d6d',
  success: '#38d996',
  warning: '#ffd166'
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radii = { sm: 8, md: 14, lg: 22, pill: 999 } as const;
export const typography = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display: { fontSize: 32, lineHeight: 40, fontWeight: 800 },
  title: { fontSize: 22, lineHeight: 30, fontWeight: 750 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: 500 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: 500 }
} as const;

export const shadows = {
  card: '0 18px 50px rgba(0,0,0,.25)',
  glow: '0 0 32px rgba(79,140,255,.28)'
} as const;

export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    color: colors.text,
    padding: `${spacing.md}px ${spacing.xl}px`
  },
  ghost: {
    backgroundColor: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: radii.pill,
    color: colors.text,
    padding: `${spacing.md}px ${spacing.xl}px`
  }
} as const;
