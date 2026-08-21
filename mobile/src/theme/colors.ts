export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  border: string;
  primary: string;
  primaryHover: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  liveRed: string;
  liveRedBg: string;
  cardBg: string;
  inputBg: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  buttonSecondaryBorder: string;
  badgeBg: string;
  badgeText: string;
  statusBar: 'light-content' | 'dark-content';
}

export const darkColors: ThemeColors = {
  background: '#060709',
  surface: '#0C0D12',
  surfaceLight: '#14151D',
  border: 'rgba(225, 224, 204, 0.14)',
  primary: '#E1E0CC',
  primaryHover: '#F5F4E8',
  accent: '#E1E0CC',
  text: '#F5F5F0',
  textSecondary: 'rgba(225, 224, 204, 0.78)',
  textMuted: 'rgba(225, 224, 204, 0.45)',
  liveRed: '#EF4444',
  liveRedBg: 'rgba(239, 68, 68, 0.15)',
  cardBg: '#0C0D12',
  inputBg: '#0E1017',
  buttonPrimaryBg: '#E1E0CC',
  buttonPrimaryText: '#000000',
  buttonSecondaryBg: 'rgba(225, 224, 204, 0.08)',
  buttonSecondaryText: '#E1E0CC',
  buttonSecondaryBorder: 'rgba(225, 224, 204, 0.22)',
  badgeBg: 'rgba(225, 224, 204, 0.12)',
  badgeText: '#E1E0CC',
  statusBar: 'light-content',
};

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  border: '#E2E8F0',
  primary: '#0F172A',
  primaryHover: '#1E293B',
  accent: '#0F172A',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  liveRed: '#EF4444',
  liveRedBg: 'rgba(239, 68, 68, 0.1)',
  cardBg: '#FFFFFF',
  inputBg: '#F1F5F9',
  buttonPrimaryBg: '#0F172A',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#FFFFFF',
  buttonSecondaryText: '#0F172A',
  buttonSecondaryBorder: '#CBD5E1',
  badgeBg: 'rgba(15, 23, 42, 0.08)',
  badgeText: '#0F172A',
  statusBar: 'dark-content',
};

// Default export for backward compatibility
export const colors = darkColors;
