import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import DataInputPage from "@/pages/DataInputPage/DataInputPage";
import RiskResultPage from "@/pages/RiskResultPage/RiskResultPage";
import SuggestionPage from "@/pages/SuggestionPage/SuggestionPage";
import DashboardPage from '@/pages/DashboardPage/DashboardPage';
import ProfilePage from '@/pages/ProfilePage/ProfilePage';
import UploadPage from '@/pages/UploadPage/UploadPage';
import RiskAnalysisPage from '@/pages/RiskAnalysisPage/RiskAnalysisPage';
import ReportPage from '@/pages/ReportPage/ReportPage';
import HistoryPage from '@/pages/HistoryPage/HistoryPage';
import RecheckPage from '@/pages/RecheckPage/RecheckPage';
import FinancingReadinessPage from '@/pages/FinancingReadinessPage/FinancingReadinessPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="risk-analysis" element={<RiskAnalysisPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="financing" element={<FinancingReadinessPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="recheck/:reportId" element={<RecheckPage />} />
        <Route path="result" element={<RiskResultPage />} />
        <Route path="suggestions" element={<SuggestionPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
