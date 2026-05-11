import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  FadeIn,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "../../src/components/ui/ScreenContainer";
import { Typography } from "../../src/components/ui/Typography";
import { Button } from "../../src/components/ui/Button";
import { BottomSheet } from "../../src/components/ui/BottomSheet";
import { colors } from "../../src/theme/colors";
import { layout, radius } from "../../src/theme/spacing";
import { useObjectiveStore } from "../../src/stores/objectiveStore";
import { useHaptics } from "../../src/hooks/useHaptics";
import { formatCurrency } from "../../src/utils/currency";
import type { Objective } from "../../src/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_OPTIONS = ["🎯", "✈️", "🏠", "🚗", "💻", "📚", "👟", "👓", "🛡️", "💍", "🎸", "🌍", "🏋️", "🎓", "💰", "🌴"];

const COLOR_OPTIONS = [
  colors.accent.blue,
  colors.accent.purple,
  colors.accent.mint,
  colors.semantic.danger,
  colors.semantic.warning,
  "#FF9F7A",
  "#7A9FF5",
  "#C084FC",
];

const DEADLINE_OPTIONS: { label: string; days: number | null }[] = [
  { label: "Sem prazo", days: null },
  { label: "1 mês", days: 30 },
  { label: "3 meses", days: 90 },
  { label: "6 meses", days: 180 },
  { label: "1 ano", days: 365 },
  { label: "2 anos", days: 730 },
];

// ─── ObjectiveCard ─────────────────────────────────────────────────────────────

interface ObjectiveCardProps {
  objective: Objective;
  index: number;
  onContribute: (id: string) => void;
}

