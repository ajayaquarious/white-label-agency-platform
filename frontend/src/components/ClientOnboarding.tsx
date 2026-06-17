import { useEffect, useState, FormEvent } from 'react';
import { Upload, CheckCircle2, Circle, Loader2, FolderOpen } from 'lucide-react';
import { api, Client } from '../lib/api';

const DEFAULT_STEPS = [
  { step: 'Intake Form', status: 'completed', order: 1 },
  { step: 'Contract Signed', status: 'pending', order: 2 },
  { step: 'Brand Guidelines', status: 'pending', order: 3 },
  { step: 'Project Folder Created', status: 'pending', order: 4 },
  { step: 'Kickoff Meeting', status: 'pending', order: 5 },
];

export default function ClientOnboarding() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    budget: '',
  });

  const loadClients = () => {
    setLoading(true);
    api
      .getClients()
      .then(setClients)
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const client = await api.createClient({
        name: form.name,
        email: form.email,
        company: form.company,
        budget: parseFloat(form.budget) || undefined,
        onboarding_status: 'in_progress',
        onboarding_steps: DEFAULT_STEPS,
        documents: [],
      });
      setForm({ name: '', email: '', company: '', budget: '' });
      setSelectedClient(client);
      setMessage('Client created! Onboarding timeline started.');
      loadClients();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = async (clientId: string, file: File) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const newDoc = {
      name: file.name,
      type: file.type,
      uploaded_at: new Date().toISOString(),
    };

    const updatedSteps = (client.onboarding_steps || DEFAULT_STEPS).map((s) =>
      s.step === 'Brand Guidelines' ? { ...s, status: 'completed' } : s,
    );

    try {
      const updated = await api.updateClient(clientId, {
        documents: [...(client.documents || []), newDoc],
        onboarding_steps: updatedSteps,
      });
      setSelectedClient(updated);
      loadClients();
      setMessage(`Document "${file.name}" uploaded successfully.`);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const toggleStep = async (client: Client, stepName: string) => {
    const steps = (client.onboarding_steps || DEFAULT_STEPS).map((s) =>
      s.step === stepName
        ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' }
        : s,
    );
    const allDone = steps.every((s) => s.status === 'completed');

    try {
      const updated = await api.updateClient(client.id, {
        onboarding_steps: steps,
        onboarding_status: allDone ? 'completed' : 'in_progress',
      });
      setSelectedClient(updated);
      loadClients();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to update step');
    }
  };

  const displayClient = selectedClient || clients[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Client Onboarding</h1>
        <p className="mt-1 text-slate-600">Automate intake, documents, and project setup</p>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">New Client Intake</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Client Name</label>
              <input
                className="input-field"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input-field"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                className="input-field"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="label">Budget ($)</label>
              <input
                className="input-field"
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="10000"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Start Onboarding
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">Onboarding Timeline</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : displayClient ? (
            <>
              <div className="mb-4 rounded-lg bg-slate-50 p-3">
                <p className="font-medium">{displayClient.name}</p>
                <p className="text-sm text-slate-500">{displayClient.company || displayClient.email}</p>
                <span className={`badge mt-2 ${
                  displayClient.onboarding_status === 'completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {displayClient.onboarding_status}
                </span>
              </div>

              <div className="space-y-3">
                {(displayClient.onboarding_steps || DEFAULT_STEPS)
                  .sort((a, b) => a.order - b.order)
                  .map((step) => (
                    <button
                      key={step.step}
                      type="button"
                      onClick={() => toggleStep(displayClient, step.step)}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:bg-slate-50"
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                      <span className={step.status === 'completed' ? 'text-slate-500 line-through' : ''}>
                        {step.step}
                      </span>
                    </button>
                  ))}
              </div>

              <div className="mt-6">
                <label className="label flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Documents (contracts, brand guidelines)
                </label>
                <input
                  type="file"
                  className="input-field"
                  accept=".pdf,.doc,.docx,.png,.jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocumentUpload(displayClient.id, file);
                  }}
                />
                {(displayClient.documents || []).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {displayClient.documents.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <FolderOpen className="h-4 w-4" />
                        {doc.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-slate-500">No clients yet. Create one to start onboarding.</p>
          )}
        </div>
      </div>

      {clients.length > 0 && (
        <div className="card mt-6">
          <h2 className="mb-4 text-lg font-semibold">All Clients</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Company</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Budget</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                    onClick={() => setSelectedClient(c)}
                  >
                    <td className="py-3 pr-4 font-medium">{c.name}</td>
                    <td className="py-3 pr-4">{c.company || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className="badge bg-slate-100 text-slate-600">{c.onboarding_status}</span>
                    </td>
                    <td className="py-3">{c.budget ? `$${c.budget.toLocaleString()}` : '—'}</td>
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
