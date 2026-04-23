export const APP_NAME = 'HEAL';
export const APP_TAGLINE = 'Your voice. Your journey.';

export const Colors = {
  // Backgrounds — clean white
  background: '#FFFFFF',
  surface: '#F7F5F2',
  surfaceElevated: '#EDEAE6',

  // Warm rose — the emotional heart of the app
  accent: '#C0605A',
  accentLight: '#E8918B',
  accentSoft: '#FAE8E7',
  accentDim: '#8C3D39',

  // Muted sage — secondary calm tone
  sage: '#7A9E8E',
  sageSoft: '#E8F0ED',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textMuted: '#9E9E9E',
  textInverse: '#FFFFFF',

  // Status
  crisis: '#D32F2F',
  crisisBg: '#FFEBEE',
  success: '#2E7D52',

  // Recording state
  recordingRed: '#D32F2F',
  recordingRedGlow: 'rgba(211, 47, 47, 0.15)',

  // Borders & dividers
  border: '#E8E4DF',
  borderStrong: '#C8C4BE',

  // Overlay / shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const Typography = {
  hero: { fontSize: 30, fontWeight: '700' as const, color: Colors.textPrimary, lineHeight: 38 },
  title: { fontSize: 22, fontWeight: '600' as const, color: Colors.textPrimary, lineHeight: 30 },
  subtitle: { fontSize: 16, fontWeight: '500' as const, color: Colors.textSecondary, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400' as const, color: Colors.textMuted, lineHeight: 19 },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
};
