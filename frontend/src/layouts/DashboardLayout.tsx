import { useState, useEffect, ReactNode, ComponentType } from 'react';
import { TabId, AstronautProfile } from '../types/spacecare';
import { ConnectionMode } from '../services/api';
import { useTelemetry } from '../context/TelemetryContext';
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  ClipboardEdit,
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
  FlaskConical,
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

  const { alerts } = useTelemetry();
  const unackAlertCount = alerts ? alerts.filter((a) => !a.acknowledged && a.status !== 'RESOLVED').length : activeAlertCount;

  const activeAstronaut = crew.find((m) => m.id === selectedAstronautId) || crew[0];
  const baseHr = activeAstronaut?.baseline_heart_rate ?? activeAstronaut?.baseline?.restingHeartRate ?? 72;
  const baseSys = activeAstronaut?.baseline_systolic_bp ?? activeAstronaut?.baseline?.restingSystolicBP ?? 120;
  const baseDia = activeAstronaut?.baseline_diastolic_bp ?? activeAstronaut?.baseline?.restingDiastolicBP ?? 78;
  const baseSpo2 = activeAstronaut?.baseline_spo2 ?? activeAstronaut?.baseline?.baselineSpO2 ?? 98.2;

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
    { id: 'manual-input', label: 'Manual Health Input', icon: ClipboardEdit },
    { id: 'hazard-lab', label: 'Hazard & Physiology Lab', icon: Flame },
    { id: 'cardiovascular', label: 'Cardiovascular Health', icon: Activity },
    { id: 'bone-muscle', label: 'Bone & Muscle Health', icon: Dumbbell },
    { id: 'radiation', label: 'Radiation Monitoring', icon: Sun },
    { id: 'mental-health', label: 'Mental Health & Sleep', icon: Brain },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Cpu },
    { id: 'alerts', label: 'Alerts', icon: ShieldAlert, badge: unackAlertCount },
    { id: 'reports', label: 'Health Reports', icon: FileText },
    { id: 'research', label: 'NASA OSDR Research', icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen bg-space-bg text-space-text flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#060911]/95 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Mission Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/25 border border-[#1A56DB]/40 flex items-center justify-center text-sky-400 shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base lg:text-lg text-white">
                  SPACE<span className="text-[#FC3D21]">CARE</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.1] font-mono">
                  NASA SPACE APPS &bull; 2026
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide hidden sm:block">
                Intelligent Astronaut Health Monitoring &amp; Early Warning
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right Telemetry Indicator, UTC Clock & Controls */}
        <div className="flex items-center gap-2 lg:gap-3.5 flex-wrap justify-end">
          {/* Backend Connection Status Pill */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border ${
              backendMode === 'LIVE_API'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : backendMode === 'API_HEALTHY_ROUTES_PENDING'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendMode === 'LIVE_API' 
                  ? 'bg-emerald-400 animate-ping' 
                  : backendMode === 'API_HEALTHY_ROUTES_PENDING'
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
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

          {/* Live Ticking UTC Telemetry Clock */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono tabular-nums text-slate-300 bg-white/[0.04] border border-white/[0.08]">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{currentUtc || 'SYNCING UTC...'}</span>
          </div>

          {/* Simulated Telemetry Badge */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#0B3D91]/20 text-sky-300 border border-[#1A56DB]/30">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">DATA:</span> SIMULATED TELEMETRY
          </div>

          {/* Compact Astronaut Baseline Reference Strip */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono tabular-nums">
            <span className="px-2 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-slate-300">
              <span className="text-slate-400">BASE HR:</span> <strong className="text-white">{baseHr}</strong> <span className="text-slate-400">bpm</span>
            </span>
            <span className="px-2 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-slate-300">
              <span className="text-slate-400">BP:</span> <strong className="text-white">{baseSys}/{baseDia}</strong>
            </span>
            <span className="px-2 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-slate-300">
              <span className="text-slate-400">SpO₂:</span> <strong className="text-white">{baseSpo2}%</strong>
            </span>
          </div>

          {/* Astronaut Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] rounded-lg px-2.5 py-1.5 text-xs transition">
              <span className="text-slate-400 text-[11px] font-mono uppercase tracking-wider hidden sm:inline">
                Crew ({crew.length}):
              </span>
              <select
                value={selectedAstronautId}
                onChange={(e) => onSelectAstronaut(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                {crew.map((member) => (
                  <option key={member.id} value={member.id} className="bg-[#0c1220] text-slate-200">
                    {member.name} ({member.callsign})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Active Alerts Pill */}
          <button
            onClick={() => onTabChange('alerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition ${
              unackAlertCount > 0
                ? 'bg-[#FC3D21]/15 text-[#FC3D21] border-[#FC3D21]/40 hover:bg-[#FC3D21]/25 animate-pulse'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white'
            }`}
            title="Active Warning Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="tabular-nums font-bold">{unackAlertCount}</span>
            <span className="hidden sm:inline">Alerts</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-[#080d19] border-r border-white/[0.08] flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{ top: '57px' }}
        >
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0B3D91]/40 via-[#0B3D91]/20 to-transparent text-white border-l-2 border-[#1A56DB] pl-2.5 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span className="tracking-wide">{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono tabular-nums bg-[#FC3D21]/15 text-[#FC3D21] border border-[#FC3D21]/40 shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-white/[0.08] text-[11px] text-slate-400 space-y-1 bg-[#060911]/60">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Framework</span>
              <span className="font-mono text-sky-400">NASA Insignia Suite</span>
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
