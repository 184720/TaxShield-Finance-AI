import type { AIExplanation } from '@/modules/domain/types';

export const UNSUPPORTED_NUMBER_MARKER = '\uE000';

const escapedMarker = UNSUPPORTED_NUMBER_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const markerPattern = new RegExp(escapedMarker, 'g');

/**
 * Turns internal safety redactions into natural, user-facing Chinese without
 * inventing a replacement value. This function never supplies a number.
 */
export function sanitizeAITextForDisplay(value: unknown, fallback = '请结合现有证据和原始资料进一步核对。'): string {
  if (typeof value !== 'string') return fallback;

  let text = value
    .replace(/未核实数值|undefined|null/gi, UNSUPPORTED_NUMBER_MARKER)
    .replace(new RegExp(`分析\\s*${escapedMarker}(?:年度|期间)?(?:的)?(?:业务)?变化(?:情况)?`, 'g'), '分析对应期间的业务变化情况')
    .replace(new RegExp(`(?:[（(]\\s*)?[¥￥]\\s*${escapedMarker}\\s*(?:元|万元|亿元)?\\s*(?:[）)])?`, 'g'), '')
    .replace(new RegExp(`${escapedMarker}(?:年度|年份)`, 'g'), '对应期间')
    .replace(new RegExp(`${escapedMarker}(?:天|日|周|个月|月|季度|年)(?:内)?`, 'g'), '相应期间')
    .replace(new RegExp(`${escapedMarker}[％%]`, 'g'), '相关比例')
    .replace(new RegExp(`第\\s*${escapedMarker}(?:步|项|条|阶段)`, 'g'), '相关事项')
    .replace(markerPattern, '')
    .replace(/[（(]\s*[¥￥]?(?:元|万元|亿元|％|%)?\s*[）)]/g, '')
    .replace(/[¥￥]\s*(?=[，。；、,.;：:)）]|$)/g, '')
    .replace(/分析\s*(?:对应期间)?(?:年度|年份)变化(?:情况)?/g, '分析对应期间的业务变化情况')
    .replace(/分析对应期间(?:的)?变化(?:情况)?/g, '分析对应期间的业务变化情况')
    .replace(/金额\s*对应(?:的)?(?:业务)?明细/g, '金额对应的业务明细')
    .replace(/对应\s*明细/g, '对应的业务明细')
    .replace(/(?:相关政策规定\s*){2,}/g, '相关政策规定')
    .replace(/相关政策规定号/g, '相关政策规定')
    .replace(/为\s*([，,。；;])/g, '$1')
    .replace(/\s+([，。；、,.;：:)）])/g, '$1')
    .replace(/([（(])\s+/g, '$1')
    .replace(/[，,]{2,}/g, '，')
    .replace(/[；;]{2,}/g, '；')
    .replace(/\s{2,}/g, ' ')
    .trim();

  text = text.replace(/^[，。；、,.;：:)）\s]+|[（(，,；;：:\s]+$/g, '').trim();
  return text || fallback;
}

export function sanitizeAIExplanationText(explanation: AIExplanation): AIExplanation {
  return {
    ...explanation,
    summary: sanitizeAITextForDisplay(explanation.summary),
    reasonAnalysis: sanitizeAITextForDisplay(explanation.reasonAnalysis),
    impact: sanitizeAITextForDisplay(explanation.impact),
    suggestion: explanation.suggestion.map((item) => sanitizeAITextForDisplay(item)),
    disclaimer: sanitizeAITextForDisplay(explanation.disclaimer, 'AI 输出仅供辅助理解，请由专业人员复核。'),
  };
}
