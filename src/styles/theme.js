export const lightColors = {
  // Backgrounds
  bg: '#EFEBDD',
  bg2: '#E5E0CE',
  paper: '#F6F3E8',

  // Text
  ink: '#14241B',
  ink2: '#3B4C42',
  ink3: '#6E7A6E',

  // Borders
  line: '#C9C2A8',

  // Accent
  moss: '#2F4A39',
  moss2: '#46624F',
  sage: '#8FB996',
  lichen: '#B7CFAF',
  pistachio: '#C9E265',
  hot: '#E76A3A',

  // Chat bubbles
  botBubbleBg: '#E8EDE4',
  botBubbleBorder: '#C9C2A8',
  userBubbleBg: '#2F4A39',
  userBubbleText: '#F6F3E8',

  // Tab bar
  tabBarBg: '#F6F3E8',
  tabBarBorder: '#C9C2A8',
  tabActive: '#2F4A39',
  tabInactive: '#6E7A6E',
};

export const darkColors = {
  // Backgrounds
  bg: '#0F1A14',
  bg2: '#162010',
  paper: '#1A2618',

  // Text
  ink: '#ECE7D5',
  ink2: '#B8B0A0',
  ink3: '#7A7268',

  // Borders
  line: '#2A3828',

  // Accent
  moss: '#6BAA7A',
  moss2: '#8FBF9E',
  sage: '#5A8A65',
  lichen: '#3D6B48',
  pistachio: '#C9E265',
  hot: '#E76A3A',

  // Chat bubbles
  botBubbleBg: '#1E2D22',
  botBubbleBorder: '#2A3828',
  userBubbleBg: '#6BAA7A',
  userBubbleText: '#0F1A14',

  // Tab bar
  tabBarBg: '#1A2618',
  tabBarBorder: '#2A3828',
  tabActive: '#C9E265',
  tabInactive: '#7A7268',
};

export const getTheme = (isDark) => (isDark ? darkColors : lightColors);

export const typography = {
  display: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
  heading: { fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  body: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
  label: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
