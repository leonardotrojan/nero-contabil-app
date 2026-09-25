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
import { useRegister } from "../../src/hooks/auth/useRegister";
import { useHaptics } from "../../src/hooks/useHaptics";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { isLoading, error, execute: register, clearError } = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const isValid =
    name.trim().length >= 2 &&
    email.trim().includes("@") &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async () => {
    if (!isValid) return;
    haptics.light();
    const ok = await register(name, email, password);
    if (ok) haptics.success();
    else haptics.error();
  };

  const handleGoLogin = () => {
    clearError();
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.base[950] }]}>
      {/* Background glows */}
      <Animated.View entering={FadeIn.duration(800)} style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with back button */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <Pressable
              onPress={handleGoLogin}
              style={styles.backButton}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Typography variant="body" color="tertiary" style={{ fontSize: 20 }}>
                ←
              </Typography>
            </Pressable>
          </Animated.View>

          {/* Brand */}
          <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.brand}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={[colors.accent.purple, colors.accent.blue]}
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
              variant="h2"
              color="primary"
              style={{ letterSpacing: -0.5, marginTop: 16 }}
            >
              Criar conta
            </Typography>
            <Typography variant="body" color="tertiary" style={{ marginTop: 6 }}>
              Comece a controlar suas finanças agora
            </Typography>
          </Animated.View>

          {/* Form card */}
          <Animated.View entering={FadeInUp.duration(500).delay(180)} style={styles.card}>
            <BlurView intensity={8} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.cardBg]} />
            <View style={[StyleSheet.absoluteFill, styles.cardBorder]} />

            <View style={styles.cardContent}>
              <View style={styles.fields}>
                <Input
                  label="Nome"
                  placeholder="Seu nome"
                  value={name}
                  onChangeText={(v) => { setName(v); clearError(); }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  leftIcon={
                    <Typography variant="body" color="tertiary" style={styles.fieldIcon}>
                      ◎
                    </Typography>
                  }
                />

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
                  placeholder="Mínimo 6 caracteres"
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
                />

                <Input
                  label="Confirmar senha"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); clearError(); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={
                    <Typography variant="body" color="tertiary" style={styles.fieldIcon}>
                      ⊙
                    </Typography>
                  }
                  error={
                    passwordMismatch ? "As senhas não coincidem" : error ?? undefined
                  }
                />
              </View>

              <Button
                label="Criar conta"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                onPress={handleRegister}
                disabled={!isValid}
                style={{ marginTop: 8 }}
              />
            </View>
          </Animated.View>

          {/* Login link */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.footer}>
            <Typography variant="body" color="tertiary">
              Já tem conta?
            </Typography>
            <Pressable
              onPress={handleGoLogin}
              accessible
              accessibilityRole="link"
              accessibilityLabel="Entrar"
            >
              <Typography
                variant="bodyMedium"
                style={{ color: colors.accent.blue }}
              >
                {" "}Entrar →
              </Typography>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const GLOW_SIZE = 300;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  glowTopLeft: {
    position: "absolute",
    top: -GLOW_SIZE / 3,
    left: -GLOW_SIZE / 4,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: colors.accent.purple,
    opacity: 0.07,
  },
  glowBottomRight: {
    position: "absolute",
    bottom: -GLOW_SIZE / 3,
    right: -GLOW_SIZE / 4,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: colors.accent.blue,
    opacity: 0.06,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingH,
    gap: 32,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },

  // Brand
  brand: {
    alignItems: "center",
  },
  logoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 18,
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
    paddingBottom: 8,
  },
});
