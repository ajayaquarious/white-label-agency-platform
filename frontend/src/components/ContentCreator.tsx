import { useEffect, useState, FormEvent } from 'react';
import { Sparkles, Check, X, Loader2, PenTool, History } from 'lucide-react';
import { api, ContentItem } from '../lib/api';

const CONTENT_TYPES = [
  { id: 'blog', label: 'Blog Post', description: 'Long-form SEO content' },
  { id: 'social', label: 'Social Post', description: 'Multi-platform social copy' },
  { id: 'ad', label: 'Ad Copy', description: 'Headlines & CTAs' },
];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending_approval: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ContentCreator() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ type: 'blog', topic: '', title: '' });

  const loadContent = () => {
    setLoading(true);
    api
      .getContent()
      .then((data) => {
        setItems(data);
        if (!selected && data.length > 0) setSelected(data[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    try {
      const item = await api.generateContent({
        type: form.type,
        topic: form.topic,
        title: form.title || undefined,
      });
      setSelected(item);
      setItems((prev) => [item, ...prev]);
      setForm({ ...form, topic: '', title: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const updated = await api.updateContentStatus(id, status);
      setSelected(updated);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Content Creation</h1>
        <p className="mt-1 text-slate-600">AI-powered content with approval workflow</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <PenTool className="h-5 w-5 text-brand-600" />
            Create Content
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="label">Content Type</label>
              <div className="space-y-2">
                {CONTENT_TYPES.map(({ id, label, description }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm({ ...form, type: id })}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      form.type === id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Topic / Subject</label>
              <textarea
                className="input-field min-h-[100px]"
                required
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g., 10 SEO tips for small businesses in 2025"
              />
            </div>
            <div>
              <label className="label">Title (optional)</label>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Content
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Content Preview</h2>
            {selected?.status === 'pending_approval' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApproval(selected.id, 'approved')}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleApproval(selected.id, 'rejected')}
                  className="btn-secondary text-red-600"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : selected ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{selected.title}</h3>
                <span className="badge bg-slate-100 text-slate-600">{selected.type}</span>
                <span className={`badge ${STATUS_STYLES[selected.status] || STATUS_STYLES.draft}`}>
                  {selected.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">v{selected.version}</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                {selected.content}
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-slate-500">Generate content to preview here</p>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="card mt-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5" />
            Version History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Version</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                    onClick={() => setSelected(item)}
                  >
                    <td className="py-3 pr-4 font-medium">{item.title}</td>
                    <td className="py-3 pr-4">{item.type}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${STATUS_STYLES[item.status] || STATUS_STYLES.draft}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4">v{item.version}</td>
                    <td className="py-3">{new Date(item.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
