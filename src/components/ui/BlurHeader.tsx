import React from "react";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";

interface BlurHeaderProps {
  children: React.ReactNode;
  paddingBottom?: number;
  intensity?: number;
  showGradient?: boolean;
}

export const BlurHeader = React.memo<BlurHeaderProps>(
  ({ children, paddingBottom = 16, intensity = 30, showGradient = true }) => {
    const insets = useSafeAreaInsets();

    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom }]}>
        <BlurView
          intensity={intensity}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        {showGradient && (
          <LinearGradient
            colors={[colors.base[900], "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[StyleSheet.absoluteFill, styles.overlay]} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }
);

BlurHeader.displayName = "BlurHeader";

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 50,
  },
  overlay: {
    backgroundColor: "rgba(15, 17, 21, 0.6)",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
