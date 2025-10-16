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
  const spacingTokens = {
    xs: Math.round(spacing * 0.4),
    s: Math.round(spacing * 0.6),
    m: spacing,            // valeur par défaut
    l: Math.round(spacing * 1.25),
    xl: Math.round(spacing * 1.5),
  };

  // Status bar safe top (for when SafeAreaView not used)
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  // Typography scale (with optional clamp)
  const font = (size, opts = {}) => {
    const scaleFactor = (isTablet ? 1.15 : isSmall ? 0.95 : 1);
    let val = Math.round(size * scaleFactor);
    const { min, max } = opts;
    if (typeof min === 'number') val = Math.max(min, val);
    if (typeof max === 'number') val = Math.min(max, val);
    return val;
  };

  return {
    width,
    height,
    scale,
    fontScale,
    isSmall,
    isTablet,
    numColumns,
    spacing,
    spacingTokens,
    statusBarTop,
    font,
  };
}
