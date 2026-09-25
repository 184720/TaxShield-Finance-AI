import { useState } from 'react';
import { Building2, Save, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTitle, SectionCard } from '@/components/TaxShieldPrimitives';
import { loadProfile, saveProfile } from '@/lib/taxshield-store';
import type { EnterpriseProfile, Industry, TaxpayerType } from '@/modules/domain/types';

const INDUSTRY_LABEL: Record<Industry, string> = { software: '软件信息服务', trade: '商贸业', manufacturing: '制造业', catering: '餐饮业' };

export default function ProfilePage() {
  const [profile, setProfile] = useState(loadProfile);
  const [saved, setSaved] = useState(false);
  const update = (key: keyof EnterpriseProfile, value: string | number | boolean | string[] | undefined) => setProfile((current) => ({ ...current, [key]: value } as EnterpriseProfile));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-7 px-4 py-8 md:px-6 md:py-10">
      <PageTitle
        eyebrow="Enterprise Profile"
        title="企业画像"
        description="企业画像用于行业基准、税种、优惠资格及风险模型的个性化计算。"
        action={<Button className="gap-2 bg-brand hover:bg-brand/90" onClick={() => { saveProfile(profile); setSaved(true); }}><Save className="size-4" />保存企业画像</Button>}
      />

      <section className="grid gap-5 md:grid-cols-2">
        <SectionCard title="基础信息" icon={Building2}>
          <div className="space-y-4">
            {[['name', '企业名称', 'text'], ['region', '所在地区', 'text'], ['foundedYear', '成立年份', 'number'], ['employeeCount', '员工数量', 'number']].map(([key, label, type]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input className="mt-2" type={type} value={profile[key as keyof EnterpriseProfile] as string | number} onChange={(event) => update(key as keyof EnterpriseProfile, type === 'number' ? Number(event.target.value) : event.target.value)} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="经营与税务信息" icon={Store}>
          <div className="space-y-4">
            <div>
              <Label>所属行业</Label>
              <select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.industry} onChange={(e) => update('industry', e.target.value as Industry)}>
                {(Object.keys(INDUSTRY_LABEL) as Industry[]).map((key) => <option key={key} value={key}>{INDUSTRY_LABEL[key]}</option>)}
              </select>
            </div>
            <div>
              <Label>纳税人类型</Label>
              <select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.taxpayerType} onChange={(e) => update('taxpayerType', e.target.value as TaxpayerType)}>
                <option value="general">一般纳税人</option>
                <option value="small-scale">小规模纳税人</option>
              </select>
            </div>
            <div>
              <Label>年营业收入（元）</Label>
              <Input className="mt-2" type="number" value={profile.annualRevenue} onChange={(event) => update('annualRevenue', Number(event.target.value))} />
            </div>
            <div className="rounded-xl bg-brand-soft px-4 py-3 text-xs leading-5 text-slate-600">
              <p className="font-medium text-brand">主要税种</p>
              <p className="mt-1">{profile.mainTaxes.join('、')}</p>
            </div>
          </div>
        </SectionCard>
      </section>

      {saved && <p className="text-sm text-emerald-600">已保存到本地 Demo 数据库，将用于下一次风险检测。</p>}
    </main>
  );
}
