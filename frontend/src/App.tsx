import { useState } from 'react';
import { TabId } from './types/spacecare';
import { MOCK_ASTRONAUTS, MOCK_ALERTS, MOCK_MISSION_SUMMARY } from './services/mockTelemetry';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewDashboard } from './pages/OverviewDashboard';
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

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      crew={MOCK_ASTRONAUTS}
      selectedAstronautId={selectedAstronautId}
      onSelectAstronaut={setSelectedAstronautId}
      activeAlertCount={activeAlertCount}
    >
      {activeTab === 'overview' ? (
        <OverviewDashboard
          crew={MOCK_ASTRONAUTS}
          selectedAstronaut={selectedAstronaut}
          onSelectAstronaut={setSelectedAstronautId}
          alerts={MOCK_ALERTS}
          missionSummary={MOCK_MISSION_SUMMARY}
        />
      ) : (
        <PhaseNoticePlaceholder
          tabId={activeTab}
          tabLabel={tabLabels[activeTab]}
          onReturnToOverview={() => setActiveTab('overview')}
        />
      )}
    </DashboardLayout>
  );
}
