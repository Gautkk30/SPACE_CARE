import NavBar from '../components/NavBar';
import { BarChart2, ShieldCheck, Mic, User2, Moon, Brain, Wind, HeartPulse, Cpu, AlertCircle } from 'lucide-react';
import OverviewDashboard from './OverviewDashboard';

export default function LandingPage() {
  const navigateDashboard = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'dashboard');
    window.location.href = url.toString();
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans text-space-white min-h-screen bg-space-bg">
      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/images/hero.jpg')" }}>
        <div className="absolute inset-0 bg-space-bg/70 backdrop-blur-sm" />
        <div className="relative z-10 text-center max-w-2xl px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-snug">
            Beyond Earth.<br />Beyond Limits.<br />Beyond Survival.
          </h1>
          <p className="mb-8 text-lg text-space-muted max-w-prose mx-auto">
            SPACECARE is an intelligent astronaut‑health monitoring and early‑warning platform that fuses NASA research, real‑time space‑environment data and AI‑driven anomaly detection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mx-auto">
            <button onClick={() => scrollTo('features')} className="px-6 py-2 bg-space-cyan text-space-bg font-medium rounded hover:bg-space-cyan/80 transition">
              Explore SPACECARE
            </button>
            <button onClick={navigateDashboard} className="px-6 py-2 bg-space-teal text-space-bg font-medium rounded hover:bg-space-teal/80 transition">
              Launch Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* The Challenge */}
      <section id="challenge" className="py-16 bg-space-surface">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">The Challenge</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-space-bg rounded-lg p-6 shadow-lg text-center">
              <Moon className="w-12 h-12 mx-auto mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">Microgravity</h3>
              <p className="text-sm text-space-muted">Muscle atrophy, bone loss and fluid shifts.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg text-center">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">Radiation Exposure</h3>
              <p className="text-sm text-space-muted">High‑energy particles threaten DNA.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg text-center">
              <Brain className="w-12 h-12 mx-auto mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">Mental Well‑being</h3>
              <p className="text-sm text-space-muted">Isolation and circadian disruption.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg text-center">
              <Wind className="w-12 h-12 mx-auto mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">Environmental Risks</h3>
              <p className="text-sm text-space-muted">CO₂, humidity, temperature control.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg text-center">
              <HeartPulse className="w-12 h-12 mx-auto mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">Physiological Changes</h3>
              <p className="text-sm text-space-muted">Cardiovascular, metabolic shifts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About SPACECARE */}
      <section id="about" className="py-16 bg-space-bg/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">About SPACECARE</h2>
          <p className="text-lg text-space-muted mb-4">
            SPACECARE combines NASA OSDR and CCMC DONKI research, simulated telemetry, and machine‑learning anomaly detection to provide early warnings for astronaut health.
          </p>
          <p className="text-lg text-space-muted">
            By integrating real space‑environment data with AI, crews and ground teams can anticipate and mitigate risks during long‑duration missions.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-16 bg-space-surface">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-space-bg rounded-lg p-6 shadow-lg flex flex-col items-center text-center">
              <HeartPulse className="w-10 h-10 mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">Astronaut Health Monitoring</h3>
              <p className="text-sm text-space-muted">Continuous vitals and biometrics.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg flex flex-col items-center text-center">
              <Wind className="w-10 h-10 mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">ISS Environmental Monitoring</h3>
              <p className="text-sm text-space-muted">Air quality, temperature, CO₂.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg flex flex-col items-center text-center">
              <BarChart2 className="w-10 h-10 mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">NASA OSDR Research</h3>
              <p className="text-sm text-space-muted">Human‑spaceflight datasets.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg flex flex-col items-center text-center">
              <Cpu className="w-10 h-10 mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">Space Radiation Monitoring</h3>
              <p className="text-sm text-space-muted">Real‑time particle flux.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg flex flex-col items-center text-center">
              <AlertCircle className="w-10 h-10 mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">ML Anomaly Detection</h3>
              <p className="text-sm text-space-muted">AI‑driven health alerts.</p>
            </div>
            <div className="bg-space-bg rounded-lg p-6 shadow-lg flex flex-col items-center text-center">
              <ShieldCheck className="w-10 h-10 mb-3 text-space-cyan" />
              <h3 className="font-semibold mb-2">Early Warning & Alerts</h3>
              <p className="text-sm text-space-muted">Proactive risk mitigation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Intelligence Preview */}
      <section id="preview" className="py-16 bg-space-bg/30">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Mission Intelligence Preview</h2>
          <p className="text-lg text-space-muted mb-8">A glimpse of the live dashboard powering real‑time astronaut health insights.</p>
          <div className="border border-space-cyan/30 rounded-lg overflow-hidden shadow-lg">
            <OverviewDashboard crew={[]} selectedAstronaut={null} onSelectAstronaut={() => {}} alerts={[]} missionSummary={null} />
          </div>
        </div>
      </section>

      {/* NASA Data Sources */}
      <section id="nasa-data" className="py-16 bg-space-surface">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">NASA Data Sources</h2>
          <ul className="list-disc list-inside text-left text-space-muted space-y-2">
            <li>NASA OSDR (Orbital Space Debris Radar)</li>
            <li>NASA CCMC DONKI (Space Weather Alerts)</li>
            <li>Additional verified NASA research datasets integrated in the backend.</li>
          </ul>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-16 bg-space-bg/30">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Meet the Team – CEACS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Beegum S. Rahmath','Abirami Anil','Gautham K. K.','Aadil Regi Hussain'].map(name => (
              <div key={name} className="bg-space-bg rounded-lg p-4 shadow-lg flex flex-col items-center">
                <div className="w-16 h-16 mb-3 rounded-full bg-space-cyan/20 flex items-center justify-center text-space-cyan font-bold text-xl">
                  {name.split(' ')[0][0]}
                </div>
                <h3 className="font-semibold">{name}</h3>
                <p className="text-sm text-space-muted">Team Member</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-space-cyan text-space-bg text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Explore the Future of Astronaut Health?</h2>
        <button onClick={navigateDashboard} className="mt-4 px-8 py-3 bg-space-bg text-space-cyan font-medium rounded hover:bg-space-bg/80 transition">
          Launch SPACECARE Dashboard
        </button>
      </section>
    </div>
  );
}
