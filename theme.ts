// src/lib/theme.ts
// Calm, organic, sage-and-stone palette — trustworthy and warm.

export const Colors = {
  // Primary brand — deep forest green
  brand: '#0F4C3A',
  brandLight: '#1D7A5F',
  brandMuted: '#E1F5EE',

  // Backgrounds
  background: '#F7F5F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EDE6',

  // Text
  textPrimary: '#1C1C1A',
  textSecondary: '#6B6860',
  textMuted: '#A09D96',
  textOnDark: '#FFFFFF',

  // Caution levels
  low: '#1D7A5F',
  lowBg: '#E1F5EE',
  lowBorder: '#9FE1CB',

  moderate: '#8A5C00',
  moderateBg: '#FAEEDA',
  moderateBorder: '#FAC775',

  watch: '#8C2020',
  watchBg: '#FCEBEB',
  watchBorder: '#F7C1C1',

  // UI
  border: '#E0DDD6',
  borderStrong: '#C8C5BE',
  divider: '#EEEBE4',
};

export const Typography = {
  // Using Georgia-like serif for headings — warm and trustworthy
  displayFont: 'Georgia',
  bodyFont: 'System',

  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeights: {
    tight: 1.3,
    normal: 1.6,
    relaxed: 1.8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
