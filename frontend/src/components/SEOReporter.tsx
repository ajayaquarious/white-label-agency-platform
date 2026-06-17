import { useEffect, useState, FormEvent } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api, Client, SEOReport } from '../lib/api';

export default function SEOReporter() {
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<SEOReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SEOReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client_id: '',
    domain: '',
    keywords: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getClients(), api.getSEOReports()])
      .then(([c, r]) => {
        setClients(c);
        setReports(r);
        if (r.length > 0) setSelectedReport(r[0]);
        if (c.length > 0) setForm((prev) => ({ ...prev, client_id: c[0].id }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAnalyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.client_id) {
      setError('Select a client');
      return;
    }

    setAnalyzing(true);
    setError('');
    try {
      const keywords = form.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const report = await api.analyzeSEO({
        client_id: form.client_id,
        domain: form.domain,
        keywords,
      });
      setSelectedReport(report);
      setReports((prev) => [report, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const report = selectedReport;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">SEO Reporting</h1>
        <p className="mt-1 text-slate-600">
          Automated keyword tracking via n8n workflow integration
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Search className="h-5 w-5 text-brand-600" />
            Run SEO Analysis
          </h2>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="label">Client</label>
              <select
                className="input-field"
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                required
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Domain</label>
              <input
                className="input-field"
                required
                placeholder="example.com"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Keywords (comma-separated)</label>
              <input
                className="input-field"
                placeholder="seo services, digital marketing, content strategy"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running n8n workflow...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Analyze SEO
                </>
              )}
            </button>
            <p className="text-xs text-slate-500">
              Triggers n8n webhook if configured (N8N_SEO_WEBHOOK_URL). Falls back to sample data.
            </p>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="card flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : report ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Organic Sessions', value: report.traffic_data.organic_sessions, icon: TrendingUp },
                  { label: 'Page Views', value: report.traffic_data.page_views, icon: BarChart3 },
                  { label: 'Bounce Rate', value: report.traffic_data.bounce_rate, icon: Globe },
                  { label: 'Avg Duration', value: report.traffic_data.avg_session_duration, icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="card">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{label}</span>
                    </div>
                    <p className="mt-2 text-xl font-bold">{value ?? '—'}</p>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="mb-4 font-semibold">Keyword Rankings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="pb-3 pr-4">Keyword</th>
                        <th className="pb-3 pr-4">Position</th>
                        <th className="pb-3">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(report.keyword_rankings || {}).map(([keyword, data]) => (
                        <tr key={keyword} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-medium">{keyword}</td>
                          <td className="py-3 pr-4">#{data.position}</td>
                          <td className="py-3">
                            <span
                              className={`badge ${
                                data.change.startsWith('+')
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {data.change}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 font-semibold">Competitor Analysis</h3>
                <div className="space-y-3">
                  {(report.competitor_data.competitors || []).map((comp) => (
                    <div
                      key={comp.name}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div>
                        <p className="font-medium">{comp.name}</p>
                        <p className="text-xs text-slate-500">Domain Authority: {comp.domain_authority}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {comp.organic_traffic.toLocaleString()} visits/mo
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card py-12 text-center text-slate-500">
              Run an SEO analysis to view reports
            </div>
          )}
        </div>
      </div>

      {reports.length > 1 && (
        <div className="card mt-6">
          <h2 className="mb-4 text-lg font-semibold">Report History</h2>
          <div className="flex flex-wrap gap-2">
            {reports.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedReport(r)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  selectedReport?.id === r.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                {new Date(r.report_date).toLocaleDateString()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
