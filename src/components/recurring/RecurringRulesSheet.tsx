import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { BottomSheet } from "../ui/BottomSheet";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import { colors } from "../../theme/colors";
import { spacing, radius } from "../../theme/spacing";
import { useHaptics } from "../../hooks/useHaptics";
import {
  useRecurringRules,
  useSaveRule,
  useDeleteRule,
} from "../../hooks/recurring/useRecurring";
import { CATEGORIES, getCategoryById } from "../../constants/categories";
import { formatCurrency } from "../../utils/currency";
import { deviceTimeZone } from "../../utils/calendar";
import type { RecurringRule, TransactionType, PaymentMethod } from "../../types";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
  { value: "transfer", label: "Transfer" },
  { value: "cash", label: "Dinheiro" },
];

type Mode = "list" | "create";

interface RuleRowProps {
  rule: RecurringRule;
  onDelete: (rule: RecurringRule) => void;
}

const RuleRow = React.memo<RuleRowProps>(({ rule, onDelete }) => {
  const category = getCategoryById(rule.categoryId);
  const isIncome = rule.type === "income";

  return (
    <View style={styles.ruleRow}>
      <View style={[styles.iconBg, { backgroundColor: category.color + "20" }]}>
        <Typography variant="body">{category.icon}</Typography>
      </View>

      <View style={styles.ruleInfo}>
        <Typography variant="bodyMedium" color="primary" numberOfLines={1}>
          {rule.description}
        </Typography>
        <Typography variant="caption" color="tertiary">
          todo dia {rule.dayOfMonth} · {category.name}
        </Typography>
      </View>

      <Typography
        variant="amount"
        style={{
          color: isIncome ? colors.accent.mint : colors.semantic.danger,
          fontSize: 13,
        }}
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(rule.amount, true)}
      </Typography>

      <Pressable
        onPress={() => onDelete(rule)}
        style={styles.deleteButton}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${rule.description}`}
      >
        <Typography variant="body" style={{ color: colors.base[400] }}>
          ×
        </Typography>
      </Pressable>
    </View>
  );
});

RuleRow.displayName = "RuleRow";

interface RecurringRulesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecurringRulesSheet = React.memo<RecurringRulesSheetProps>(
  ({ isOpen, onClose }) => {
    const { data: rules = [] } = useRecurringRules();
    const { mutateAsync: saveRule, isPending } = useSaveRule();
    const { mutateAsync: deleteRule } = useDeleteRule();
    const haptics = useHaptics();

    const [mode, setMode] = useState<Mode>("list");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<TransactionType>("expense");
    const [categoryId, setCategoryId] = useState("home");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
    const [dayOfMonth, setDayOfMonth] = useState(5);

    const availableCategories = useMemo(
      () => CATEGORIES.filter((c) => !c.system && (c.type === type || c.type === "both")),
      [type],
    );

    const parsedAmount = Number(amount.replace(",", "."));
    const canSave = description.trim().length > 0 && parsedAmount > 0;

    const resetForm = useCallback(() => {
      setDescription("");
      setAmount("");
      setType("expense");
      setCategoryId("home");
      setPaymentMethod("transfer");
      setDayOfMonth(5);
    }, []);

    const handleSave = useCallback(async () => {
      try {
        await saveRule({
          description: description.trim(),
          amount: parsedAmount,
          type,
          categoryId,
          paymentMethod,
          dayOfMonth,
          timeZone: deviceTimeZone(),
        });
        haptics.success();
        resetForm();
        setMode("list");
      } catch (err) {
        haptics.error();
        Alert.alert(
          "Não foi possível salvar",
          err instanceof Error ? err.message : "Tente novamente.",
        );
      }
    }, [
      description, parsedAmount, type, categoryId, paymentMethod,
      dayOfMonth, saveRule, haptics, resetForm,
    ]);

    const handleDelete = useCallback(
      (rule: RecurringRule) => {
        Alert.alert(
          "Excluir evento",
          `"${rule.description}" deixa de aparecer na timeline. As transações já confirmadas continuam no extrato.`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Excluir",
              style: "destructive",
              onPress: async () => {
                await deleteRule(rule.id);
                haptics.success();
              },
            },
          ],
        );
      },
      [deleteRule, haptics],
    );

    const handleClose = useCallback(() => {
      setMode("list");
      resetForm();
      onClose();
    }, [onClose, resetForm]);

    return (
      <BottomSheet isOpen={isOpen} onClose={handleClose} snapHeight={640}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Typography variant="h3">
              {mode === "list" ? "Eventos fixos" : "Novo evento"}
            </Typography>
            <Typography variant="caption" style={{ color: colors.base[300] }}>
              {mode === "list"
                ? "Gastos e entradas que se repetem todo mês. Eles aparecem na timeline e pedem confirmação no dia."
                : "Defina o valor previsto e o dia. Nada entra no extrato até você confirmar."}
            </Typography>
          </View>

          {mode === "list" ? (
            <>
              {rules.length === 0 ? (
                <View style={styles.empty}>
                  <Typography variant="caption" color="tertiary">
                    Nenhum evento fixo ainda.
                  </Typography>
                </View>
              ) : (
                <View style={styles.list}>
                  {rules.map((rule) => (
                    <RuleRow key={rule.id} rule={rule} onDelete={handleDelete} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Typography variant="label" style={styles.fieldLabel}>
                  DESCRIÇÃO
                </Typography>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Aluguel"
                  placeholderTextColor={colors.base[400]}
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Typography variant="label" style={styles.fieldLabel}>
                  VALOR PREVISTO
                </Typography>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="1200,00"
                  placeholderTextColor={colors.base[400]}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Typography variant="label" style={styles.fieldLabel}>
                  TIPO
                </Typography>
                <View style={styles.chipRow}>
                  {(["expense", "income"] as const).map((t) => {
                    const isActive = type === t;
                    const accent =
                      t === "income" ? colors.accent.mint : colors.semantic.danger;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => {
                          haptics.selection();
                          setType(t);
                          setCategoryId(t === "income" ? "salary" : "home");
                        }}
                        style={[
                          styles.chip,
                          isActive && { borderColor: accent, backgroundColor: accent + "18" },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isActive }}
                      >
                        <Typography
                          variant="captionMedium"
                          style={{ color: isActive ? accent : colors.base[300] }}
                        >
                          {t === "income" ? "Entrada" : "Gasto"}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Typography variant="label" style={styles.fieldLabel}>
                  CATEGORIA
                </Typography>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {availableCategories.map((cat) => {
                    const isActive = categoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          haptics.selection();
                          setCategoryId(cat.id);
                        }}
                        style={[
                          styles.chip,
                          isActive && {
                            borderColor: cat.color,
                            backgroundColor: cat.color + "18",
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isActive }}
                      >
                        <Typography variant="caption">{cat.icon}</Typography>
                        <Typography
                          variant="caption"
                          style={{ color: isActive ? cat.color : colors.base[300] }}
                        >
                          {cat.name}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.field}>
                <Typography variant="label" style={styles.fieldLabel}>
                  FORMA
                </Typography>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {PAYMENT_METHODS.map((pm) => {
                    const isActive = paymentMethod === pm.value;
                    return (
                      <Pressable
                        key={pm.value}
                        onPress={() => {
                          haptics.selection();
                          setPaymentMethod(pm.value);
                        }}
                        style={[
                          styles.chip,
                          isActive && {
                            borderColor: colors.accent.blue,
                            backgroundColor: colors.accent.blueMuted,
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isActive }}
                      >
                        <Typography
                          variant="caption"
                          style={{ color: isActive ? colors.accent.blue : colors.base[300] }}
                        >
                          {pm.label}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.field}>
                <Typography variant="label" style={styles.fieldLabel}>
                  TODO DIA
                </Typography>
                <View style={styles.grid}>
                  {DAYS.map((day) => {
                    const isActive = day === dayOfMonth;
                    return (
                      <Pressable
                        key={day}
                        onPress={() => {
                          haptics.selection();
                          setDayOfMonth(day);
                        }}
                        style={[
                          styles.dayCell,
                          isActive && {
                            backgroundColor: colors.accent.blue,
                            borderColor: colors.accent.blue,
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isActive }}
                        accessibilityLabel={`Dia ${day}`}
                      >
                        <Typography
                          variant="caption"
                          style={{ color: isActive ? colors.base[950] : colors.base[200] }}
                        >
                          {day}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </View>
                {dayOfMonth > 28 && (
                  <Typography variant="caption" style={{ color: colors.semantic.warning }}>
                    Em meses mais curtos, cai no último dia.
                  </Typography>
                )}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {mode === "list" ? (
            <Button label="Novo evento" onPress={() => setMode("create")} fullWidth />
          ) : (
            <View style={styles.footerRow}>
              <Button
                label="Voltar"
                variant="secondary"
                onPress={() => setMode("list")}
                style={styles.footerSecondary}
              />
              <Button
                label="Salvar"
                onPress={handleSave}
                loading={isPending}
                disabled={!canSave}
                style={styles.footerPrimary}
              />
            </View>
          )}
        </View>
      </BottomSheet>
    );
  },
);

RecurringRulesSheet.displayName = "RecurringRulesSheet";

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    gap: spacing[4],
    paddingBottom: spacing[4],
  },
  header: { gap: spacing[2] },
  empty: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },
  list: { gap: spacing[3] },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleInfo: { flex: 1, gap: 2 },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  field: { gap: spacing[2] },
  fieldLabel: { color: colors.base[400] },
  input: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.glass.light,
    paddingHorizontal: spacing[4],
    color: colors.base[50],
    fontSize: 16,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[4],
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
    backgroundColor: colors.glass.light,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  dayCell: {
    width: 40,
    height: 34,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass.light,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  footer: {
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
  },
  footerRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 2 },
});
