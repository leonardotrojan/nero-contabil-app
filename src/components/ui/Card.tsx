import React from "react";
import { Pressable, StyleSheet, View, ViewProps } from "react-native";
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

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  borderColor?: string;
  backgroundColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card = React.memo<CardProps>(
  ({
    children,
    onPress,
    padding = 20,
    borderColor = colors.glass.border,
    backgroundColor = colors.base[800],
    style,
    ...props
  }) => {
    const scale = useSharedValue(1);
    const haptics = useHaptics();

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    if (!onPress) {
      return (
        <View
          style={[
            styles.base,
            { padding, backgroundColor, borderColor },
            shadows.md,
            style,
          ]}
          {...props}
        >
          {children}
        </View>
      );
    }

    return (
      <AnimatedPressable
        style={[
          animatedStyle,
          styles.base,
          { padding, backgroundColor, borderColor },
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
        {children}
      </AnimatedPressable>
    );
  }
);

Card.displayName = "Card";

const styles = StyleSheet.create({
  base: {
    borderRadius: radius["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
});
