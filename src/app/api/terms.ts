// terms.api.ts
import { requests } from "./utils";
import { Terms } from "../../types/terms";

export const TermsAPI = {
  /**
   * Get all terms and conditions (Public endpoint)
   */
  getPublic: (): Promise<Terms[]> => requests.get('terms/public') as any,

  /**
   * Get latest terms (Public endpoint)
   */
  getLatest: (): Promise<Terms> => requests.get('terms/latest') as any,
}