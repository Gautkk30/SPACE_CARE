import { useState } from 'react';
import { TabId } from './types/spacecare';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
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
import { ManualHealthInputPage } from './pages/ManualHealthInputPage';
import LandingPage from './pages/LandingPage';

function SpacecareAppContent() {
  // Determine initial tab from URL query param (e.g., ?view=dashboard&tab=vitals)
  const params = new URLSearchParams(window.location.search);
  const initialTab = (params.get('tab') as TabId) || 'overview';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const {
    crew,
    selectedAstronautId,
    setSelectedAstronautId,
    selectedAstronaut,
    alerts,
    activeAlertCount,
    missionSummary,
    backendMode,
    recordTelemetryReading,
    acknowledgeAlert,
    resolveAlert,
  } = useTelemetry();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewDashboard
            crew={crew}
            selectedAstronaut={selectedAstronaut}
            onSelectAstronaut={setSelectedAstronautId}
            alerts={alerts}
            missionSummary={missionSummary}
          />
        );
      case 'crew':
        return (
          <CrewManagementPage
            crew={crew}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={setSelectedAstronautId}
            onNavigateTab={setActiveTab}
          />
        );
      case 'vitals':
        return <VitalSignsPage selectedAstronaut={selectedAstronaut} backendMode={backendMode} />;
      case 'manual-input':
        return (
          <ManualHealthInputPage
            crew={crew}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={setSelectedAstronautId}
            onReadingSubmitted={recordTelemetryReading}
            backendMode={backendMode}
          />
        );
      case 'hazard-lab':
        return (
          <HazardSimulatorPage
            crew={crew}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={setSelectedAstronautId}
            backendMode={backendMode}
          />
        );
      case 'cardiovascular':
        return <CardiovascularPage selectedAstronaut={selectedAstronaut} />;
      case 'bone-muscle':
        return <BoneMusclePage selectedAstronaut={selectedAstronaut} onNavigateTab={setActiveTab} />;
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
            onAcknowledgeAlert={acknowledgeAlert}
            onResolveAlert={resolveAlert}
            backendMode={backendMode}
          />
        );
      case 'reports':
        return (
          <HealthReportsPage
            crew={crew}
            selectedAstronautId={selectedAstronautId}
            onSelectAstronaut={setSelectedAstronautId}
          />
        );
      case 'research':
        return <Osd946QcDashboard />;
      default:
        return (
          <OverviewDashboard
            crew={crew}
            selectedAstronaut={selectedAstronaut}
            onSelectAstronaut={setSelectedAstronautId}
            alerts={alerts}
            missionSummary={missionSummary}
          />
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      crew={crew}
      selectedAstronautId={selectedAstronautId}
      onSelectAstronaut={setSelectedAstronautId}
      activeAlertCount={activeAlertCount}
      backendMode={backendMode}
    >
      {renderActiveView()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <TelemetryProvider>
      <SpacecareAppContent />
    </TelemetryProvider>
  );
}
