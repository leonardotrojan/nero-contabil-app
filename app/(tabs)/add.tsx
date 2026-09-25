import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Typography } from "../../src/components/ui/Typography";
import { Button } from "../../src/components/ui/Button";
import { colors } from "../../src/theme/colors";
import { radius, layout } from "../../src/theme/spacing";
import { useCreateTransaction } from "../../src/hooks/transactions/useCreateTransaction";
import { useObjectiveStore } from "../../src/stores/objectiveStore";
import { useHaptics } from "../../src/hooks/useHaptics";
import { CATEGORIES } from "../../src/constants/categories";
import { formatCurrency } from "../../src/utils/currency";
import { CreditCardSetupSheet } from "../../src/components/creditCard/CreditCardSetupSheet";
import { useCreditCard } from "../../src/hooks/creditCard/useCreditCard";
import type { TransactionType, PaymentMethod } from "../../src/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "credit", label: "Crédito" },
  { value: "debit", label: "Débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
];

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();
  const { objectives, contribute } = useObjectiveStore();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("other");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);

  // Gate do crédito: sem ciclo configurado não há fatura a que atribuir a compra.
  const { isConfigured: isCardConfigured } = useCreditCard();
  const [isCardSheetOpen, setCardSheetOpen] = useState(false);
  const [methodBeforeGate, setMethodBeforeGate] = useState<PaymentMethod>("pix");

  const selectPaymentMethod = useCallback(
    (next: PaymentMethod) => {
      // Interrompe na seleção, não no submit: é o momento da intenção e não
      // arrisca perder um formulário já preenchido.
      if (next === "credit" && !isCardConfigured) {
        setMethodBeforeGate(paymentMethod);
        setPaymentMethod("credit");
        setCardSheetOpen(true);
        return;
      }
      setPaymentMethod(next);
    },
    [isCardConfigured, paymentMethod],
  );

  // Dispensar sem salvar devolve o método anterior — crédito sem ciclo não vale.
  const handleGateDismiss = useCallback(() => {
    setCardSheetOpen(false);
    if (!isCardConfigured) setPaymentMethod(methodBeforeGate);
  }, [isCardConfigured, methodBeforeGate]);

  const isObjectivesCategory = categoryId === "objectives";

  const availableCategories = CATEGORIES.filter(
    (c) => !c.system && (c.type === type || c.type === "both")
  );

  const isValid =
    !!parseFloat(amount.replace(",", ".")) &&
    !!description.trim() &&
    (!isObjectivesCategory || !!selectedObjectiveId);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!isValid || !parsedAmount) return;

    haptics.success();

    const objective = selectedObjectiveId
      ? objectives.find((o) => o.id === selectedObjectiveId)
      : null;

    await createTransaction({
      amount: parsedAmount,
      type,
      categoryId,
      description: objective ? `Meta: ${objective.title}` : description.trim(),
      paymentMethod,
    });

    if (isObjectivesCategory && selectedObjectiveId) {
      contribute(selectedObjectiveId, parsedAmount);
    }

    router.push("/(tabs)" as any);
  };

  const handleCategorySelect = (id: string) => {
    haptics.selection();
    setCategoryId(id);
    if (id !== "objectives") setSelectedObjectiveId(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.base[950] }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Pressable
          onPress={() => router.back()}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.closeButton}
        >
          <Typography variant="bodyMedium" color="tertiary">✕</Typography>
        </Pressable>
        <Typography variant="h3" color="primary">
          Nova transação
        </Typography>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type selector */}
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <View style={styles.typeRow}>
            {(["expense", "income", "transfer"] as TransactionType[]).map((t) => {
              const labels: Record<TransactionType, string> = {
                expense: "Gasto",
                income: "Receita",
                transfer: "Transferência",
              };
              const activeColors: Record<TransactionType, string> = {
                expense: colors.semantic.danger,
                income: colors.accent.mint,
                transfer: colors.accent.blue,
              };
              const isActive = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    haptics.selection();
                    setType(t);
                    setCategoryId("other");
                    setSelectedObjectiveId(null);
                  }}
                  style={[
                    styles.typeButton,
                    isActive && {
                      backgroundColor: activeColors[t] + "20",
                      borderColor: activeColors[t] + "60",
                    },
                  ]}
                  accessible
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                >
                  <Typography
                    variant="captionMedium"
                    style={{ color: isActive ? activeColors[t] : colors.base[400] }}
                  >
                    {labels[t]}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Amount */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(140)}
          style={styles.amountSection}
        >
          <Typography variant="label" color="tertiary">
            Valor
          </Typography>
          <View style={styles.amountHero}>
            <Typography variant="h1" color="tertiary" style={styles.currencyPrefix}>
              R$
            </Typography>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0,00"
              placeholderTextColor={colors.base[600]}
              style={styles.amountInput}
              selectionColor={colors.accent.blue}
              accessible
              accessibilityLabel="Valor da transação"
            />
          </View>
          <View style={styles.amountDivider} />
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)} style={styles.field}>
          <Typography variant="label" color="tertiary" style={styles.fieldLabel}>
            Descrição
          </Typography>
          <View style={styles.textInputWrapper}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="ex: iFood, Uber, Academia..."
              placeholderTextColor={colors.base[500]}
              style={styles.textInput}
              selectionColor={colors.accent.blue}
              accessible
              accessibilityLabel="Descrição da transação"
            />
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.field}>
          <Typography variant="label" color="tertiary" style={styles.fieldLabel}>
            Categoria
          </Typography>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
            decelerationRate="fast"
          >
            {availableCategories.map((cat) => {
              const isActive = categoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleCategorySelect(cat.id)}
                  style={[
                    styles.catChip,
                    isActive && {
                      backgroundColor: cat.color + "20",
                      borderColor: cat.color + "70",
                    },
                  ]}
                  accessible
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                >
                  <Typography variant="body" style={{ fontSize: 16 }}>
                    {cat.icon}
                  </Typography>
                  <Typography
                    variant="captionMedium"
                    style={{ color: isActive ? cat.color : colors.base[300] }}
                  >
                    {cat.name}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Objective selector */}
        {isObjectivesCategory && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            exiting={FadeOutUp.duration(200)}
            style={styles.field}
          >
            <Typography variant="label" color="tertiary" style={styles.fieldLabel}>
              Selecionar objetivo
            </Typography>
            <View style={styles.objectiveList}>
              {objectives.map((obj) => {
                const isSelected = selectedObjectiveId === obj.id;
                const progress = obj.currentAmount / obj.targetAmount;
                const parsedAmt = parseFloat(amount.replace(",", ".")) || 0;
                const newProgress = Math.min(
                  (obj.currentAmount + parsedAmt) / obj.targetAmount,
                  1
                );

                return (
                  <Pressable
                    key={obj.id}
                    onPress={() => {
                      haptics.selection();
                      setSelectedObjectiveId(obj.id);
                    }}
                    style={[
                      styles.objectiveItem,
                      isSelected && {
                        borderColor: obj.color + "70",
                        backgroundColor: obj.color + "12",
                      },
                    ]}
                    accessible
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={obj.title}
                  >
                    <View style={styles.objectiveLeft}>
                      <Typography variant="body" style={styles.objectiveIcon}>
                        {obj.icon}
                      </Typography>
                      <View style={styles.objectiveInfo}>
                        <Typography variant="bodyMedium" color="primary">
                          {obj.title}
                        </Typography>
                        <View style={styles.objectiveProgressRow}>
                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${progress * 100}%`, backgroundColor: obj.color + "50" },
                              ]}
                            />
                            {isSelected && parsedAmt > 0 && (
                              <View
                                style={[
                                  styles.progressFillNew,
                                  {
                                    left: `${progress * 100}%`,
                                    width: `${(newProgress - progress) * 100}%`,
                                    backgroundColor: obj.color,
                                  },
                                ]}
                              />
                            )}
                          </View>
                          <Typography variant="caption" color="tertiary">
                            {formatCurrency(obj.currentAmount, true)} /&nbsp;
                            {formatCurrency(obj.targetAmount, true)}
                          </Typography>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && {
                          borderColor: obj.color,
                          backgroundColor: obj.color,
                        },
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Payment method */}
        <Animated.View entering={FadeInDown.duration(400).delay(260)} style={styles.field}>
          <Typography variant="label" color="tertiary" style={styles.fieldLabel}>
            Forma de pagamento
          </Typography>
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map((pm) => {
              const isActive = paymentMethod === pm.value;
              return (
                <Pressable
                  key={pm.value}
                  onPress={() => {
                    haptics.selection();
                    selectPaymentMethod(pm.value);
                  }}
                  style={[
                    styles.paymentChip,
                    isActive && {
                      backgroundColor: colors.accent.blueMuted,
                      borderColor: colors.accent.blue + "60",
                    },
                  ]}
                  accessible
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                >
                  <Typography
                    variant="captionMedium"
                    style={{ color: isActive ? colors.accent.blue : colors.base[400] }}
                  >
                    {pm.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Save */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.saveWrapper}>
          <Button
            label={isPending ? "Salvando..." : "Salvar transação"}
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSave}
            disabled={!isValid || isPending}
          />
        </Animated.View>
      </ScrollView>

      <CreditCardSetupSheet
        isOpen={isCardSheetOpen}
        onClose={handleGateDismiss}
        onSaved={() => setPaymentMethod("credit")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingH,
  },
  scrollContent: {
    paddingTop: 28,
    paddingBottom: 60,
    gap: 28,
  },

  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: "center",
    backgroundColor: colors.base[800],
  },

  amountSection: {
    gap: 12,
  },
  amountHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  currencyPrefix: {
    fontSize: 32,
    color: colors.base[500],
    lineHeight: 56,
  },
  amountInput: {
    flex: 1,
    fontSize: 52,
    fontWeight: "700",
    color: colors.base[50],
    fontFamily: "monospace",
    letterSpacing: -1,
    padding: 0,
    margin: 0,
    lineHeight: 64,
  },
  amountDivider: {
    height: 2,
    backgroundColor: colors.glass.border,
    borderRadius: 1,
  },

  field: {},
  fieldLabel: {
    marginBottom: 12,
  },
  textInputWrapper: {
    backgroundColor: colors.base[800],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: "center",
  },
  textInput: {
    fontSize: 16,
    color: colors.base[50],
    padding: 0,
    margin: 0,
  },

  chipList: {
    gap: 8,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.base[800],
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.base[800],
  },

  objectiveList: {
    gap: 10,
  },
  objectiveItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.base[800],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glass.border,
    padding: 14,
    gap: 12,
  },
  objectiveLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  objectiveIcon: {
    fontSize: 24,
    lineHeight: 30,
  },
  objectiveInfo: {
    flex: 1,
    gap: 8,
  },
  objectiveProgressRow: {
    gap: 5,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.base[700],
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
    flexDirection: "row",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressFillNew: {
    position: "absolute",
    height: "100%",
    borderRadius: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.base[600],
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.base[950],
  },

  saveWrapper: {},
});
