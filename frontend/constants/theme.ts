/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Palette = {
  canvas: '#FAF8F2',
  surface: '#FFFFFF',
  sand: '#F5EFE6',
  border: '#F3E8D6',
  mango: '#F59E0B',
  mangoDark: '#D97706',
  leaf: '#16A34A',
  honey: '#FEF3C7',
  honeyText: '#B45309',
  charcoal: '#1C1917',
  body: '#57534E',
  muted: '#78716C',
  deepObsidian: '#1C1917',
  linenWhite: '#FAF8F2',
  warmCopper: '#D97706',
  mutedSage: '#16A34A',
  charcoalEspresso: '#57534E',
  stoneGray: '#F3E8D6',
  white: '#FFFFFF',
  slate: '#78716C',
};

export const Colors = {
  light: {
    text: Palette.charcoal,
    background: Palette.canvas,
    tint: Palette.mangoDark,
    surface: Palette.surface,
    border: Palette.border,
    icon: Palette.mangoDark,
    tabIconDefault: Palette.muted,
    tabIconSelected: Palette.mangoDark,
  },
  dark: {
    text: Palette.charcoal,
    background: Palette.canvas,
    tint: Palette.mangoDark,
    surface: Palette.surface,
    border: Palette.border,
    icon: Palette.mangoDark,
    tabIconDefault: Palette.muted,
    tabIconSelected: Palette.mangoDark,
  },
};

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
};
