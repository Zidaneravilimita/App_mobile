// src/hooks/useResponsive.js
import { useWindowDimensions, Platform, StatusBar } from 'react-native';

export function useResponsive() {
  const { width, height, scale, fontScale } = useWindowDimensions();

  // Simple breakpoints
  const isSmall = height < 700 || width < 360;
  const isTablet = Math.min(width, height) >= 768;

  // Derived layout helpers
  const targetCardWidth = isTablet ? 220 : 160;
  const numColumns = Math.max(1, Math.floor(width / targetCardWidth));

  // Spacing
  const spacing = isTablet ? 20 : isSmall ? 12 : 16;

  // Status bar safe top (for when SafeAreaView not used)
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  // Typography scale
  const font = (size) => Math.round(size * (isTablet ? 1.15 : isSmall ? 0.95 : 1));

  return {
    width,
    height,
    scale,
    fontScale,
    isSmall,
    isTablet,
    numColumns,
    spacing,
    statusBarTop,
    font,
  };
}
