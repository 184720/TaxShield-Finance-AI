import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** 离屏渲染容器 id，见 report-print.css。 */
const PRINT_ROOT_ID = 'taxshield-print-root';
/** 下载文件名。 */
export const PDF_FILE_NAME = '税智盾_TaxShield_AI_企业税务健康体检报告.pdf';

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const PAGE_MARGIN = 8;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * 把离屏报告文档逐页栅格化，合成一份真实的 A4 PDF（Blob）。
 * 中文由浏览器系统字体直接绘制，无需内嵌字体。
 */
async function buildPdfBlob(pages: HTMLElement[]): Promise<Blob> {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const html2canvas = html2canvasModule.default;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const contentWidth = A4_WIDTH - PAGE_MARGIN * 2;
  const contentHeight = A4_HEIGHT - PAGE_MARGIN * 2;
  let hasPage = false;

  for (const element of pages) {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    if (!canvas.width || !canvas.height) continue;

    // 一个 .ts-page 至少占一页；内容超出时按 A4 高度切片分页。
    const imageHeight = (canvas.height * contentWidth) / canvas.width;
    let offset = 0;
    while (offset < imageHeight - 0.5) {
      const sliceHeight = Math.min(contentHeight, imageHeight - offset);
      const sourceY = Math.round((offset / imageHeight) * canvas.height);
      const sourceHeight = Math.max(1, Math.round((sliceHeight / imageHeight) * canvas.height));

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sourceHeight;
      const context = slice.getContext('2d');
      if (!context) throw new Error('无法创建画布上下文，PDF 生成失败。');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, slice.width, slice.height);
      context.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

      if (hasPage) pdf.addPage();
      hasPage = true;
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', PAGE_MARGIN, PAGE_MARGIN, contentWidth, sliceHeight);
      offset += sliceHeight;
    }
  }

  if (!hasPage) throw new Error('报告中暂无可导出的页面内容。');
  return pdf.output('blob');
}

/**
 * 真实 PDF 导出：把报告文档离屏渲染 → 逐页栅格化 → 合成 A4 PDF → 自动下载。
 * 任一步失败都会 reject，由调用方展示错误提示（不会白屏）。
 */
export function usePdfExport() {
  const [documentNode, setDocumentNode] = useState<ReactNode>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => {
    rootRef.current?.remove();
    rootRef.current = null;
  }, []);

  const exportPdf = useCallback(
    async (render: () => ReactNode) => {
      if (isGenerating) return;
      setIsGenerating(true);

      let root = document.getElementById(PRINT_ROOT_ID) as HTMLDivElement | null;
      if (!root) {
        root = document.createElement('div');
        root.id = PRINT_ROOT_ID;
        document.body.appendChild(root);
      }
      rootRef.current = root;
      setDocumentNode(render());

      try {
        // 等 portal 提交、布局完成、字体就绪后再截图。
        await nextFrame();
        await nextFrame();
        try {
          await document.fonts.ready;
        } catch {
          /* 字体就绪检查失败不阻塞导出 */
        }

        const pages = Array.from(root.querySelectorAll<HTMLElement>('.ts-page'));
        if (pages.length === 0) throw new Error('未找到报告页面内容，无法生成 PDF。');

        const blob = await buildPdfBlob(pages);
        downloadBlob(blob, PDF_FILE_NAME);
      } finally {
        setDocumentNode(null);
        setIsGenerating(false);
      }
    },
    [isGenerating],
  );

  const portal =
    documentNode !== null && rootRef.current ? createPortal(documentNode, rootRef.current) : null;

  return { exportPdf, isGenerating, portal };
}
