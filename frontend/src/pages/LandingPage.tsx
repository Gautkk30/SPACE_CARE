import NavBar from '../components/NavBar';
import { BarChart2, ShieldCheck, Mic, User2 } from 'lucide-react';

export default function LandingPage() {
  const navigateDashboard = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'dashboard');
    window.location.href = url.toString();
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="font-sans text-space-white">
      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <section
        id="home"
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero.jpg')" }}
      >
        <div className="absolute inset-0 bg-space-bg/70 backdrop-blur-sm" />
        <div className="relative z-10 text-center max-w-2xl px-4">
          <div className="inline-block bg-space-cyan/20 px-3 py-1 rounded text-xs uppercase tracking-wider mb-4">
            ASTRONAUT HEALTH INTELLIGENCE SYSTEM
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
            BEYOND EARTH.<br />
            BEYOND LIMITS.<br />
            BEYOND RISK.
          </h1>
          <p className="mb-8 text-lg text-space-muted max-w-prose mx-auto">
            An intelligent health‑monitoring platform designed to support astronaut wellbeing through NASA research, space‑weather data and AI‑powered anomaly awareness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mx-auto">
            <button
              onClick={() => scrollTo('features')}
              className="px-6 py-2 bg-space-cyan text-space-bg font-medium rounded hover:bg-space-cyan/80 transition"
            >
              EXPLORE SPACECARE
            </button>
            <button
              onClick={navigateDashboard}
              className="px-6 py-2 bg-space-teal text-space-bg font-medium rounded hover:bg-space-teal/80 transition"
            >
              VIEW MISSION DASHBOARD
            </button>
          </div>
          {/* Capability indicators */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 justify-center">
              <BarChart2 className="w-5 h-5 text-space-cyan" /> NASA DATA INTEGRATION
            </div>
            <div className="flex items-center gap-2 justify-center">
              <ShieldCheck className="w-5 h-5 text-space-cyan" /> HEALTH MONITORING
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Mic className="w-5 h-5 text-space-cyan" /> ML ANOMALY DETECTION
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section id="challenge" className="py-20 bg-space-bg/60">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">THE CHALLENGE</h2>
          <p className="text-lg text-space-muted mb-8">
            Space is extraordinary. But it is demanding on the human body.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Cardiovascular Changes</h3>
              <p className="text-sm text-space-muted">Microgravity can affect heart function and circulation.</p>
            </div>
            {/* Card 2 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Bone &amp; Muscle Loss</h3>
              <p className="text-sm text-space-muted">Reduced gravitational loading contributes to bone and muscle deterioration.</p>
            </div>
            {/* Card 3 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Space Radiation</h3>
              <p className="text-sm text-space-muted">Radiation exposure and solar activity create additional mission‑health concerns.</p>
            </div>
            {/* Card 4 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Mental Wellbeing</h3>
              <p className="text-sm text-space-muted">Isolation, confinement and disrupted sleep can affect psychological wellbeing.</p>
            </div>
            {/* Card 5 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Environmental Risks</h3>
              <p className="text-sm text-space-muted">Changes in spacecraft environmental conditions require monitoring.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-space-bg/90">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">ONE MISSION. ONE INTELLIGENT PLATFORM.</h2>
          <div className="flex flex-col items-center space-y-6">
            {/* First row – three cards */}
            <div className="flex flex-wrap justify-center gap-6">
              {/* Feature 1 */}
              <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
                <h3 className="text-xl font-semibold mb-2">Astronaut Vitals</h3>
                <p className="text-sm text-space-muted">Monitor and visualize heart rate, blood pressure, SpO₂, temperature and other telemetry.</p>
              </div>
              {/* Feature 2 */}
              <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
                <h3 className="text-xl font-semibold mb-2">ISS Environment</h3>
                <p className="text-sm text-space-muted">Explore environmental readings and system conditions.</p>
              </div>
              {/* Feature 3 */}
              <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
                <h3 className="text-xl font-semibold mb-2">NASA Research</h3>
                <p className="text-sm text-space-muted">Access spaceflight‑related biological research through NASA OSDR.</p>
              </div>
            </div>
            {/* Second row – two cards centered */}
            <div className="flex flex-wrap justify-center gap-6">
              {/* Feature 4 */}
              <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
                <h3 className="text-xl font-semibold mb-2">Space Weather</h3>
                <p className="text-sm text-space-muted">Explore solar activity and CME events using NASA CCMC DONKI.</p>
              </div>
              {/* Feature 5 */}
              <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
                <h3 className="text-xl font-semibold mb-2">ML Anomaly Detection</h3>
                <p className="text-sm text-space-muted">Identify unusual patterns in astronaut telemetry.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        id="home"
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero.jpg')" }}
      >
        <div className="absolute inset-0 bg-space-bg/70 backdrop-blur-sm" />
        <div className="relative z-10 text-center max-w-2xl px-4">
          <div className="inline-block bg-space-cyan/20 px-3 py-1 rounded text-xs uppercase tracking-wider mb-4">
            ASTRONAUT HEALTH INTELLIGENCE SYSTEM
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
            BEYOND EARTH.<br />
            BEYOND LIMITS.<br />
            BEYOND RISK.
          </h1>
          <p className="mb-8 text-lg text-space-muted max-w-prose mx-auto">
            An intelligent health‑monitoring platform designed to support astronaut wellbeing through NASA research, space‑weather data and AI‑powered anomaly awareness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo('features')}
              className="px-6 py-2 bg-space-cyan text-space-bg font-medium rounded hover:bg-space-cyan/80 transition"
            >
              EXPLORE SPACECARE
            </button>
            <button
              onClick={navigateDashboard}
              className="px-6 py-2 bg-space-teal text-space-bg font-medium rounded hover:bg-space-teal/80 transition"
            >
              VIEW MISSION DASHBOARD
            </button>
          </div>
          {/* Capability indicators */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 justify-center">
              <BarChart2 className="w-5 h-5 text-space-cyan" /> NASA DATA INTEGRATION
            </div>
            <div className="flex items-center gap-2 justify-center">
              <ShieldCheck className="w-5 h-5 text-space-cyan" /> HEALTH MONITORING
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Mic className="w-5 h-5 text-space-cyan" /> ML ANOMALY DETECTION
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section id="challenge" className="py-20 bg-space-bg/60">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">THE CHALLENGE</h2>
          <p className="text-lg text-space-muted mb-8">
            Space is extraordinary. But it is demanding on the human body.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Cardiovascular Changes</h3>
              <p className="text-sm text-space-muted">Microgravity can affect heart function and circulation.</p>
            </div>
            {/* Card 2 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Bone & Muscle Loss</h3>
              <p className="text-sm text-space-muted">Reduced gravitational loading contributes to bone and muscle deterioration.</p>
            </div>
            {/* Card 3 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Space Radiation</h3>
              <p className="text-sm text-space-muted">Radiation exposure and solar activity create additional mission‑health concerns.</p>
            </div>
            {/* Card 4 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Mental Wellbeing</h3>
              <p className="text-sm text-space-muted">Isolation, confinement and disrupted sleep can affect psychological wellbeing.</p>
            </div>
            {/* Card 5 */}
            <div className="nasa-card p-4 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">Environmental Risks</h3>
              <p className="text-sm text-space-muted">Changes in spacecraft environmental conditions require monitoring.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-space-bg/90">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">ONE MISSION. ONE INTELLIGENT PLATFORM.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
              <h3 className="text-xl font-semibold mb-2">Astronaut Vitals</h3>
              <p className="text-sm text-space-muted">Monitor and visualize heart rate, blood pressure, SpO₂, temperature and other telemetry.</p>
            </div>
            {/* Feature 2 */}
            <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
              <h3 className="text-xl font-semibold mb-2">ISS Environment</h3>
              <p className="text-sm text-space-muted">Explore environmental readings and system conditions.</p>
            </div>
            {/* Feature 3 */}
            <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
              <h3 className="text-xl font-semibold mb-2">NASA Research</h3>
              <p className="text-sm text-space-muted">Access spaceflight‑related biological research through NASA OSDR.</p>
            </div>
            {/* Feature 4 */}
            <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
              <h3 className="text-xl font-semibold mb-2">Space Weather</h3>
              <p className="text-sm text-space-muted">Explore solar activity and CME events using NASA CCMC DONKI.</p>
            </div>
            {/* Feature 5 */}
            <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
              <h3 className="text-xl font-semibold mb-2">ML Anomaly Detection</h3>
              <p className="text-sm text-space-muted">Identify unusual patterns in astronaut telemetry.</p>
            </div>
            {/* Feature 6 */}
            <div className="nasa-card p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigateDashboard()}>
              <h3 className="text-xl font-semibold mb-2">Early Warning System</h3>
              <p className="text-sm text-space-muted">Highlight abnormal conditions and important alerts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Intelligence Preview */}
      <section id="preview" className="py-20 bg-space-bg/60">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">MISSION INTELLIGENCE AT A GLANCE</h2>
          <p className="text-lg text-space-muted mb-8">
            Real‑time overview of vitals, environment, space weather, ML alerts and recent notifications.
          </p>
          {/* Reuse existing dashboard components in a compact layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Placeholder for OverviewStatsCards – they will load data via existing services */}
            <div className="nasa-card p-4">
              {/* The existing OverviewStatsCards component is imported inside the dashboard, but we can render it directly here if desired.
                  For simplicity we render a stub that will be replaced by real components later. */}
              <p className="text-sm text-space-muted">[Overview stats will appear here]</p>
            </div>
            <div className="nasa-card p-4">
              <p className="text-sm text-space-muted">[Environmental & alerts preview]</p>
            </div>
          </div>
          <button
            onClick={navigateDashboard}
            className="mt-8 px-6 py-2 bg-space-cyan text-space-bg font-medium rounded hover:bg-space-cyan/80 transition"
          >
            ENTER MISSION CONTROL →
          </button>
        </div>
      </section>

      {/* NASA Data Integration */}
      <section id="nasa-data" className="py-20 bg-space-bg/90">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">BUILT ON SPACE SCIENCE. INSPIRED BY NASA.</h2>
          <p className="text-lg text-space-muted mb-8">
            SPACECARE connects astronaut health awareness with scientific research and publicly available NASA information.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="nasa-card p-4">
              <h3 className="font-semibold mb-2">NASA OSDR</h3>
              <p className="text-sm text-space-muted">Open Science Data Repository – biological and human research datasets.</p>
            </div>
            <div className="nasa-card p-4">
              <h3 className="font-semibold mb-2">NASA CCMC DONKI</h3>
              <p className="text-sm text-space-muted">Space‑weather event information, including CME events.</p>
            </div>
            <div className="nasa-card p-4">
              <h3 className="font-semibold mb-2">NASA Environmental Research</h3>
              <p className="text-sm text-space-muted">Relevant environmental and ISS research data.</p>
            </div>
          </div>
          <button
            onClick={() => scrollTo('nasa-data')}
            className="mt-6 px-4 py-2 bg-space-teal text-space-bg font-medium rounded hover:bg-space-teal/80 transition"
          >
            EXPLORE DATA SOURCES
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-space-bg/60">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">FROM DATA TO AWARENESS</h2>
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            {[
              { step: '01', title: 'DATA COLLECTION', desc: 'NASA datasets, API responses and simulated telemetry.' },
              { step: '02', title: 'PROCESSING', desc: 'Backend services organize and process the available information.' },
              { step: '03', title: 'INTELLIGENCE', desc: 'Machine learning identifies unusual patterns where implemented.' },
              { step: '04', title: 'VISUALIZATION', desc: 'Interactive dashboards present readings and relevant context.' },
              { step: '05', title: 'EARLY WARNING', desc: 'Important abnormal conditions are highlighted for review.' },
            ].map(item => (
              <div key={item.step} className="flex-1 bg-space-panel p-4 rounded shadow-nasa-card">
                <div className="text-2xl font-bold text-space-cyan mb-2">{item.step}</div>
                <div className="font-semibold mb-1">{item.title}</div>
                <p className="text-sm text-space-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / About SPACECARE Section */}
      <section id="about" className="py-20 bg-space-bg/90">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">ABOUT SPACECARE</h2>
          <h3 className="text-2xl font-semibold mb-4 text-space-cyan">BUILT BY EXPLORERS. DESIGNED FOR THE FUTURE.</h3>
          <p className="text-lg text-space-muted mb-8 max-w-3xl mx-auto">
            SPACECARE is a space‑health intelligence prototype developed for the NASA Space Apps Challenge 2026. Our goal is to bring together NASA research, space‑weather information, environmental data and machine‑learning‑based anomaly awareness into one unified platform.
            <br/><br/>
            We believe that protecting astronaut health is an essential part of making future space exploration safer and more sustainable.
          </p>
          <h4 className="text-xl font-bold mb-4 text-space-cyan">TEAM CEACS</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Team Member 1 */}
            <div className="nasa-card p-6 hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-space-cyan/20 flex items-center justify-center mb-4">
                  <User2 className="w-8 h-8 text-space-cyan" />
                </div>
                <h3 className="font-semibold">Beegum S. Rahmath</h3>
              </div>
            </div>
            {/* Team Member 2 */}
            <div className="nasa-card p-6 hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-space-cyan/20 flex items-center justify-center mb-4">
                  <User2 className="w-8 h-8 text-space-cyan" />
                </div>
                <h3 className="font-semibold">Abhirami Anil</h3>
              </div>
            </div>
            {/* Team Member 3 */}
            <div className="nasa-card p-6 hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-space-cyan/20 flex items-center justify-center mb-4">
                  <User2 className="w-8 h-8 text-space-cyan" />
                </div>
                <h3 className="font-semibold">Gautham K. K.</h3>
              </div>
            </div>
            {/* Team Member 4 */}
            <div className="nasa-card p-6 hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-space-cyan/20 flex items-center justify-center mb-4">
                  <User2 className="w-8 h-8 text-space-cyan" />
                </div>
                <h3 className="font-semibold">Aadil Regi Hussain</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-20 bg-space-bg/90">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Meet CEACS</h2>
          <p className="text-lg text-space-muted mb-8 max-w-3xl mx-auto">
            Meet CEACS — the team behind SPACECARE. We are a group of passionate innovators working to explore how NASA data, artificial intelligence, and technology can contribute to astronaut health monitoring and safer human space exploration.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Team Member 1 */}
            <div className="nasa-card p-6 hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-space-cyan/20 flex items-center justify-center mb-4">
                  <User2 className="w-8 h-8 text-space-cyan" />
                </div>
                <h3 className="font-semibold">Beegum S. Rahmath</h3>
              </div>
            </div>
            {/* Team Member 2 */}
            <div className="nasa-card p-6 hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-space-cyan/20 flex items-center justify-center mb-4">
                  <User2 className="w-8 h-8 text-space-cyan" />
                </div>
                <h3 className="font-semibold">Abhirami Anil</h3>
              </div>
            </div>
            {/* Team Member 3 */}
            <div className="nasa-card p-6 hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-space-cyan/20 flex items-center justify-center mb-4">
                  <User2 className="w-8 h-8 text-space-cyan" />
                </div>
                <h3 className="font-semibold">Gautham K. K.</h3>
              </div>
            </div>
            {/* Team Member 4 */}
            <div className="nasa-card p-6 hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-space-cyan/20 flex items-center justify-center mb-4">
                  <User2 className="w-8 h-8 text-space-cyan" />
                </div>
                <h3 className="font-semibold">Aadil Regi Hussain</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" className="relative h-96 flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/images/closing.jpg')" }}>
        <div className="absolute inset-0 bg-space-bg/80 backdrop-blur-md" />
        <div className="relative z-10 text-center max-w-xl px-4">
          <h2 className="text-4xl font-extrabold mb-4">THE FUTURE OF SPACE EXPLORATION STARTS WITH CREW HEALTH.</h2>
          <p className="mb-6 text-lg text-space-muted">
            Explore the technology designed to support those who venture beyond Earth.
          </p>
          <button
            onClick={navigateDashboard}
            className="px-6 py-2 bg-space-cyan text-space-bg font-medium rounded hover:bg-space-cyan/80 transition"
          >
            LAUNCH SPACECARE DASHBOARD
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-space-bg/90 py-6 text-center text-xs text-space-muted">
        <p>SPACECARE • NASA Space Apps Challenge 2026 • Protecting the People Who Explore Beyond Earth.</p>
      </footer>
    </div>
  );
}
