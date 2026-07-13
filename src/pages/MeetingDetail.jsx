import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import SummaryEditor from '../components/SummaryEditor';
import ActionItemList from '../components/ActionItemList';
import SendViaGmailButton from '../components/SendViaGmailButton';

export default function MeetingDetail() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [summary, setSummary] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: m } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    setMeeting(m);

    if (m) {
      const { data: s } = await supabase
        .from('summaries')
        .select('*')
        .eq('meeting_id', meetingId)
        .single();

      if (s) {
        setSummary(s);
        const { data: items } = await supabase
          .from('action_items')
          .select('*')
          .eq('meeting_id', meetingId);
        setActionItems(items || []);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{meeting?.title}</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {summary ? (
          <div className="space-y-6">
            <SummaryEditor summary={summary} readOnly />
            <ActionItemList items={actionItems} readOnly meetingId={meetingId} />
            <SendViaGmailButton
              meeting={meeting}
              summary={summary}
              actionItems={actionItems}
              meetingId={meetingId}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No summary available for this meeting.
          </div>
        )}
      </main>
    </div>
  );
}
