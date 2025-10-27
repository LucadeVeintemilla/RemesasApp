import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, ClipboardList, ClipboardCheck, FileBarChart, Settings, LogOut, Sun, Moon } from 'lucide-react';
import logo from '../assets/logos.png';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Alumnos', icon: Users },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/remesas', label: 'Remesas', icon: ClipboardList },
  { to: '/delivery', label: 'Entrega', icon: ClipboardCheck },
  { to: '/reports', label: 'Reportes', icon: FileBarChart },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : false;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const sectionTitle = nav.find(n => n.to === pathname)?.label || 'Panel';

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 grid" style={{ gridTemplateColumns: collapsed ? '72px 1fr' : '260px 1fr' }}>
      <aside className="relative h-full border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 backdrop-blur shadow-sm transition-all">
        <div className="p-4 flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded object-cover" />
          {!collapsed && <div className="font-semibold">Remesas Escolar</div>}
        </div>
        <nav className="px-2 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const isActive = pathname === n.to;
            const base = 'flex items-center gap-3 px-3 py-2 rounded-md transition-colors';
            const active = 'bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-400';
            const normal = 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={`${base} ${isActive ? active : normal} ${n.disabled ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Icon size={18} />
                {!collapsed && <span>{n.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        <button
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow flex items-center justify-center"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <span className="text-xs">{collapsed ? '>' : '<'}</span>
        </button>
      </aside>

      <main className="h-full overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/50 backdrop-blur">
          <div className="text-lg font-semibold">{sectionTitle}</div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" title="Modo oscuro">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-sm">{user?.name}</div>
            <button onClick={logout} className="px-3 py-1 rounded-md bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2">
              <LogOut size={16} /> <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
