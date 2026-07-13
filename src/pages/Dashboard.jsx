import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [agendaNotes, setAgendaNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setMeetings(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    const { data, error } = await supabase
      .from('meetings')
      .insert({ title, agenda_notes: agendaNotes || null, user_id: user.id })
      .select()
      .single();

    if (!error) {
      navigate(`/recorder/${data.id}`);
    }
    setCreating(false);
  };

  const statusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      recording: 'bg-blue-100 text-blue-700',
      processing: 'bg-yellow-100 text-yellow-700',
      done: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">GMeet Minutes AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Your Meetings</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            + New Meeting
          </button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Create Meeting</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                placeholder="Meeting title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Agenda notes (optional)"
                value={agendaNotes}
                onChange={(e) => setAgendaNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create & Record'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Loading meetings...</p>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No meetings yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((m) => (
              <div
                key={m.id}
                onClick={() =>
                  m.status === 'done'
                    ? navigate(`/meeting/${m.id}`)
                    : m.status === 'draft'
                    ? navigate(`/recorder/${m.id}`)
                    : null
                }
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-sm cursor-pointer transition"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{m.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(m.meeting_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(m.status)}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
