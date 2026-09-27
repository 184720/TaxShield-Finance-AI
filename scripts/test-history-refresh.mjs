import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

// The history page runs in a browser. EventTarget is enough for testing the
// same-tab report-change notification without introducing a DOM test library.
globalThis.window = new EventTarget();

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
      '@lark-apaas/client-toolkit-lite': fileURLToPath(new URL('./test-storage.mjs', import.meta.url)),
    },
  },
});

try {
  const storage = await server.ssrLoadModule('/src/lib/taxshield-store.ts');
  const { runRiskEngine } = await server.ssrLoadModule('/src/modules/risk-engine/index.ts');
  const { WUHAN_ZHICHUANG_PROFILE: profile, WUHAN_ZHICHUANG_DATA: data } = await server.ssrLoadModule('/src/modules/domain/demo-data.ts');

  const report = runRiskEngine(profile, data, 'demo');
  storage.saveReport(report);

  const snapshots = [];
  const unsubscribe = storage.subscribeReports(() => {
    snapshots.push(storage.loadReports().map((item) => item.reportId));
  });

  assert.deepEqual(
    snapshots.at(-1),
    [report.reportId],
    'History mount must immediately receive the latest saved report',
  );

  const updated = {
    ...report,
    reportId: `${report.reportId}-updated`,
    id: `${report.id}-updated`,
    createdAt: new Date(Date.parse(report.createdAt) + 1_000).toISOString(),
  };
  storage.saveReport(updated);

  assert.deepEqual(
    snapshots.at(-1),
    [updated.reportId, report.reportId],
    'An already-mounted History page must refresh after a same-tab report save',
  );

  const notificationCount = snapshots.length;
  unsubscribe();
  storage.saveReport({ ...updated, reportId: `${updated.reportId}-after-unsubscribe`, id: `${updated.id}-after-unsubscribe` });
  assert.equal(snapshots.length, notificationCount, 'Unmounted History page must release its listener');

  console.log('History 首次挂载读取与同页报告更新 PASS');
} finally {
  await server.close();
  delete globalThis.window;
}
