import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import OverviewPage from './pages/admin/OverviewPage';
import AirportsPage from './pages/admin/AirportsPage';
import PortsPage from './pages/admin/PortsPage';
import DatasetsPage from './pages/admin/DatasetsPage';
import RoutesPage from './pages/admin/RoutesPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';
import DemandForecastingPage from './pages/admin/DemandForecastingPage';
import ScenarioModelingPage from './pages/admin/ScenarioModelingPage';
import CapacityPlanningPage from './pages/admin/CapacityPlanningPage';
import CorridorAnalysisPage from './pages/admin/CorridorAnalysisPage';
import InfrastructureGapPage from './pages/admin/InfrastructureGapPage';
import FeedbackPage from './pages/admin/FeedbackPage';
import QueriesPage from './pages/admin/QueriesPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import PublicDashboard from './pages/public/PublicDashboard';
import UserDashboard from './pages/UserDashboard';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/user-dashboard" />;
  return children;
}

function ViewerRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<PublicDashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/user-dashboard" element={<ViewerRoute><UserDashboard /></ViewerRoute>} />

        <Route path="/admin" element={
          <PrivateRoute><AdminLayout /></PrivateRoute>
        }>
          <Route index element={<OverviewPage />} />
          <Route path="demand-forecasting" element={<DemandForecastingPage />} />
          <Route path="scenario-modeling" element={<ScenarioModelingPage />} />
          <Route path="airports" element={<AirportsPage />} />
          <Route path="ports" element={<PortsPage />} />
          <Route path="capacity-planning" element={<CapacityPlanningPage />} />
          <Route path="corridor-analysis" element={<CorridorAnalysisPage />} />
          <Route path="infrastructure-gaps" element={<InfrastructureGapPage />} />
          <Route path="datasets" element={<DatasetsPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="queries" element={<QueriesPage />} />
          <Route path="user-management" element={<UserManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
