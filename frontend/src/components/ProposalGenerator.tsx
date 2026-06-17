import { useEffect, useState, FormEvent } from 'react';
import { Sparkles, Download, Loader2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { api, Proposal } from '../lib/api';

const SERVICE_OPTIONS = [
  'SEO',
  'Content Marketing',
  'Social Media Management',
  'PPC Advertising',
  'Web Design',
  'Email Marketing',
  'Brand Strategy',
  'Analytics & Reporting',
];

export default function ProposalGenerator() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [generated, setGenerated] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client_name: '',
    company: '',
    budget: '',
    timeline: '',
    services: [] as string[],
    notes: '',
  });

  useEffect(() => {
    setLoading(true);
    api
      .getProposals()
      .then(setProposals)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (form.services.length === 0) {
      setError('Select at least one service');
      return;
    }

    setGenerating(true);
    setError('');
    try {
      const proposal = await api.generateProposal({
        client_name: form.client_name,
        company: form.company,
        budget: parseFloat(form.budget),
        timeline: form.timeline,
        services: form.services,
        notes: form.notes,
      });
      setGenerated(proposal);
      setProposals((prev) => [proposal, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = (proposal: Proposal) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(20);
    doc.text(proposal.title, margin, y);
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Budget: $${proposal.budget?.toLocaleString() || 'N/A'} | Timeline: ${proposal.timeline || 'N/A'}`, margin, y);
    y += 10;

    doc.setTextColor(0);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(proposal.content || '', 170);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    });

    doc.save(`${proposal.title.replace(/\s+/g, '_')}.pdf`);
  };

  const displayProposal = generated || proposals[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Proposal Generation</h1>
        <p className="mt-1 text-slate-600">AI-powered proposals using Groq Llama 3.1 70B</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-brand-600" />
            Proposal Intake
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="label">Client Name</label>
              <input
                className="input-field"
                required
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                className="input-field"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Budget ($)</label>
                <input
                  className="input-field"
                  type="number"
                  required
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Timeline</label>
                <input
                  className="input-field"
                  required
                  placeholder="3 months"
                  value={form.timeline}
                  onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Services Needed</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      form.services.includes(service)
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Additional Notes</label>
              <textarea
                className="input-field min-h-[80px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Special requirements, goals, etc."
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Proposal
                </>
              )}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Generated Proposal</h2>
            {displayProposal && (
              <button
                type="button"
                onClick={() => downloadPDF(displayProposal)}
                className="btn-secondary text-xs"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : displayProposal ? (
            <div className="max-h-[600px] overflow-y-auto">
              <div className="mb-4 rounded-lg bg-brand-50 p-4">
                <h3 className="font-semibold text-brand-900">{displayProposal.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-brand-700">
                  <span>Budget: ${displayProposal.budget?.toLocaleString()}</span>
                  <span>·</span>
                  <span>Timeline: {displayProposal.timeline}</span>
                </div>
                {displayProposal.services?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {displayProposal.services.map((s) => (
                      <span key={s} className="badge bg-brand-100 text-brand-700">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
                {displayProposal.content}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <FileText className="mb-3 h-12 w-12" />
              <p>Fill the form and generate your first AI proposal</p>
            </div>
          )}
        </div>
      </div>

      {proposals.length > 1 && (
        <div className="card mt-6">
          <h2 className="mb-4 text-lg font-semibold">Proposal History</h2>
          <div className="space-y-2">
            {proposals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setGenerated(p)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(p.created_at).toLocaleDateString()} · {p.status}
                  </p>
                </div>
                <span className="text-sm text-slate-500">${p.budget?.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
