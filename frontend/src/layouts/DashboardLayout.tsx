import { useState, useEffect, ReactNode, ComponentType } from 'react';
import { TabId, AstronautProfile } from '../types/spacecare';
import { ConnectionMode } from '../services/api';
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Flame,
  Activity,
  Dumbbell,
  Sun,
  Brain,
  Cpu,
  ShieldAlert,
  FileText,
  Menu,
  X,
  ChevronDown,
  Radio,
  Clock,
  Database,
  Bell,
} from 'lucide-react';

interface NavItem {
  id: TabId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  crew: AstronautProfile[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
  activeAlertCount: number;
  backendMode?: ConnectionMode;
}

export const DashboardLayout = ({
  children,
  activeTab,
  onTabChange,
  crew,
  selectedAstronautId,
  onSelectAstronaut,
  activeAlertCount,
  backendMode = 'OFFLINE_DEMO_FALLBACK',
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUtc, setCurrentUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtc(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'crew', label: 'Crew Management', icon: Users },
    { id: 'vitals', label: 'Vital Signs', icon: HeartPulse },
    { id: 'hazard-lab', label: 'Hazard & Physiology Lab', icon: Flame },
    { id: 'cardiovascular', label: 'Cardiovascular Health', icon: Activity },
    { id: 'bone-muscle', label: 'Bone & Muscle Health', icon: Dumbbell },
    { id: 'radiation', label: 'Radiation Monitoring', icon: Sun },
    { id: 'mental-health', label: 'Mental Health & Sleep', icon: Brain },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Cpu },
    { id: 'alerts', label: 'Alerts', icon: ShieldAlert, badge: activeAlertCount },
    { id: 'reports', label: 'Health Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-space-bg text-space-text flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-space-panel/95 backdrop-blur border-b border-space-border px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-space-bg border border-space-border text-space-muted hover:text-space-text"
            aria-label="Toggle Navigation Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Mission Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-space-cyan-muted border border-space-cyan/40 flex items-center justify-center text-space-cyan">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base lg:text-lg text-white">
                  SPACECARE
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
                  ISS EXPEDITION &bull; DEMO
                </span>
              </div>
              <p className="text-[10px] text-space-dim hidden sm:block">
                Intelligent Astronaut Health Monitoring & Early Warning
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right Telemetry Indicator, UTC Clock & Controls */}
        <div className="flex items-center gap-2.5 lg:gap-4">
          {/* Backend Connection Status Pill */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border ${
              backendMode === 'LIVE_API'
                ? 'bg-space-emerald-muted text-space-emerald border-space-emerald/40'
                : backendMode === 'API_HEALTHY_ROUTES_PENDING'
                ? 'bg-space-amber-muted text-space-amber border-space-amber/40'
                : 'bg-space-bg text-space-dim border-space-border'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendMode === 'LIVE_API' 
                  ? 'bg-space-emerald animate-ping' 
                  : backendMode === 'API_HEALTHY_ROUTES_PENDING'
                  ? 'bg-space-amber'
                  : 'bg-space-dim'
              }`}
            />
            <span>
              {backendMode === 'LIVE_API'
                ? 'BACKEND: LIVE API (VERIFIED)'
                : backendMode === 'API_HEALTHY_ROUTES_PENDING'
                ? 'BACKEND: ONLINE (ROUTES PENDING)'
                : 'BACKEND: OFFLINE DEMO FALLBACK'}
            </span>
          </div>

          {/* Simulated Telemetry Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DATA:</span> SIMULATED TELEMETRY
          </div>

          {/* Live Mission Clock */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-space-muted bg-space-bg px-3 py-1.5 rounded-lg border border-space-border">
            <Clock className="w-3.5 h-3.5 text-space-cyan" />
            <span>{currentUtc || 'SYNCING UTC...'}</span>
          </div>

          {/* Astronaut Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-space-bg border border-space-border rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-space-dim hidden sm:inline">Crew:</span>
              <select
                value={selectedAstronautId}
                onChange={(e) => onSelectAstronaut(e.target.value)}
                className="bg-transparent text-space-text font-semibold focus:outline-none cursor-pointer text-xs"
              >
                {crew.map((member) => (
                  <option key={member.id} value={member.id} className="bg-space-panel text-space-text">
                    {member.name} ({member.callsign})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-space-dim pointer-events-none" />
            </div>
          </div>

          {/* Active Alerts Pill */}
          <button
            onClick={() => onTabChange('alerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              activeAlertCount > 0
                ? 'bg-space-amber-muted text-space-amber border-space-amber/40 hover:bg-space-amber-muted/80 animate-pulse'
                : 'bg-space-bg text-space-muted border-space-border hover:text-space-text'
            }`}
            title="Active Warning Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{activeAlertCount}</span>
            <span className="hidden sm:inline">Alerts</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-space-panel border-r border-space-border flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{ top: '57px' }}
        >
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-space-dim">
              Mission Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-space-cyan-muted text-space-cyan border border-space-cyan/30 shadow-sm font-semibold'
                      : 'text-space-muted hover:text-space-text hover:bg-space-panel-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-space-cyan' : 'text-space-dim'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-space-amber-muted text-space-amber border border-space-amber/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-space-border/60 text-[11px] text-space-dim space-y-1 bg-space-bg/40">
            <div className="flex items-center justify-between">
              <span className="text-space-muted font-medium">Framework</span>
              <span className="font-mono text-space-cyan">Production Suite</span>
            </div>
            <div className="flex items-center justify-between">
              <span>NASA Challenge</span>
              <span className="font-mono text-space-muted">2026 Submission</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-10 bg-black/60 lg:hidden"
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-space-bg">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
