import { useEffect, useState, FormEvent } from 'react';
import { Plus, Download, Loader2, Receipt, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { api, Client, Invoice } from '../lib/api';

const PAYMENT_STATUSES = ['pending', 'paid', 'overdue'];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function BillingModule() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: '',
    due_date: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }] as LineItem[],
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getClients(), api.getInvoices()])
      .then(([c, i]) => {
        setClients(c);
        setInvoices(i);
        if (c.length > 0) setForm((prev) => ({ ...prev, client_id: c[0].id }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const addLineItem = () => {
    setForm({
      ...form,
      items: [...form.items, { description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const calculateTotal = (items: LineItem[]) =>
    items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const invoice = await api.createInvoice({
        client_id: form.client_id,
        items: form.items,
        due_date: form.due_date || undefined,
      });
      setInvoices((prev) => [invoice, ...prev]);
      setShowForm(false);
      setForm({
        client_id: clients[0]?.id || '',
        due_date: '',
        items: [{ description: '', quantity: 1, unit_price: 0 }],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const updated = await api.updateInvoice(id, status);
      setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const downloadPDF = (invoice: Invoice) => {
    const client = clients.find((c) => c.id === invoice.client_id);
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(22);
    doc.text('INVOICE', margin, y);
    y += 15;

    doc.setFontSize(11);
    doc.text(`Client: ${client?.name || 'N/A'}`, margin, y);
    y += 7;
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, margin, y);
    y += 7;
    if (invoice.due_date) {
      doc.text(`Due: ${invoice.due_date}`, margin, y);
      y += 7;
    }
    y += 5;

    doc.setFontSize(10);
    doc.text('Description', margin, y);
    doc.text('Qty', margin + 100, y);
    doc.text('Price', margin + 120, y);
    doc.text('Total', margin + 150, y);
    y += 7;

    invoice.items.forEach((item) => {
      const total = item.quantity * item.unit_price;
      doc.text(item.description.substring(0, 40), margin, y);
      doc.text(String(item.quantity), margin + 100, y);
      doc.text(`$${item.unit_price}`, margin + 120, y);
      doc.text(`$${total}`, margin + 150, y);
      y += 6;
    });

    y += 10;
    doc.setFontSize(14);
    doc.text(`Total: $${invoice.total_amount.toLocaleString()}`, margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Status: ${invoice.payment_status}`, margin, y);

    doc.save(`invoice_${invoice.id.slice(0, 8)}.pdf`);
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
          <p className="mt-1 text-slate-600">Create invoices and track payment status</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Invoice
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="mb-4 text-lg font-semibold">Create Invoice</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Client</label>
                <select
                  className="input-field"
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input
                  className="input-field"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Line Items</label>
              {form.items.map((item, index) => (
                <div key={index} className="mb-2 flex flex-wrap gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="Service description"
                    required
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  />
                  <input
                    className="input-field w-20"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                  <input
                    className="input-field w-28"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unit_price || ''}
                    onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addLineItem} className="btn-secondary mt-2 text-xs">
                <Plus className="h-3 w-3" />
                Add Line Item
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-lg font-bold">
                Total: ${calculateTotal(form.items).toLocaleString()}
              </p>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-slate-400">
          <Receipt className="mb-3 h-12 w-12" />
          <p>No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const client = clients.find((c) => c.id === invoice.client_id);
            return (
              <div key={invoice.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{client?.name || 'Unknown Client'}</h3>
                      <span className={`badge ${STATUS_STYLES[invoice.payment_status]}`}>
                        {invoice.payment_status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Created {new Date(invoice.created_at).toLocaleDateString()}
                      {invoice.due_date && ` · Due ${invoice.due_date}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">${invoice.total_amount.toLocaleString()}</p>
                    <button
                      type="button"
                      onClick={() => downloadPDF(invoice)}
                      className="btn-secondary text-xs"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </button>
                    <select
                      className="input-field w-auto text-xs"
                      value={invoice.payment_status}
                      onChange={(e) => handleStatusUpdate(invoice.id, e.target.value)}
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="pb-2 pr-4">Description</th>
                        <th className="pb-2 pr-4">Qty</th>
                        <th className="pb-2 pr-4">Unit Price</th>
                        <th className="pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 pr-4">{item.description}</td>
                          <td className="py-2 pr-4">{item.quantity}</td>
                          <td className="py-2 pr-4">${item.unit_price}</td>
                          <td className="py-2">${(item.quantity * item.unit_price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
