import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Typography } from "../../src/components/ui/Typography";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { colors } from "../../src/theme/colors";
import { radius, layout } from "../../src/theme/spacing";
import { shadows } from "../../src/theme/shadows";
import { useLogin } from "../../src/hooks/auth/useLogin";
import { useHaptics } from "../../src/hooks/useHaptics";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { isLoading, error, execute: login, clearError } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isValid = email.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid) return;
    haptics.light();
    const ok = await login(email, password);
    if (ok) haptics.success();
    else haptics.error();
  };

  const handleGoRegister = () => {
    clearError();
    router.push("/auth/register" as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.base[950] }]}>
      {/* Background glow */}
      <Animated.View entering={FadeIn.duration(800)} style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.brand}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={[colors.accent.blue, colors.accent.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Typography
                variant="h2"
                style={{ color: colors.base[50], fontWeight: "800", letterSpacing: -0.5 }}
              >
                N
              </Typography>
            </View>

            <Typography
              variant="h1"
              color="primary"
              style={{ letterSpacing: -1, marginTop: 20 }}
            >
              NERO
            </Typography>
            <Typography variant="body" color="tertiary" style={{ marginTop: 6 }}>
              Controle inteligente das suas finanças
            </Typography>
          </Animated.View>

          {/* Form card */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.card}>
            <BlurView intensity={8} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.cardBg]} />
            <View style={[StyleSheet.absoluteFill, styles.cardBorder]} />

            <View style={styles.cardContent}>
              <Typography variant="h3" color="primary" style={{ marginBottom: 24 }}>
                Entrar
              </Typography>

              <View style={styles.fields}>
                <Input
                  label="E-mail"
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={(v) => { setEmail(v); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={
                    <Typography variant="body" color="tertiary" style={styles.fieldIcon}>
                      ✉
                    </Typography>
                  }
                />

                <Input
                  label="Senha"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError(); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={
                    <Typography variant="body" color="tertiary" style={styles.fieldIcon}>
                      ⊙
                    </Typography>
                  }
                  rightIcon={
                    <Typography variant="captionMedium" color="tertiary">
                      {showPassword ? "Ocultar" : "Ver"}
                    </Typography>
                  }
                  onRightIconPress={() => setShowPassword((v) => !v)}
                  error={error ?? undefined}
                />
              </View>

              <Button
                label="Entrar"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                onPress={handleLogin}
                disabled={!isValid}
                style={{ marginTop: 8 }}
              />
            </View>
          </Animated.View>

          {/* Register link */}
          <Animated.View entering={FadeInUp.duration(400).delay(320)} style={styles.footer}>
            <Typography variant="body" color="tertiary">
              Ainda não tem conta?
            </Typography>
            <Pressable
              onPress={handleGoRegister}
              accessible
              accessibilityRole="link"
              accessibilityLabel="Criar conta"
            >
              <Typography
                variant="bodyMedium"
                style={{ color: colors.accent.blue }}
              >
                {" "}Criar conta →
              </Typography>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const GLOW_SIZE = 320;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  glowTop: {
    position: "absolute",
    top: -GLOW_SIZE / 3,
    left: "50%",
    marginLeft: -GLOW_SIZE / 2,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: colors.accent.blue,
    opacity: 0.07,
  },
  glowBottom: {
    position: "absolute",
    bottom: -GLOW_SIZE / 2,
    right: -GLOW_SIZE / 4,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: colors.accent.purple,
    opacity: 0.06,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingH,
    gap: 40,
  },

  // Brand
  brand: {
    alignItems: "center",
    paddingTop: 24,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // Card
  card: {
    borderRadius: radius["2xl"],
    overflow: "hidden",
  },
  cardBg: {
    backgroundColor: colors.glass.light,
  },
  cardBorder: {
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  cardContent: {
    padding: 24,
  },
  fields: {
    gap: 16,
    marginBottom: 8,
  },
  fieldIcon: {
    fontSize: 16,
    lineHeight: 20,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
