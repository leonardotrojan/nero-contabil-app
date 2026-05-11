import React from "react";
import { StyleSheet, View, ViewProps, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { springs } from "../../theme/animations";
import { shadows } from "../../theme/shadows";
import { useHaptics } from "../../hooks/useHaptics";

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  intensity?: number;
  tint?: "dark" | "default" | "light" | "systemMaterial" | "systemChromeMaterial";
  borderColor?: string;
  borderRadius?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GlassCard = React.memo<GlassCardProps>(
  ({
    children,
    onPress,
    padding = 20,
    intensity = 20,
    tint = "dark",
    borderColor = colors.glass.borderLight,
    borderRadius = radius["2xl"],
    style,
    ...props
  }) => {
    const scale = useSharedValue(1);
    const haptics = useHaptics();

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const inner = (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[styles.blur, { borderRadius, borderColor, padding }]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.glass.light, borderRadius },
          ]}
        />
        {children}
      </BlurView>
    );

    if (!onPress) {
      return (
        <View
          style={[
            { borderRadius, overflow: "hidden" },
            shadows.md,
            style,
          ]}
          {...props}
        >
          {inner}
        </View>
      );
    }

    return (
      <AnimatedPressable
        style={[
          animatedStyle,
          { borderRadius, overflow: "hidden" },
          shadows.md,
          style,
        ]}
        onPressIn={() => {
          scale.value = withSpring(0.97, springs.snappy);
          haptics.light();
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.gentle);
        }}
        onPress={onPress}
        accessible
        accessibilityRole="button"
      >
        {inner}
      </AnimatedPressable>
    );
  }
);

GlassCard.displayName = "GlassCard";

const styles = StyleSheet.create({
  blur: {
    borderWidth: 1,
    overflow: "hidden",
  },
});
