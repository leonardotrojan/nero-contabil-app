export interface Objective {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}
