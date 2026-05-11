import React, { useState, useRef } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  Pressable,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Typography } from "./Typography";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { durations } from "../../theme/animations";

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input = React.memo<InputProps>(
  ({
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    style,
    ...props
  }) => {
    const [focused, setFocused] = useState(false);
    const borderColor = useSharedValue<string>(colors.glass.border);

    const borderStyle = useAnimatedStyle(() => ({
      borderColor: borderColor.value,
    }));

    const handleFocus = (e: any) => {
      setFocused(true);
      borderColor.value = withTiming(colors.accent.blue, { duration: durations.fast });
      props.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setFocused(false);
      borderColor.value = withTiming(
        error ? colors.semantic.danger : colors.glass.border,
        { duration: durations.fast }
      );
      props.onBlur?.(e);
    };

    return (
      <View style={styles.wrapper}>
        {label && (
          <Typography variant="label" color="tertiary" style={styles.label}>
            {label}
          </Typography>
        )}
        <Animated.View
          style={[
            styles.container,
            borderStyle,
            error ? { borderColor: colors.semantic.danger } : undefined,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            style={[
              styles.input,
              leftIcon ? { paddingLeft: 0 } : undefined,
              style,
            ]}
            placeholderTextColor={colors.base[400]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor={colors.accent.blue}
            {...props}
          />
          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.rightIcon}
              accessible
              accessibilityRole="button"
            >
              {rightIcon}
            </Pressable>
          )}
        </Animated.View>
        {(hint || error) && (
          <Typography
            variant="caption"
            color={error ? "danger" : "tertiary"}
            style={styles.hint}
          >
            {error ?? hint}
          </Typography>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    marginBottom: -2,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.base[800],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.base[50],
    fontWeight: "400",
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  hint: {
    marginTop: -2,
  },
});
