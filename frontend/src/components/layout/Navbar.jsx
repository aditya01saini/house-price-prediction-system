import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/predict', label: 'Predict Price' },
  { to: '/model', label: 'Model Insights' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/about', label: 'About' },
];

export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#020617" />
      <rect x="3" y="3" width="58" height="58" rx="12" fill="none" stroke="url(#logo-g)" strokeWidth="2.5" />
      <path
        d="M32 14 L14 30 h5 v16 a2 2 0 0 0 2 2 h8 v-10 a3 3 0 0 1 6 0 v10 h8 a2 2 0 0 0 2-2 V30 h5 Z"
        fill="url(#logo-g)"
      />
      <circle cx="47" cy="18" r="4" fill="#34d399" />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }) =>
    `relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
      isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100'
    }`;

  const activeDot = ({ isActive }) =>
    isActive ? <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-400" /> : null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
          <LogoMark />
          <span className="text-[1.05rem] font-bold tracking-tight text-white">
            HousePredict <span className="text-gradient">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {({ isActive }) => (
                <>
                  {link.label}
                  {activeDot({ isActive })}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:block">
          <Link to="/predict" className="btn-primary px-4 py-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M10 2a4 4 0 0 0-4 4v1H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1V6a4 4 0 0 0-4-4Zm-2.5 5V6a2.5 2.5 0 0 1 5 0v1h-5Z" />
            </svg>
            Predict Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-slate-950/95 px-4 pb-4 pt-2 backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link to="/predict" className="btn-primary mt-2 w-full">
              Predict Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
