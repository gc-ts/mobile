import { StyleSheet } from 'react-native';

export const colors = {
  // Light theme colors (from web app)
  bgPrimary: '#F4F6F2',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#E8EDE4',
  textPrimary: '#181C16',
  textSecondary: '#181C16',
  textTertiary: '#4A6050',
  borderPrimary: '#C2CEBC',
  accentPrimary: '#3D8210',
  accentSecondary: '#2D6409',
  accentBg: '#E8EDE4',
  accentBorder: '#5FAD2E',

  // Message colors
  botMessageBg: '#E8F5E0',
  botMessageBorder: '#C8E6C0',
  userMessageBg: '#D4ECC4',
  userMessageText: '#2D6409',
  userMessageBorder: '#B8DFA4',

  // Auth colors
  authGradientStart: '#E8F5E0',
  authGradientMid: '#D4ECC4',
  authGradientEnd: '#C8E6C0',

  // Green accent
  green: '#5FAD2E',
  greenLight: '#7BC84A',
  greenDark: '#4A8C23',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  shadow: {
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  shadowLarge: {
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },

  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },

  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(95, 173, 46, 0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'System',
    color: colors.textPrimary,
  },

  inputFocused: {
    borderColor: colors.green,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },

  button: {
    backgroundColor: colors.green,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'System',
  },

  subtitle: {
    fontSize: 16,
    color: colors.textTertiary,
    fontFamily: 'System',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentSecondary,
    marginBottom: 8,
    fontFamily: 'System',
  },
});

export default { colors, commonStyles };
