import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Building2, FileText, Wallet } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Documents from './pages/Documents';
import Finances from './pages/Finances';
import { useTranslation } from './hooks/useTranslation';

function App() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Home, label: t('app.dashboard') },
    { path: '/properties', icon: Building2, label: t('app.properties') },
    { path: '/finanzen', icon: Wallet, label: t('app.finances') },
    { path: '/documents', icon: FileText, label: t('app.documents') },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" />
            {t('app.title')}
          </h1>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/finanzen" element={<Finances />} />
          <Route path="/documents" element={<Documents />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
