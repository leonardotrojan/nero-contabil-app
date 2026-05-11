export type InsightSeverity = "info" | "warning" | "positive" | "neutral";
export type InsightType =
  | "spending_trend"
  | "behavioral"
  | "projection"
  | "subscription"
  | "comparison";

export interface Insight {
  id: string;
  type: InsightType;
  content: string;
  severity: InsightSeverity;
  createdAt: string;
  read: boolean;
}
