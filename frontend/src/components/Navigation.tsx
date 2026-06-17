import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  PenTool,
  BarChart3,
  CheckSquare,
  MessageSquare,
  Receipt,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/onboarding', icon: UserPlus, label: 'Client Onboarding' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/content', icon: PenTool, label: 'Content Creation' },
  { to: '/seo', icon: BarChart3, label: 'SEO Reporting' },
  { to: '/tasks', icon: CheckSquare, label: 'Task Management' },
  { to: '/communications', icon: MessageSquare, label: 'Communications' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">AgencyOps</h1>
            <p className="text-xs text-slate-500">White-Label Platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg bg-brand-50 p-3">
            <p className="text-xs font-semibold text-brand-800">Powered by AI</p>
            <p className="mt-0.5 text-xs text-brand-600">Groq · Llama 3.1 70B</p>
          </div>
        </div>
      </aside>
    </>
  );
}
