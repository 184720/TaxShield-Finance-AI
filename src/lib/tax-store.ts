import { scopedStorage } from '@lark-apaas/client-toolkit-lite';
import type { ITaxFormData } from '@/data/testdata';
import type { IRiskResult } from './risk-calc';

const FORM_KEY = 'tax_check_formData';
const RESULT_KEY = 'tax_check_result';

export function saveFormData(data: ITaxFormData): void {
  try {
    scopedStorage.setItem(FORM_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadFormData(): ITaxFormData | null {
  try {
    const raw = scopedStorage.getItem(FORM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ITaxFormData;
  } catch {
    return null;
  }
}

export function saveRiskResult(result: IRiskResult): void {
  try {
    scopedStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    /* ignore */
  }
}

export function loadRiskResult(): IRiskResult | null {
  try {
    const raw = scopedStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as IRiskResult;
  } catch {
    return null;
  }
}
