import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { summarizeMeetingAudio } from '../lib/geminiClient';
import SummaryEditor from '../components/SummaryEditor';
import ActionItemList from '../components/ActionItemList';
import SendViaGmailButton from '../components/SendViaGmailButton';

export default function Summary() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [summary, setSummary] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

    if (m?.status === 'done' || m?.status === 'failed') {
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

    if (m?.status === 'processing' && m?.audio_url) {
      await processAudio(m.audio_url);
    }

    setLoading(false);
  };

  const processAudio = async (audioUrl) => {
    setProcessing(true);
    setError('');

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' });

      const result = await summarizeMeetingAudio(file);

      const { data: s, error: se } = await supabase
        .from('summaries')
        .insert({
          meeting_id: meetingId,
          attendees: result.attendees,
          summary_text: result.summary_text,
          key_points: result.key_points,
          decisions: result.decisions,
          raw_transcript: '',
        })
        .select()
        .single();

      if (se) throw se;

      setSummary(s);

      if (result.action_items?.length) {
        const { data: items } = await supabase
          .from('action_items')
          .insert(
            result.action_items.map((ai) => ({
              meeting_id: meetingId,
              description: ai.description,
              owner_name: ai.owner_name,
              due_date: ai.due_date,
            }))
          )
          .select();
        setActionItems(items || []);
      }

      await supabase
        .from('meetings')
        .update({ status: 'done' })
        .eq('id', meetingId);

      setMeeting((prev) => ({ ...prev, status: 'done' }));
    } catch (err) {
      setError(err.message || 'Processing failed');
      await supabase
        .from('meetings')
        .update({ status: 'failed' })
        .eq('id', meetingId);
    }
    setProcessing(false);
  };

  const handleRetry = async () => {
    if (meeting?.audio_url) {
      await supabase
        .from('meetings')
        .update({ status: 'processing' })
        .eq('id', meetingId);
      await processAudio(meeting.audio_url);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const { error: se } = await supabase
      .from('summaries')
      .update({
        attendees: summary.attendees,
        summary_text: summary.summary_text,
        key_points: summary.key_points,
        decisions: summary.decisions,
      })
      .eq('id', summary.id);

    if (se) {
      setError('Failed to save summary');
      setSaving(false);
      return;
    }

    for (const item of actionItems) {
      if (item.id) {
        await supabase
          .from('action_items')
          .update({
            description: item.description,
            owner_name: item.owner_name,
            due_date: item.due_date,
            is_completed: item.is_completed,
          })
          .eq('id', item.id);
      } else {
        await supabase
          .from('action_items')
          .insert({
            meeting_id: meetingId,
            description: item.description,
            owner_name: item.owner_name,
            due_date: item.due_date,
          });
      }
    }

    setSaving(false);
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
        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        {processing ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Processing audio with Gemini Flash...</p>
            <p className="text-sm text-gray-400 mt-1">This may take a minute</p>
          </div>
        ) : meeting?.status === 'failed' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-red-600 mb-4">Processing failed</p>
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2"
            >
              Retry Processing
            </button>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            <SummaryEditor summary={summary} onChange={setSummary} />

            <ActionItemList
              items={actionItems}
              onChange={setActionItems}
              meetingId={meetingId}
            />

            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-6 py-2.5 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <SendViaGmailButton
                meeting={meeting}
                summary={summary}
                actionItems={actionItems}
                meetingId={meetingId}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No summary available. Upload audio from the Recorder page.
          </div>
        )}
      </main>
    </div>
  );
}
