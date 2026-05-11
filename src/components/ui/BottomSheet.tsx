import React, { useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { springs, durations } from "../../theme/animations";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapHeight?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const BottomSheet = React.memo<BottomSheetProps>(
  ({ isOpen, onClose, children, snapHeight = SCREEN_HEIGHT * 0.6 }) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(snapHeight);
    const backdropOpacity = useSharedValue(0);

    useEffect(() => {
      if (isOpen) {
        translateY.value = withSpring(0, springs.gentle);
        backdropOpacity.value = withTiming(1, { duration: durations.normal });
      } else {
        translateY.value = withSpring(snapHeight, springs.snappy);
        backdropOpacity.value = withTiming(0, { duration: durations.fast });
      }
    }, [isOpen, snapHeight]);

    const dismiss = useCallback(() => {
      translateY.value = withSpring(snapHeight, springs.snappy);
      backdropOpacity.value = withTiming(0, { duration: durations.fast }, () => {
        runOnJS(onClose)();
      });
    }, [onClose, snapHeight]);

    const panGesture = Gesture.Pan()
      .onUpdate((e) => {
        if (e.translationY > 0) {
          translateY.value = e.translationY;
        }
      })
      .onEnd((e) => {
        if (e.translationY > snapHeight * 0.3 || e.velocityY > 500) {
          runOnJS(dismiss)();
        } else {
          translateY.value = withSpring(0, springs.gentle);
        }
      });

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    return (
      <>
        <AnimatedPressable
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
          pointerEvents={isOpen ? "auto" : "none"}
          onPress={dismiss}
        />
        <Animated.View style={[styles.sheet, { height: snapHeight }, sheetStyle]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.sheetBg]} />
          <GestureDetector gesture={panGesture}>
            <View style={styles.handle}>
              <View style={styles.handleBar} />
            </View>
          </GestureDetector>
          <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
            {children}
          </View>
        </Animated.View>
      </>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(5, 5, 5, 0.7)",
    zIndex: 80,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radius["3xl"],
    borderTopRightRadius: radius["3xl"],
    overflow: "hidden",
    zIndex: 90,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderBottomWidth: 0,
  },
  sheetBg: {
    backgroundColor: colors.base[850],
    borderTopLeftRadius: radius["3xl"],
    borderTopRightRadius: radius["3xl"],
  },
  handle: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.base[600],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
