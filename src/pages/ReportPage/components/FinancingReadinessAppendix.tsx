import type { FinancingReadinessReport } from '@/modules/financing/types';
import { MATERIAL_STATUS_LABEL, READINESS_LABEL } from '@/modules/financing/types';

export default function FinancingReadinessAppendix({ result }: { result: FinancingReadinessReport }) {
  const ready = result.requiredMaterials.filter((item) => item.status === 'ready');
  const pending = result.requiredMaterials.filter((item) => item.status !== 'ready');
  return (
    <>
      <section className="ts-page">
        <h2 className="ts-h2">附录 · 融资准备建议</h2>
        <p>依据检测报告：{result.reportId}</p>
        <p>财税健康指数：<strong>{result.taxHealthIndex} / 100</strong> · 融资准备状态：<strong>{READINESS_LABEL[result.readinessLevel]}</strong></p>
        <p>{result.summary}</p>
        <h3 className="ts-h3">已准备材料 / 检测字段</h3>
        <p>{ready.map((item) => item.label).join('、') || '暂无'}</p>
        <h3 className="ts-h3">待补充与待复核材料</h3>
        <p>{pending.map((item) => `${item.label}（${MATERIAL_STATUS_LABEL[item.status]}）`).join('、') || '自查清单无待补项，仍需核验原始资料。'}</p>
        <h3 className="ts-h3">财税风险提示</h3>
        {result.warnings.map((text, index) => <p key={index}>· {text}</p>)}
        {result.warnings.length === 0 && <p>本工具当前未提示优先整改事项，请持续核查数据与资料时效。</p>}
        <p className="ts-ai-note">资料状态来自报告字段与企业自查确认，不表示真实凭证已上传或经银行核验。演示数据仅模拟准备流程。Checklist完成不会提升准备等级。</p>
        <p className="ts-page-foot">{result.disclaimer}</p>
      </section>
      <section className="ts-page">
        <h2 className="ts-h2">附录 · 融资准备下一步建议</h2>
        {result.recommendedActions.map((text, index) => <p key={index}>{index + 1}. {text}</p>)}
        <h3 className="ts-h3">金融服务衔接 · 产品构想</h3>
        <p>未来可探索与商业银行普惠金融服务场景衔接。当前未接入任何银行审批接口。</p>
        <p className="ts-page-foot">{result.disclaimer}</p>
      </section>
    </>
  );
}

