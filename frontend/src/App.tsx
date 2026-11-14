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
import { HazardSimulatorPage } from './pages/HazardSimulatorPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>(MOCK_ASTRONAUTS[0].id);
  const [alerts, setAlerts] = useState<HealthAlert[]>(MOCK_ALERTS);
  const [backendMode, setBackendMode] = useState<ConnectionMode>('OFFLINE_DEMO_FALLBACK');

  // Probe backend connection health on startup and periodically
  useEffect(() => {
    const checkStatus = () => {
      spacecareApi.checkBackendHealth().then((res) => {
        setBackendMode(res.state);
      });
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedAstronaut =
    MOCK_ASTRONAUTS.find((a) => a.id === selectedAstronautId) || MOCK_ASTRONAUTS[0];

  const handleAcknowledgeAlert = async (alertId: string) => {
    // If connected to LIVE_API, invoke the actual PATCH route
    if (backendMode === 'LIVE_API') {
      try {
        await spacecareApi.acknowledgeAlert(alertId);
      } catch (e) {
        console.error('Failed to acknowledge alert on backend:', e);
      }
    }
    // Update local state (optimistic or fallback in-memory)
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
        return <VitalSignsPage selectedAstronaut={selectedAstronaut} backendMode={backendMode} />;
      case 'hazard-lab':
        return (
          <HazardSimulatorPage
            crew={MOCK_ASTRONAUTS}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={setSelectedAstronautId}
            backendMode={backendMode}
          />
        );
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
            backendMode={backendMode}
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
