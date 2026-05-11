import React from "react";
import { ScrollView, View, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/spacing";

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  paddingHorizontal?: number;
  paddingTop?: number;
  paddingBottom?: number;
  backgroundColor?: string;
}

export const ScreenContainer = React.memo<ScreenContainerProps>(
  ({
    children,
    scrollable = true,
    refreshing = false,
    onRefresh,
    paddingHorizontal = layout.screenPaddingH,
    paddingTop = 0,
    paddingBottom = 100,
    backgroundColor = colors.base[950],
  }) => {
    const insets = useSafeAreaInsets();

    if (!scrollable) {
      return (
        <View
          style={[
            styles.container,
            {
              backgroundColor,
              paddingTop: insets.top + paddingTop,
              paddingBottom: insets.bottom + paddingBottom,
              paddingHorizontal,
            },
          ]}
        >
          {children}
        </View>
      );
    }

    return (
      <ScrollView
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={{
          paddingTop: insets.top + paddingTop,
          paddingBottom: insets.bottom + paddingBottom,
          paddingHorizontal,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.blue}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }
);

ScreenContainer.displayName = "ScreenContainer";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
