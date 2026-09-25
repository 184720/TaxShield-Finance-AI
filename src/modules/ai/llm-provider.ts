import type { AIProvider } from './types';
import { mockProvider } from './mock-provider';
import { qwenProvider } from './qwen-provider';
import { validateAIExplanation } from './schema';

export function createLLMProvider(provider?: string): AIProvider {
  return {
    async explainRisk(request) {
      if (provider === 'qwen') {
        try {
          return validateAIExplanation(await qwenProvider.explainRisk(request), request.reportId, request.riskRecord);
        } catch {
          // Do not log financial data, prompts, provider responses, or credentials.
          const result = validateAIExplanation(await mockProvider.explainRisk(request), request.reportId, request.riskRecord);
          return { ...result, disclaimer: `当前为 Mock 备用解释（真实模型未配置、不可用或输出未通过校验）。${result.disclaimer}` };
        }
      }
      const result = validateAIExplanation(await mockProvider.explainRisk(request), request.reportId, request.riskRecord);
      return { ...result, disclaimer: `当前为 Mock 离线演示解释。${result.disclaimer}` };
    },
    generateRemediationPlan: mockProvider.generateRemediationPlan,
  };
}
