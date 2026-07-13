import { useState } from 'react';
import { openGmailCompose } from '../lib/gmailRedirect';
import { supabase } from '../lib/supabaseClient';

export default function SendViaGmailButton({ meeting, summary, actionItems, meetingId }) {
  const [emails, setEmails] = useState('');
  const [showInput, setShowInput] = useState(false);

  const formatBody = () => {
    let body = `Minutes of Meeting: ${meeting.title}\n`;
    body += `Date: ${new Date(meeting.meeting_date).toLocaleDateString()}\n\n`;

    if (summary.attendees?.length) {
      body += `Attendees: ${summary.attendees.join(', ')}\n\n`;
    }

    body += `Summary:\n${summary.summary_text}\n\n`;

    if (summary.key_points?.length) {
      body += `Key Points:\n`;
      summary.key_points.forEach((p) => (body += `- ${p}\n`));
      body += '\n';
    }

    if (summary.decisions?.length) {
      body += `Decisions:\n`;
      summary.decisions.forEach((d) => (body += `- ${d}\n`));
      body += '\n';
    }

    if (actionItems?.length) {
      body += `Action Items:\n`;
      actionItems.forEach((ai) => {
        body += `- ${ai.description}`;
        if (ai.owner_name) body += ` (Owner: ${ai.owner_name})`;
        if (ai.due_date) body += ` [Due: ${ai.due_date}]`;
        body += '\n';
      });
    }

    return body;
  };

  const handleSend = async () => {
    const recipientList = emails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (!recipientList.length) return;

    const subject = `Meeting Minutes: ${meeting.title} — ${new Date(meeting.meeting_date).toLocaleDateString()}`;
    const body = formatBody();

    openGmailCompose({ to: recipientList, subject, body });

    await supabase.from('email_logs').insert({
      meeting_id: meetingId,
      sent_to: recipientList,
    });

    setShowInput(false);
    setEmails('');
  };

  return (
    <div>
      {showInput ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">
              Recipients (comma-separated)
            </label>
            <input
              type="text"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="alice@example.com, bob@example.com"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSend}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-4 py-2 h-10"
          >
            Send
          </button>
          <button
            onClick={() => setShowInput(false)}
            className="text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg px-4 py-2.5"
        >
          Send via Gmail
        </button>
      )}
    </div>
  );
}
