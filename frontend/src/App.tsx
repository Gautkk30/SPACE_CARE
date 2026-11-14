import { useState } from 'react';
import { TabId } from './types/spacecare';
import { MOCK_ASTRONAUTS, MOCK_ALERTS, MOCK_MISSION_SUMMARY } from './services/mockTelemetry';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { CrewManagementPage } from './pages/CrewManagementPage';
import { VitalSignsPage } from './pages/VitalSignsPage';
import { CardiovascularPage } from './pages/CardiovascularPage';
import { BoneMusclePage } from './pages/BoneMusclePage';
import { RadiationPage } from './pages/RadiationPage';
import { MentalHealthSleepPage } from './pages/MentalHealthSleepPage';
import { PhaseNoticePlaceholder } from './components/dashboard/PhaseNoticePlaceholder';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>(MOCK_ASTRONAUTS[0].id);

  const selectedAstronaut =
    MOCK_ASTRONAUTS.find((a) => a.id === selectedAstronautId) || MOCK_ASTRONAUTS[0];

  const activeAlertCount = MOCK_ALERTS.filter((a) => !a.acknowledged).length;

  const tabLabels: Record<TabId, string> = {
    overview: 'Overview Dashboard',
    crew: 'Crew Management',
    vitals: 'Vital Signs',
    cardiovascular: 'Cardiovascular Health',
    'bone-muscle': 'Bone & Muscle Health',
    radiation: 'Radiation Monitoring',
    'mental-health': 'Mental Health & Sleep',
    'ai-analysis': 'AI Analysis',
    alerts: 'Alerts',
    reports: 'Health Reports',
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewDashboard
            crew={MOCK_ASTRONAUTS}
            selectedAstronaut={selectedAstronaut}
            onSelectAstronaut={setSelectedAstronautId}
            alerts={MOCK_ALERTS}
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
        return (
          <VitalSignsPage
            selectedAstronaut={selectedAstronaut}
          />
        );
      case 'cardiovascular':
        return (
          <CardiovascularPage
            selectedAstronaut={selectedAstronaut}
          />
        );
      case 'bone-muscle':
        return (
          <BoneMusclePage
            selectedAstronaut={selectedAstronaut}
          />
        );
      case 'radiation':
        return (
          <RadiationPage />
        );
      case 'mental-health':
        return (
          <MentalHealthSleepPage
            selectedAstronaut={selectedAstronaut}
          />
        );
      default:
        return (
          <PhaseNoticePlaceholder
            tabId={activeTab}
            tabLabel={tabLabels[activeTab]}
            onReturnToOverview={() => setActiveTab('overview')}
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
    >
      {renderActiveView()}
    </DashboardLayout>
  );
}
