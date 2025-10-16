// src/theme/responsive.js
// Helpers for responsive sizing across different screen sizes
import React, { useMemo } from 'react';
import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base guideline sizes are based on standard ~5.5" mobile device
const BASE_WIDTH = 375; // iPhone X width
const BASE_HEIGHT = 812; // iPhone X height

const horizontalScale = SCREEN_WIDTH / BASE_WIDTH;
const verticalScale = SCREEN_HEIGHT / BASE_HEIGHT;

export const wp = (percentage) => {
  // width percentage to dp
  const val = (SCREEN_WIDTH * percentage) / 100;
  return PixelRatio.roundToNearestPixel(val);
};

export const hp = (percentage) => {
  // height percentage to dp
  const val = (SCREEN_HEIGHT * percentage) / 100;
  return PixelRatio.roundToNearestPixel(val);
};

export const scale = (size) => PixelRatio.roundToNearestPixel(size * horizontalScale);
export const vscale = (size) => PixelRatio.roundToNearestPixel(size * verticalScale);

export const moderateScale = (size, factor = 0.5) => {
  const scaled = size * horizontalScale;
  return PixelRatio.roundToNearestPixel(size + (scaled - size) * factor);
};

// Aliases
export const s = scale;
export const vs = vscale;
export const ms = moderateScale;

// Generic clamp utility
const clamp = (val, min, max) => {
  if (typeof min === 'number') val = Math.max(min, val);
  if (typeof max === 'number') val = Math.min(max, val);
  return val;
};

// Clamp variants (static versions based on initial screen size)
export const msClamp = (size, min, max, factor = 0.5) => clamp(moderateScale(size, factor), min ?? -Infinity, max ?? Infinity);
export const wpClamp = (percentage, min, max) => clamp(wp(percentage), min ?? -Infinity, max ?? Infinity);
export const hpClamp = (percentage, min, max) => clamp(hp(percentage), min ?? -Infinity, max ?? Infinity);

// Dynamic hook that recalculates scalers on orientation/size change
export const useResponsiveSize = () => {
  const { width, height } = useWindowDimensions();

  const scalers = useMemo(() => {
    const BASE_WIDTH_LOCAL = 375;
    const BASE_HEIGHT_LOCAL = 812;
    const hScale = width / BASE_WIDTH_LOCAL;
    const vScale = height / BASE_HEIGHT_LOCAL;

    const wpLocal = (percentage) => PixelRatio.roundToNearestPixel((width * percentage) / 100);
    const hpLocal = (percentage) => PixelRatio.roundToNearestPixel((height * percentage) / 100);
    const scaleLocal = (size) => PixelRatio.roundToNearestPixel(size * hScale);
    const vscaleLocal = (size) => PixelRatio.roundToNearestPixel(size * vScale);
    const moderateScaleLocal = (size, factor = 0.5) => {
      const scaled = size * hScale;
      return PixelRatio.roundToNearestPixel(size + (scaled - size) * factor);
    };

    const clampLocal = (val, min, max) => {
      if (typeof min === 'number') val = Math.max(min, val);
      if (typeof max === 'number') val = Math.min(max, val);
      return val;
    };

    const msClampLocal = (size, min, max, factor = 0.5) => clampLocal(moderateScaleLocal(size, factor), min ?? -Infinity, max ?? Infinity);
    const wpClampLocal = (p, min, max) => clampLocal(wpLocal(p), min ?? -Infinity, max ?? Infinity);
    const hpClampLocal = (p, min, max) => clampLocal(hpLocal(p), min ?? -Infinity, max ?? Infinity);

    return {
      width,
      height,
      wp: wpLocal,
      hp: hpLocal,
      s: scaleLocal,
      vs: vscaleLocal,
      ms: moderateScaleLocal,
      scale: scaleLocal,
      vscale: vscaleLocal,
      msClamp: msClampLocal,
      wpClamp: wpClampLocal,
      hpClamp: hpClampLocal,
    };
  }, [width, height]);

  return scalers;
};
