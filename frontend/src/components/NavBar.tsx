import { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

// Simple responsive navigation bar used on the landing page.
export default function NavBar() {
  const [open, setOpen] = useState(false);

  const navigateDashboard = () => {
    // Switch to the main dashboard view.
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'dashboard');
    // Keep any existing tab param if present.
    window.location.href = url.toString();
  };

  const handleLinkClick = (hash: string) => {
    // Close mobile menu then scroll to target section.
    setOpen(false);
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-space-bg/90 backdrop-blur-md border-b border-space-border px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-space-cyan/30 flex items-center justify-center shadow-nasa-glow">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-space-cyan" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l9 21H3L12 2z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-space-white">
          SPACE<span className="text-space-cyan">CARE</span>
        </span>
        <span className="hidden sm:inline-block text-xs uppercase font-mono text-space-muted bg-space-surface px-2 py-0.5 rounded">
          Astronaut Health Intelligence
        </span>
      </div>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6 text-space-muted">
        <button className="hover:text-space-white" onClick={() => handleLinkClick('home')}>Home</button>
        <button className="hover:text-space-white" onClick={() => handleLinkClick('features')}>Features</button>
        <button className="hover:text-space-white" onClick={() => handleLinkClick('nasa-data')}>NASA Data</button>
        <button className="hover:text-space-white" onClick={() => handleLinkClick('how-it-works')}>How It Works</button>
        <button className="hover:text-space-white" onClick={() => handleLinkClick('about')}>About</button>
        <button
          onClick={navigateDashboard}
          className="ml-4 px-4 py-1.5 bg-space-cyan text-space-bg font-medium rounded hover:bg-space-cyan/80 transition shadow-nasa-glow"
        >
          LAUNCH DASHBOARD
        </button>
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 rounded bg-space-surface hover:bg-space-surface-hover"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation menu"
      >
        {open ? <X className="w-5 h-5 text-space-white" /> : <Menu className="w-5 h-5 text-space-white" />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 w-full bg-space-bg border-b border-space-border md:hidden">
          <div className="flex flex-col p-4 space-y-3 text-space-muted">
            <button className="text-left hover:text-space-white" onClick={() => handleLinkClick('home')}>Home</button>
            <button className="text-left hover:text-space-white" onClick={() => handleLinkClick('features')}>Features</button>
            <button className="text-left hover:text-space-white" onClick={() => handleLinkClick('nasa-data')}>NASA Data</button>
            <button className="text-left hover:text-space-white" onClick={() => handleLinkClick('how-it-works')}>How It Works</button>
            <button className="text-left hover:text-space-white" onClick={() => handleLinkClick('about')}>About</button>
            <button
              onClick={navigateDashboard}
              className="mt-2 w-full text-center px-4 py-2 bg-space-cyan text-space-bg font-medium rounded hover:bg-space-cyan/80 transition"
            >
              LAUNCH DASHBOARD
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
