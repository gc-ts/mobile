import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function ScreenBackdrop() {
  const { colors, isDark } = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.orb,
          styles.orbTopRight,
          {
            backgroundColor: colors.pistachio,
            opacity: isDark ? 0.08 : 0.14,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbBottomLeft,
          {
            backgroundColor: colors.moss,
            opacity: isDark ? 0.06 : 0.1,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
  },
  orbTopRight: {
    top: -80,
    right: -60,
  },
  orbBottomLeft: {
    left: -80,
    bottom: -30,
  },
});