const ObjectiveCard = React.memo<ObjectiveCardProps>(({ objective, index, onContribute }) => {
  const progress = Math.min(objective.currentAmount / objective.targetAmount, 1);
  const progressWidth = useSharedValue(0);
  const haptics = useHaptics();

  useEffect(() => {
    const timeout = setTimeout(() => {
      progressWidth.value = withSpring(progress, { damping: 18, stiffness: 80 });
    }, 200 + index * 80);
    return () => clearTimeout(timeout);
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as any,
  }));

  const daysToDeadline = objective.deadline
    ? Math.ceil((new Date(objective.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const isComplete = progress >= 1;
  const remaining = objective.targetAmount - objective.currentAmount;

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(80 + index * 90).springify()}
      style={[styles.card, { borderColor: objective.color + "30" }]}
    >
      {/* Subtle color wash */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: objective.color + "08", borderRadius: radius["2xl"] },
        ]}
      />

      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: objective.color + "20" }]}>
          <Typography variant="body" style={{ fontSize: 24, lineHeight: 30 }}>
            {objective.icon}
          </Typography>
        </View>

        <View style={styles.cardHeaderRight}>
          {isComplete && (
            <View style={[styles.statusPill, { backgroundColor: colors.accent.mintMuted, borderColor: colors.accent.mint + "60" }]}>
              <Typography variant="label" color="mint">Concluído ✓</Typography>
            </View>
          )}
          {daysToDeadline !== null && !isComplete && (
            <View style={[styles.statusPill, {
              borderColor: daysToDeadline < 30 ? colors.semantic.warning + "60" : objective.color + "40",
              backgroundColor: daysToDeadline < 30 ? colors.semantic.warningMuted : objective.color + "10",
            }]}>
              <Typography
                variant="label"
                style={{ color: daysToDeadline < 30 ? colors.semantic.warning : objective.color }}
              >
                {daysToDeadline}d restantes
              </Typography>
            </View>
          )}
        </View>
      </View>

      {/* Title */}
      <Typography variant="h3" color="primary">{objective.title}</Typography>

      {/* Amounts */}
      <View style={styles.amounts}>
        <Typography variant="balance" style={{ color: objective.color }}>
          {formatCurrency(objective.currentAmount, true)}
        </Typography>
        <Typography variant="captionMedium" color="tertiary">
          de {formatCurrency(objective.targetAmount, true)}
        </Typography>
      </View>

      {/* Progress bar */}
      <View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { backgroundColor: objective.color }, progressStyle]}
          />
          {/* Glow effect at end of progress */}
          <Animated.View
            style={[
              styles.progressGlow,
              { backgroundColor: objective.color },
              useAnimatedStyle(() => ({
                left: `${Math.max(progressWidth.value * 100 - 2, 0)}%` as any,
                opacity: progressWidth.value > 0.05 ? 1 : 0,
              })),
            ]}
          />
        </View>
        <View style={styles.progressFooter}>
          <Typography variant="captionMedium" color="tertiary">
            {Math.round(progress * 100)}% concluído
          </Typography>
          {!isComplete && (
            <Typography variant="caption" color="tertiary">
              Faltam {formatCurrency(remaining, true)}
            </Typography>
          )}
        </View>
      </View>

      {/* Contribute button */}
      {!isComplete && (
        <Pressable
          onPress={() => {
            haptics.light();
            onContribute(objective.id);
          }}
          style={[styles.contributeBtn, { borderColor: objective.color + "50" }]}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Contribuir para ${objective.title}`}
        >
          <Typography variant="captionMedium" style={{ color: objective.color }}>
            ↑ Contribuir
          </Typography>
        </Pressable>
      )}
    </Animated.View>
  );
});

ObjectiveCard.displayName = "ObjectiveCard";

// ─── Main Screen ────────────────────────────────────────────────────────────────

export default function ObjectivesScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { objectives, addObjective, contribute } = useObjectiveStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [contributeTargetId, setContributeTargetId] = useState<string | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🎯");
  const [selectedColor, setSelectedColor] = useState<string>(colors.accent.blue);
  const [selectedDeadlineDays, setSelectedDeadlineDays] = useState<number | null>(null);

  // Contribute form state
  const [contributeAmount, setContributeAmount] = useState("");

  const resetCreateForm = () => {
    setTitle("");
    setTargetAmount("");
    setSelectedIcon("🎯");
    setSelectedColor(colors.accent.blue);
    setSelectedDeadlineDays(null);
  };

  const handleCreate = () => {
    const parsed = parseFloat(targetAmount.replace(",", "."));
    if (!title.trim() || !parsed) return;

    haptics.success();
    addObjective({
      title: title.trim(),
      targetAmount: parsed,
      currentAmount: 0,
      deadline: selectedDeadlineDays
        ? new Date(Date.now() + selectedDeadlineDays * 86400000).toISOString()
        : undefined,
      icon: selectedIcon,
      color: selectedColor,
    });
    resetCreateForm();
    setIsCreateOpen(false);
  };

  const handleContribute = () => {
    const parsed = parseFloat(contributeAmount.replace(",", "."));
    if (!contributeTargetId || !parsed) return;

    haptics.success();
    contribute(contributeTargetId, parsed);
    setContributeAmount("");
    setContributeTargetId(null);
  };

  const totalTarget = objectives.reduce((s, o) => s + o.targetAmount, 0);
  const totalCurrent = objectives.reduce((s, o) => s + o.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? totalCurrent / totalTarget : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.base[950] }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View>
            <Typography variant="h1" color="primary">Objetivos</Typography>
            <Typography variant="caption" color="tertiary" style={{ marginTop: 2 }}>
              {objectives.length} objetivo{objectives.length !== 1 ? "s" : ""} ativos
            </Typography>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => {
              haptics.light();
              setIsCreateOpen(true);
            }}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Novo objetivo"
          >
            <Typography variant="h3" color="primary" style={{ lineHeight: 28 }}>+</Typography>
          </Pressable>
        </View>

        {/* Summary strip */}
        {objectives.length > 0 && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.summaryStrip}>
            <View style={styles.summaryStat}>
              <Typography variant="caption" color="tertiary">Acumulado</Typography>
              <Typography variant="amount" color="mint">
                {formatCurrency(totalCurrent, true)}
              </Typography>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Typography variant="caption" color="tertiary">Total almejado</Typography>
              <Typography variant="amount" color="secondary">
                {formatCurrency(totalTarget, true)}
              </Typography>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Typography variant="caption" color="tertiary">Progresso geral</Typography>
              <Typography variant="amount" color="blue">
                {Math.round(overallProgress * 100)}%
              </Typography>
            </View>
          </Animated.View>
        )}

        {/* List */}
        <ScreenContainer paddingTop={16} paddingHorizontal={layout.screenPaddingH}>
          {objectives.length === 0 && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
              <Typography variant="body" style={{ fontSize: 40, textAlign: "center" }}>◎</Typography>
              <Typography variant="h3" color="primary" align="center">Nenhum objetivo ainda</Typography>
              <Typography variant="body" color="tertiary" align="center" style={{ lineHeight: 22 }}>
                Crie seu primeiro objetivo e comece a construir seu futuro financeiro.
              </Typography>
              <Button
                label="Criar primeiro objetivo"
                variant="secondary"
                size="md"
                onPress={() => setIsCreateOpen(true)}
              />
            </Animated.View>
          )}

          {objectives.map((obj, i) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              index={i}
              onContribute={(id) => {
                setContributeTargetId(id);
                setContributeAmount("");
              }}
            />
          ))}
        </ScreenContainer>

        {/* ── Create Objective Bottom Sheet ── */}
        <BottomSheet
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); resetCreateForm(); }}
          snapHeight={680}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <Typography variant="h2" color="primary" style={styles.sheetTitle}>
              Novo objetivo
            </Typography>

            {/* Icon + Color preview */}
            <View style={styles.previewRow}>
              <View style={[styles.previewCircle, { backgroundColor: selectedColor + "25", borderColor: selectedColor + "50" }]}>
                <Typography variant="body" style={{ fontSize: 36 }}>{selectedIcon}</Typography>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Typography variant="captionMedium" color={title ? "primary" : "tertiary"} style={{ fontSize: 18 }}>
                  {title || "Nome do objetivo"}
                </Typography>
                {targetAmount ? (
                  <Typography variant="caption" color="tertiary">
                    Meta: {formatCurrency(parseFloat(targetAmount.replace(",", ".")) || 0)}
                  </Typography>
                ) : null}
              </View>
            </View>

            {/* Title */}
            <View style={styles.formField}>
              <Typography variant="label" color="tertiary" style={styles.formLabel}>Nome</Typography>
              <View style={styles.inputBox}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="ex: Viagem para Lisboa..."
                  placeholderTextColor={colors.base[500]}
                  style={styles.sheetInput}
                  selectionColor={selectedColor}
                  accessible
                  accessibilityLabel="Nome do objetivo"
                />
              </View>
            </View>

            {/* Target amount */}
            <View style={styles.formField}>
              <Typography variant="label" color="tertiary" style={styles.formLabel}>Valor alvo</Typography>
              <View style={styles.amountInputRow}>
                <Typography variant="h3" color="tertiary" style={{ lineHeight: 36 }}>R$</Typography>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor={colors.base[600]}
                  style={[styles.sheetAmountInput, { color: selectedColor }]}
                  selectionColor={selectedColor}
                  accessible
                  accessibilityLabel="Valor alvo"
                />
              </View>
              <View style={[styles.amountDivider, { backgroundColor: selectedColor + "40" }]} />
            </View>

            {/* Icon picker */}
            <View style={styles.formField}>
              <Typography variant="label" color="tertiary" style={styles.formLabel}>Ícone</Typography>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((icon) => (
                  <Pressable
                    key={icon}
                    onPress={() => { haptics.selection(); setSelectedIcon(icon); }}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && {
                        backgroundColor: selectedColor + "25",
                        borderColor: selectedColor + "70",
                      },
                    ]}
                    accessible
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedIcon === icon }}
                  >
                    <Typography variant="body" style={{ fontSize: 22 }}>{icon}</Typography>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Color picker */}
            <View style={styles.formField}>
              <Typography variant="label" color="tertiary" style={styles.formLabel}>Cor</Typography>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => { haptics.selection(); setSelectedColor(color); }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorSwatchActive,
                    ]}
                    accessible
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedColor === color }}
                  />
                ))}
              </View>
            </View>

            {/* Deadline */}
            <View style={styles.formField}>
              <Typography variant="label" color="tertiary" style={styles.formLabel}>Prazo</Typography>
              <View style={styles.deadlineRow}>
                {DEADLINE_OPTIONS.map((opt) => {
                  const isActive = selectedDeadlineDays === opt.days;
                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => { haptics.selection(); setSelectedDeadlineDays(opt.days); }}
                      style={[
                        styles.deadlineChip,
                        isActive && {
                          backgroundColor: selectedColor + "20",
                          borderColor: selectedColor + "60",
                        },
                      ]}
                      accessible
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Typography
                        variant="captionMedium"
                        style={{ color: isActive ? selectedColor : colors.base[400] }}
                      >
                        {opt.label}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save */}
            <Button
              label="Criar objetivo"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleCreate}
              disabled={!title.trim() || !parseFloat(targetAmount.replace(",", "."))}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </BottomSheet>

        {/* ── Contribute Bottom Sheet ── */}
        {contributeTargetId && (() => {
          const obj = objectives.find((o) => o.id === contributeTargetId);
          if (!obj) return null;
          return (
            <BottomSheet
              isOpen={!!contributeTargetId}
              onClose={() => { setContributeTargetId(null); setContributeAmount(""); }}
              snapHeight={340}
            >
              <View style={styles.contributeSheet}>
                <View style={styles.contributeHeader}>
                  <Typography variant="body" style={{ fontSize: 28 }}>{obj.icon}</Typography>
                  <View>
                    <Typography variant="h3" color="primary">{obj.title}</Typography>
                    <Typography variant="caption" color="tertiary">
                      {formatCurrency(obj.currentAmount, true)} / {formatCurrency(obj.targetAmount, true)}
                    </Typography>
                  </View>
                </View>

                <View style={styles.amountInputRow}>
                  <Typography variant="h2" color="tertiary" style={{ lineHeight: 52 }}>R$</Typography>
                  <TextInput
                    value={contributeAmount}
                    onChangeText={setContributeAmount}
                    keyboardType="numeric"
                    placeholder="0,00"
                    autoFocus
                    placeholderTextColor={colors.base[600]}
                    style={[styles.contributeAmountInput, { color: obj.color }]}
                    selectionColor={obj.color}
                    accessible
                    accessibilityLabel="Valor da contribuição"
                  />
                </View>
                <View style={[styles.amountDivider, { backgroundColor: obj.color + "40" }]} />

                <Button
                  label="Confirmar contribuição"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={handleContribute}
                  disabled={!parseFloat(contributeAmount.replace(",", "."))}
                  style={{ marginTop: 20 }}
                />
              </View>
            </BottomSheet>
          );
        })()}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.blueMuted,
    borderWidth: 1,
    borderColor: colors.accent.blue + "50",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryStrip: {
    flexDirection: "row",
    marginHorizontal: layout.screenPaddingH,
    marginTop: 16,
    backgroundColor: colors.base[800],
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: "hidden",
  },
  summaryStat: {
    flex: 1,
    padding: 14,
    gap: 4,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.glass.border,
    marginVertical: 10,
  },

  emptyState: {
    alignItems: "center",
    gap: 16,
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: colors.base[800],
    borderRadius: radius["2xl"],
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    gap: 14,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderRight: {
    flexDirection: "row",
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  amounts: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  progressTrack: {
    height: 5,
    backgroundColor: colors.base[700],
    borderRadius: 3,
    overflow: "hidden",
    flexDirection: "row",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressGlow: {
    position: "absolute",
    width: 4,
    height: "100%",
    borderRadius: 2,
    opacity: 0.8,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  contributeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignSelf: "flex-start",
    backgroundColor: "transparent",
  },

  /* Bottom sheet */
  sheetContent: {
    gap: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sheetTitle: {
    marginBottom: -8,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.base[700],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: 14,
  },
  previewCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  formField: {
    gap: 12,
  },
  formLabel: {},
  inputBox: {
    backgroundColor: colors.base[700],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "center",
  },
  sheetInput: {
    fontSize: 16,
    color: colors.base[50],
    padding: 0,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  sheetAmountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: -0.5,
    padding: 0,
    lineHeight: 52,
  },
  amountDivider: {
    height: 2,
    borderRadius: 1,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconOption: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.base[700],
    borderWidth: 1.5,
    borderColor: colors.glass.border,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchActive: {
    borderColor: colors.base[50],
    transform: [{ scale: 1.15 }],
  },
  deadlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  deadlineChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.base[700],
  },

  /* Contribute sheet */
  contributeSheet: {
    gap: 16,
  },
  contributeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  contributeAmountInput: {
    flex: 1,
    fontSize: 44,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: -0.5,
    padding: 0,
    lineHeight: 56,
  },
});
