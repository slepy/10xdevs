import type { InvestmentStatus } from "@/types";

/**
 * ViewModel dla pojedynczej inwestycji w widoku "Moje Inwestycje"
 */
export interface InvestmentViewModel {
  id: string;
  offerName: string;
  amount: string;
  status: InvestmentStatus;
  submissionDate: string;
}
