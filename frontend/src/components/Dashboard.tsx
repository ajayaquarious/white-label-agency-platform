import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  FileText,
  PenTool,
  BarChart3,
  CheckSquare,
  MessageSquare,
  Receipt,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api, DashboardStats } from '../lib/api';

const modules = [
  {
    title: 'Client Onboarding',
    description: 'Automate intake, documents & project setup',
    icon: UserPlus,
    path: '/onboarding',
    color: 'bg-blue-500',
    stat: '2-3 days → automated',
  },
  {
    title: 'Proposal Generation',
    description: 'AI-powered proposals in minutes',
    icon: FileText,
    path: '/proposals',
    color: 'bg-violet-500',
    stat: '4-6 hrs → AI-generated',
  },
  {
    title: 'Content Creation',
    description: 'Blog, social & ad copy with approval flow',
    icon: PenTool,
    path: '/content',
    color: 'bg-emerald-500',
    stat: 'AI + workflow',
  },
  {
    title: 'SEO Reporting',
    description: 'Keyword tracking & competitor analysis',
    icon: BarChart3,
    path: '/seo',
    color: 'bg-amber-500',
    stat: 'n8n automation',
  },
  {
    title: 'Task Management',
    description: 'Assign, track & calendar view',
    icon: CheckSquare,
    path: '/tasks',
    color: 'bg-rose-500',
    stat: 'Team productivity',
  },
  {
    title: 'Communications',
    description: 'Client threads & message history',
    icon: MessageSquare,
    path: '/communications',
    color: 'bg-cyan-500',
    stat: 'Centralized hub',
  },
  {
    title: 'Billing & Invoices',
    description: 'Create invoices & track payments',
    icon: Receipt,
    path: '/billing',
    color: 'bg-indigo-500',
    stat: 'Automated billing',
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Active Clients',
      value: stats?.active_clients ?? 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Pending Tasks',
      value: stats?.pending_tasks ?? 0,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Revenue This Month',
      value: `$${(stats?.revenue_this_month ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Pending Invoices',
      value: stats?.pending_invoices ?? 0,
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Operations Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Manage all 7 critical agency workflows in one place
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          API connection issue: {error}. Ensure the backend is running.
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              )}
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Workflow Modules</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ title, description, icon: Icon, path, color, stat }) => (
          <Link
            key={path}
            to={path}
            className="card group transition hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2.5 ${color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
            <span className="badge mt-3 bg-slate-100 text-slate-600">{stat}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
