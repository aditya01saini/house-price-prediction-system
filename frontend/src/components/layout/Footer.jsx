import { Link } from 'react-router-dom';
import { LogoMark } from './Navbar';

const FOOTER_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/predict', label: 'Predict Price' },
  { to: '/model', label: 'Model Insights' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/about', label: 'About' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-bold text-white">
              HousePredict <span className="text-gradient">AI</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-400">
            Smart Property Valuation Powered by Machine Learning.
          </p>
        </div>

        <nav aria-label="Footer">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Explore</h3>
          <ul className="mt-3 space-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-slate-400 transition-colors hover:text-emerald-300">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Built with</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {['React', 'Tailwind CSS', 'Recharts', 'FastAPI', 'scikit-learn', 'Joblib'].map((tech) => (
              <li key={tech} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} HousePredict AI · House Price Prediction System · For educational/demo use —
        estimates are model outputs, not valuations.
      </div>
    </footer>
  );
}
