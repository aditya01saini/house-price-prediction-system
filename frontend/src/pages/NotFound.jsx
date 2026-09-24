import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 pb-24 pt-24 text-center">
      <p className="text-gradient text-7xl font-extrabold tracking-tight sm:text-8xl">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-3 text-sm text-slate-400 sm:text-base">
        The address you followed doesn't exist in HousePredict AI. It may have been moved, or the link is incorrect.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn-primary">
          Back to Dashboard
        </Link>
        <Link to="/predict" className="btn-secondary">
          Predict a Price
        </Link>
      </div>
    </div>
  );
}
