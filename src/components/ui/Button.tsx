import React from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Typography } from "./Typography";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { springs } from "../../theme/animations";
import { useHaptics } from "../../hooks/useHaptics";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantStyles: Record<ButtonVariant, { bg: string; border?: string; text: string }> = {
  primary: { bg: colors.accent.blue, text: colors.base[950] },
  secondary: { bg: colors.glass.light, border: colors.glass.border, text: colors.base[50] },
  ghost: { bg: colors.transparent, text: colors.base[200] },
  danger: { bg: colors.semantic.dangerMuted, border: colors.semantic.danger, text: colors.semantic.danger },
};

const sizeStyles: Record<ButtonSize, { height: number; px: number; textVariant: "caption" | "body" | "bodyMedium" }> = {
  sm: { height: 36, px: 14, textVariant: "caption" },
  md: { height: 48, px: 20, textVariant: "body" },
  lg: { height: 56, px: 24, textVariant: "bodyMedium" },
};

export const Button = React.memo<ButtonProps>(
  ({
    variant = "primary",
    size = "md",
    label,
    loading = false,
    icon,
    fullWidth = false,
    style: styleProp,
    onPress,
    disabled,
    ...props
  }) => {
    const scale = useSharedValue(1);
    const haptics = useHaptics();
    const vs = variantStyles[variant];
    const ss = sizeStyles[size];

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.96, springs.snappy);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, springs.snappy);
    };

    const handlePress = (e: any) => {
      haptics.light();
      onPress?.(e);
    };

    return (
      <AnimatedPressable
        style={[
          animatedStyle,
          styles.base,
          {
            height: ss.height,
            paddingHorizontal: ss.px,
            backgroundColor: vs.bg,
            borderColor: vs.border,
            borderWidth: vs.border ? 1 : 0,
            borderRadius: radius.xl,
            alignSelf: fullWidth ? "stretch" : "flex-start",
            opacity: disabled ? 0.4 : 1,
          },
          styleProp,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={vs.text} />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Typography
              variant={ss.textVariant}
              style={{ color: vs.text, fontWeight: "600" }}
            >
              {label}
            </Typography>
          </>
        )}
      </AnimatedPressable>
    );
  }
);

Button.displayName = "Button";

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
});
