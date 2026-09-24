import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import ModelInsights from './pages/ModelInsights';
import Analytics from './pages/Analytics';
import About from './pages/About';
import NotFound from './pages/NotFound';

/** Scrolls to the top whenever the route changes. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/model" element={<ModelInsights />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
