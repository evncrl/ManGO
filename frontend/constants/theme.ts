/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Palette = {
  deepObsidian: '#1F2937',
  linenWhite: '#FAFAF8',
  warmCopper: '#C2410C',
  mutedSage: '#10B981',
  charcoalEspresso: '#4B5563',
  stoneGray: '#E5E7EB',
  white: '#FFFFFF',
  slate: '#6B7280',
};

export const Colors = {
  light: {
    text: Palette.deepObsidian,
    background: Palette.linenWhite,
    tint: Palette.warmCopper,
    surface: Palette.white,
    border: Palette.stoneGray,
    icon: Palette.warmCopper,
    tabIconDefault: Palette.mutedSage,
    tabIconSelected: Palette.warmCopper,
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: Palette.warmCopper,
    surface: '#1F2937',
    border: '#374151',
    icon: '#F9FAFB',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: Palette.warmCopper,
  },
};

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
};
