import { useEffect, useState, FormEvent } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  List,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api, Task } from '../lib/api';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'in-progress', 'completed'];
const TEAM = ['Alex Morgan', 'Jordan Lee', 'Sam Rivera'];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee: TEAM[0],
    priority: 'medium',
    status: 'pending',
    due_date: '',
  });

  const loadTasks = () => {
    setLoading(true);
    api
      .getTasks()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createTask({
        ...form,
        due_date: form.due_date || undefined,
      });
      setForm({
        title: '',
        description: '',
        assignee: TEAM[0],
        priority: 'medium',
        status: 'pending',
        due_date: '',
      });
      setShowForm(false);
      loadTasks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (task: Task, status: string) => {
    try {
      await api.updateTask(task.id, { status });
      loadTasks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const tasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter((t) => t.due_date === dateStr);
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
          <p className="mt-1 text-slate-600">Assign, track, and manage team tasks</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`btn-secondary ${view === 'list' ? 'border-brand-500 bg-brand-50' : ''}`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`btn-secondary ${view === 'calendar' ? 'border-brand-500 bg-brand-50' : ''}`}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </button>
          <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="mb-4 text-lg font-semibold">Create Task</h2>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input
                className="input-field"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input-field"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Assignee</label>
              <select
                className="input-field"
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              >
                {TEAM.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input-field"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
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
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : view === 'list' ? (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="card py-12 text-center text-slate-500">No tasks yet</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="card flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    <span className={`badge ${STATUS_COLORS[task.status]}`}>{task.status}</span>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-sm text-slate-500">{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    {task.assignee && <span>👤 {task.assignee}</span>}
                    {task.due_date && <span>📅 {task.due_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input-field w-auto text-xs"
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCalendarDate(new Date(year, month - 1))}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-semibold">
              {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              type="button"
              onClick={() => setCalendarDate(new Date(year, month + 1))}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px]" />
            ))}
            {calendarDays.map((day) => {
              const dayTasks = tasksForDay(day);
              return (
                <div
                  key={day}
                  className="min-h-[80px] rounded-lg border border-slate-100 p-1"
                >
                  <span className="text-xs font-medium text-slate-500">{day}</span>
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="mt-0.5 truncate rounded bg-brand-50 px-1 text-[10px] text-brand-700"
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
