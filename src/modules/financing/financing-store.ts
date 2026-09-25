import { scopedStorage } from '@lark-apaas/client-toolkit-lite';
import { SELF_CHECK_MATERIALS } from './financing-checklist';
import type { FinancingMaterialSelections } from './types';

const key = (enterpriseId: string, reportId: string) => `taxshield_financing_v1:${enterpriseId}:${reportId}`;
export function loadMaterialSelections(enterpriseId: string, reportId: string): FinancingMaterialSelections {
  try {
    const raw: unknown = JSON.parse(scopedStorage.getItem(key(enterpriseId, reportId)) ?? '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([id, value]) =>
      SELF_CHECK_MATERIALS.some((item) => item.id === id) && ['ready', 'missing', 'needs-review'].includes(String(value)),
    )) as FinancingMaterialSelections;
  } catch { return {}; }
}
export function saveMaterialSelections(enterpriseId: string, reportId: string, selections: FinancingMaterialSelections): boolean {
  try { scopedStorage.setItem(key(enterpriseId, reportId), JSON.stringify(selections)); return true; }
  catch { return false; }
}

