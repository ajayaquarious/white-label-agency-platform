import { useEffect, useState, FormEvent } from 'react';
import { MessageSquare, Mail, StickyNote, Send, Loader2 } from 'lucide-react';
import { api, Client, Communication } from '../lib/api';

const MESSAGE_TYPES = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'note', label: 'Note', icon: StickyNote },
  { id: 'message', label: 'Message', icon: MessageSquare },
];

export default function CommunicationHub() {
  const [clients, setClients] = useState<Client[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    message_type: 'note',
    content: '',
    notes: '',
  });

  useEffect(() => {
    api.getClients().then((c) => {
      setClients(c);
      if (c.length > 0) setSelectedClientId(c[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClientId) return;
    setLoading(true);
    api
      .getCommunications(selectedClientId)
      .then(setCommunications)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedClientId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    setSending(true);
    setError('');
    try {
      const comm = await api.addCommunication({
        client_id: selectedClientId,
        message_type: form.message_type,
        content: form.content,
        notes: form.notes || undefined,
      });
      setCommunications((prev) => [comm, ...prev]);
      setForm({ ...form, content: '', notes: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Client Communications</h1>
        <p className="mt-1 text-slate-600">Message threads, history log, and quick notes</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <h2 className="mb-4 text-lg font-semibold">Clients</h2>
          <div className="space-y-2">
            {clients.length === 0 ? (
              <p className="text-sm text-slate-500">No clients yet. Add one in Onboarding.</p>
            ) : (
              clients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedClientId === client.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-medium">{client.name}</p>
                  <p className="text-xs text-slate-500">{client.company || client.email}</p>
                </button>
              ))
            )}
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail className="h-4 w-4" />
              Email Integration
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Placeholder for Gmail/Outlook integration. Connect your email provider to sync threads automatically.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedClient && (
            <div className="card">
              <h2 className="mb-4 font-semibold">
                Thread: {selectedClient.name}
              </h2>

              <form onSubmit={handleSend} className="space-y-4">
                <div className="flex gap-2">
                  {MESSAGE_TYPES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setForm({ ...form, message_type: id })}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        form.message_type === id
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea
                    className="input-field min-h-[100px]"
                    required
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Write your message or note..."
                  />
                </div>
                <div>
                  <label className="label">Quick Notes (internal)</label>
                  <input
                    className="input-field"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Internal notes not visible to client"
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Communication History</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : communications.length === 0 ? (
              <p className="py-8 text-center text-slate-500">No communications yet</p>
            ) : (
              <div className="space-y-4">
                {communications.map((comm) => {
                  const TypeIcon = MESSAGE_TYPES.find((t) => t.id === comm.message_type)?.icon || MessageSquare;
                  return (
                    <div key={comm.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-slate-400" />
                          <span className="badge bg-slate-100 text-slate-600">{comm.message_type}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(comm.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">{comm.content}</p>
                      {comm.notes && (
                        <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          📝 {comm.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
