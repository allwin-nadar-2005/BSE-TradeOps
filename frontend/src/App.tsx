import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { LiveDashboard } from './pages/LiveDashboard';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RunsPage } from './pages/RunsPage';
import { RunDetailPage } from './pages/RunDetailPage';
import { PipelinePage } from './pages/PipelinePage';
import { TradesPage } from './pages/TradesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/live" element={<LiveDashboard />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="/runs/:id" element={<RunDetailPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/trades" element={<TradesPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
