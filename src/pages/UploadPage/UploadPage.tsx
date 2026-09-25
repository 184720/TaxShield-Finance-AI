import { useCallback, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, PlayCircle, Sparkles, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageTitle, SectionCard } from '@/components/TaxShieldPrimitives';
import { loadProfile, saveReport, saveUploads } from '@/lib/taxshield-store';
import { WUHAN_ZHICHUANG_DATA } from '@/modules/domain/demo-data';
import { buildTaxDataBundle } from '@/modules/import/mapping';
import { parseSpreadsheet, UPLOAD_FIELDS } from '@/modules/import/file-parser';
import type { UploadKind } from '@/modules/import/types';
import { runRiskEngine } from '@/modules/risk-engine';
import type { UploadPreview } from '@/modules/domain/types';

const UPLOADS: Array<{ kind: UploadKind; name: string; description: string }> = [
  { kind: 'financial', name: '财务报表', description: '收入、成本、费用、利润及月度数据' },
  { kind: 'invoice', name: '发票明细', description: '发票、税额、交易对方等数据' },
  { kind: 'declaration', name: '纳税申报数据', description: '申报收入、增值税、企业所得税数据' },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [previews, setPreviews] = useState<Record<UploadKind, UploadPreview | undefined>>({ financial: undefined, invoice: undefined, declaration: undefined });
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);
  const handleFile = useCallback(async (kind: UploadKind, file?: File) => { if (!file) return; try { const parsed = await parseSpreadsheet(file, kind); setPreviews((current) => ({ ...current, [kind]: parsed })); setMessage(`已在浏览器本地读取 ${file.name}，共 ${parsed.rowCount} 行。`); } catch { setMessage('文件读取失败，请确认文件格式为 xlsx、xls 或 csv。'); } }, []);
  const setMapping = (kind: UploadKind, field: string, value: string) => setPreviews((current) => ({ ...current, [kind]: current[kind] ? { ...current[kind], mapping: { ...current[kind].mapping, [field]: value }, missingFields: current[kind].missingFields.filter((item) => item !== field) } : undefined }));
  const runUploaded = () => { const result = buildTaxDataBundle(previews); if (!result.data) { setMessage(`数据不足：请完成 ${result.missing.join('、')} 映射。`); return; } const report = runRiskEngine(loadProfile(), result.data, 'uploaded'); saveUploads(Object.values(previews).filter(Boolean) as UploadPreview[]); saveReport(report); navigate('/risk-analysis'); };
  const startDemo = () => { setRunning(true); window.setTimeout(() => { saveReport(runRiskEngine(loadProfile(), WUHAN_ZHICHUANG_DATA, 'demo')); navigate('/risk-analysis'); }, 350); };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 md:px-6 md:py-10">
      <PageTitle
        eyebrow="Data Intake"
        title="数据上传与本地解析"
        description="XLSX、XLS 和 CSV 文件仅在浏览器本地解析，不上传至税务机关。上传数据可驱动风险引擎；演示数据不会与上传数据混淆。"
        action={<Button className="gap-2 bg-brand hover:bg-brand/90" onClick={startDemo} disabled={running}><PlayCircle className="size-4" />{running ? '正在生成…' : '使用比赛演示数据'}</Button>}
      />

      {/* Demo 引导 */}
      <section className="flex flex-col gap-3 rounded-2xl border border-brand-soft bg-brand-soft/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-brand-2" />
          <div>
            <p className="font-semibold text-brand">首次体验？直接使用演示企业</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">一键载入「武汉智创科技」真实财报演示数据，立即生成 8 类风险检测结果与 AI 解释，无需准备文件。</p>
          </div>
        </div>
        <Button onClick={startDemo} disabled={running} className="shrink-0 gap-2 bg-brand-2 hover:bg-brand-2/90">{running ? '正在生成…' : '体验演示企业'}</Button>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        {UPLOADS.map((item) => {
          const preview = previews[item.kind];
          return (
            <section key={item.kind} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <FileSpreadsheet className="size-6 text-brand-2" />
              <h2 className="mt-4 font-semibold text-slate-900">{item.name}</h2>
              <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{item.description}</p>
              <label className="mt-5 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-center hover:border-brand-2">
                <UploadCloud className="size-5 text-slate-400" />
                <span className="mt-2 text-xs text-slate-500">选择 .xlsx / .xls / .csv</span>
                <input className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void handleFile(item.kind, event.target.files?.[0])} />
              </label>
              {preview ? <p className="mt-3 flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="size-3.5" />{preview.fileName} · {preview.rowCount} 行</p> : <p className="mt-3 text-xs text-slate-400">尚未选择文件</p>}
            </section>
          );
        })}
      </div>

      {Object.values(previews).some(Boolean) && (
        <SectionCard title="字段映射与数据预览">
          {UPLOADS.map((item) => {
            const preview = previews[item.kind];
            if (!preview) return null;
            return (
              <div key={item.kind} className="mt-6 border-t border-slate-100 pt-5 first:mt-0 first:border-t-0 first:pt-0">
                <p className="font-medium text-slate-800">{item.name} · 工作表：{preview.sheetName}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {UPLOAD_FIELDS[item.kind].map((field) => (
                    <label key={field} className="text-xs text-slate-500">{field}
                      <select className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700" value={preview.mapping[field] ?? ''} onChange={(event) => setMapping(item.kind, field, event.target.value)}>
                        <option value="">未映射</option>
                        {preview.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                {preview.missingFields.length > 0 && <p className="mt-3 text-xs text-rose-600">待映射字段：{preview.missingFields.join('、')}</p>}
                <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{preview.headers.map((header) => <th className="border-b bg-slate-50 px-2 py-2 text-slate-500" key={header}>{header}</th>)}</tr></thead><tbody>{preview.rows.map((row, index) => <tr key={index}>{preview.headers.map((header) => <td className="border-b px-2 py-2 text-slate-600" key={header}>{String(row[header] ?? '')}</td>)}</tr>)}</tbody></table></div>
              </div>
            );
          })}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button className="bg-brand hover:bg-brand/90" onClick={runUploaded}>使用上传数据开始检测</Button>
            <span className="text-sm text-slate-500">{message}</span>
          </div>
        </SectionCard>
      )}

      {!Object.values(previews).some(Boolean) && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">尚未上传文件时，系统只可使用比赛演示数据。实际解析后，缺少关键字段会明确提示“数据不足”，不会据此生成风险结论。</section>
      )}
    </main>
  );
}
