import { useState, useEffect } from 'react';
import { TabId, HealthAlert } from './types/spacecare';
import { MOCK_ASTRONAUTS, MOCK_ALERTS, MOCK_MISSION_SUMMARY } from './services/mockTelemetry';
import { spacecareApi, ConnectionMode } from './services/api';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { CrewManagementPage } from './pages/CrewManagementPage';
import { VitalSignsPage } from './pages/VitalSignsPage';
import { CardiovascularPage } from './pages/CardiovascularPage';
import { BoneMusclePage } from './pages/BoneMusclePage';
import { RadiationPage } from './pages/RadiationPage';
import { MentalHealthSleepPage } from './pages/MentalHealthSleepPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { AlertsPage } from './pages/AlertsPage';
import { HealthReportsPage } from './pages/HealthReportsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>(MOCK_ASTRONAUTS[0].id);
  const [alerts, setAlerts] = useState<HealthAlert[]>(MOCK_ALERTS);
  const [backendMode, setBackendMode] = useState<ConnectionMode>('SIMULATED_FALLBACK');

  // Probe backend connection health on startup
  useEffect(() => {
    spacecareApi.checkBackendHealth().then((res) => {
      setBackendMode(res.online ? 'LIVE_BACKEND' : 'SIMULATED_FALLBACK');
    });
  }, []);

  const selectedAstronaut =
    MOCK_ASTRONAUTS.find((a) => a.id === selectedAstronautId) || MOCK_ASTRONAUTS[0];

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledged: true } : a))
    );
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED', acknowledged: true } : a))
    );
  };

  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewDashboard
            crew={MOCK_ASTRONAUTS}
            selectedAstronaut={selectedAstronaut}
            onSelectAstronaut={setSelectedAstronautId}
            alerts={alerts}
            missionSummary={MOCK_MISSION_SUMMARY}
          />
        );
      case 'crew':
        return (
          <CrewManagementPage
            crew={MOCK_ASTRONAUTS}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={setSelectedAstronautId}
            onNavigateTab={setActiveTab}
          />
        );
      case 'vitals':
        return <VitalSignsPage selectedAstronaut={selectedAstronaut} />;
      case 'cardiovascular':
        return <CardiovascularPage selectedAstronaut={selectedAstronaut} />;
      case 'bone-muscle':
        return <BoneMusclePage selectedAstronaut={selectedAstronaut} />;
      case 'radiation':
        return <RadiationPage />;
      case 'mental-health':
        return <MentalHealthSleepPage selectedAstronaut={selectedAstronaut} />;
      case 'ai-analysis':
        return <AIAnalysisPage selectedAstronaut={selectedAstronaut} />;
      case 'alerts':
        return (
          <AlertsPage
            alerts={alerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onResolveAlert={handleResolveAlert}
          />
        );
      case 'reports':
        return (
          <HealthReportsPage
            crew={MOCK_ASTRONAUTS}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={setSelectedAstronautId}
          />
        );
      default:
        return (
          <OverviewDashboard
            crew={MOCK_ASTRONAUTS}
            selectedAstronaut={selectedAstronaut}
            onSelectAstronaut={setSelectedAstronautId}
            alerts={alerts}
            missionSummary={MOCK_MISSION_SUMMARY}
          />
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      crew={MOCK_ASTRONAUTS}
      selectedAstronautId={selectedAstronautId}
      onSelectAstronaut={setSelectedAstronautId}
      activeAlertCount={activeAlertCount}
      backendMode={backendMode}
    >
      {renderActiveView()}
    </DashboardLayout>
  );
}
