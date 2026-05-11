import { Platform } from "react-native";

const fontFamilies = {
  sans: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
};

export const typography = {
  fonts: fontFamilies,
  sizes: {
    "2xs": 10,
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 34,
    "5xl": 42,
    "6xl": 56,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  letterSpacings: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    mono: -0.5,
  },
} as const;

export const textStyles = {
  heroBalance: {
    fontFamily: fontFamilies.mono,
    fontSize: typography.sizes["5xl"],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.mono,
  },
  largeBalance: {
    fontFamily: fontFamilies.mono,
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.mono,
  },
  balance: {
    fontFamily: fontFamilies.mono,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacings.mono,
  },
  amount: {
    fontFamily: fontFamilies.mono,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    letterSpacing: typography.letterSpacings.mono,
  },
  h1: {
    fontSize: typography.sizes["3xl"],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.tight,
  },
  h2: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacings.tight,
  },
  h3: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
  },
  bodyMedium: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  caption: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
  },
  captionMedium: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    letterSpacing: typography.letterSpacings.wide,
    textTransform: "uppercase" as const,
  },
} as const;
