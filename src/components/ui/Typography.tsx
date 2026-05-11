import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { textStyles } from "../../theme/typography";

type Variant =
  | "heroBalance"
  | "largeBalance"
  | "balance"
  | "amount"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyMedium"
  | "caption"
  | "captionMedium"
  | "label";

type ColorVariant = "primary" | "secondary" | "tertiary" | "accent" | "blue" | "purple" | "mint" | "danger" | "warning";

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: ColorVariant | string;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
}

const colorMap: Record<ColorVariant, string> = {
  primary: colors.base[50],
  secondary: colors.base[200],
  tertiary: colors.base[300],
  accent: colors.accent.blue,
  blue: colors.accent.blue,
  purple: colors.accent.purple,
  mint: colors.accent.mint,
  danger: colors.semantic.danger,
  warning: colors.semantic.warning,
};

export const Typography = React.memo<TypographyProps>(
  ({ variant = "body", color = "primary", align, style, children, ...props }) => {
    const textColor =
      color in colorMap ? colorMap[color as ColorVariant] : color;

    return (
      <Text
        style={[
          textStyles[variant],
          { color: textColor },
          align ? { textAlign: align } : undefined,
          style,
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

Typography.displayName = "Typography";
