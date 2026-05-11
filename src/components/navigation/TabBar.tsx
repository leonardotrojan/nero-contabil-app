import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "../../theme/colors";
import { shadows } from "../../theme/shadows";
import { springs, durations } from "../../theme/animations";
import { useHaptics } from "../../hooks/useHaptics";

const TAB_ICONS: Record<string, { default: string; active: string }> = {
  index: { default: "⌂", active: "⌂" },
  activity: { default: "◷", active: "◷" },
  add: { default: "+", active: "+" },
  insights: { default: "◈", active: "◈" },
  objectives: { default: "◎", active: "◎" },
  system: { default: "⊙", active: "⊙" },
};

const TAB_LABELS: Record<string, string> = {
  index: "Home",
  activity: "Fluxo",
  add: "Adicionar",
  insights: "Insights",
  objectives: "Objetivos",
  system: "Sistema",
};

interface TabItemProps {
  name: string;
  isFocused: boolean;
  isAddButton?: boolean;
  onPress: () => void;
}

const TabItem = React.memo<TabItemProps>(({ name, isFocused, isAddButton, onPress }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0.4);
  const haptics = useHaptics();

  const handlePress = () => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, springs.bouncy);
    });
    haptics.selection();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isAddButton ? 1 : withTiming(isFocused ? 1 : 0.45, { duration: durations.fast }),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused && !isAddButton ? 1 : 0, { duration: durations.fast }),
    transform: [
      { scale: withTiming(isFocused && !isAddButton ? 1 : 0.5, { duration: durations.normal }) },
    ],
  }));

  if (isAddButton) {
    return (
      <Pressable onPress={handlePress} style={styles.addButtonWrapper} accessible accessibilityRole="button" accessibilityLabel="Adicionar">
        <Animated.View style={[styles.addButton, animatedStyle]}>
          <View style={styles.addButtonInner}>
            <Animated.Text style={styles.addIcon}>+</Animated.Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.tabItem} accessible accessibilityRole="tab">
      <Animated.View style={[styles.tabInner, animatedStyle]}>
        <Animated.Text
          style={[
            styles.tabIcon,
            isFocused && { color: colors.accent.blue },
          ]}
        >
          {TAB_ICONS[name]?.default ?? "●"}
        </Animated.Text>
      </Animated.View>
      <Animated.View style={[styles.dot, dotStyle]} />
    </Pressable>
  );
});

TabItem.displayName = "TabItem";

export const TabBar = React.memo<BottomTabBarProps>(({ state, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.bg]} />
      <View style={styles.border} />

      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isAdd = route.name === "add";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              name={route.name}
              isFocused={isFocused}
              isAddButton={isAdd}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
});

TabBar.displayName = "TabBar";

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bg: {
    backgroundColor: "rgba(15, 17, 21, 0.85)",
  },
  border: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glass.border,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 60,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    gap: 4,
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    fontSize: 20,
    color: colors.base[300],
    lineHeight: 26,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.blue,
  },
  addButtonWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  addButtonInner: {
    flex: 1,
    backgroundColor: colors.accent.blue,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    ...shadows.blue,
  },
  addIcon: {
    fontSize: 24,
    color: colors.base[950],
    fontWeight: "300",
    lineHeight: 30,
  },
});
