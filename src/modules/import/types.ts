import type { FinancialData, InvoiceData, TaxDeclarationData, UploadPreview } from '@/modules/domain/types';

export type UploadKind = UploadPreview['kind'];
export interface ParsedUpload extends UploadPreview { rowCount: number; }
export interface MappedData { financial?: FinancialData; invoice?: InvoiceData; declaration?: TaxDeclarationData; }
