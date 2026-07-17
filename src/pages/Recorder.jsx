import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { initZoom, getSignature, joinMeeting, startRecording, stopRecording, leaveMeeting } from '../lib/zoomClient';

export default function Recorder() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [meetingNumber, setMeetingNumber] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [inMeeting, setInMeeting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(false);
  const timerRef = useRef(null);
  const zoomRootRef = useRef(null);

  useEffect(() => {
    fetchMeeting();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMeeting = async () => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error || !data) {
      setError('Meeting not found');
      return;
    }
    setMeeting(data);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleJoin = async () => {
    if (!meetingNumber.trim()) {
      setError('Meeting ID is required');
      return;
    }
    if (!userName.trim()) {
      setError('Your name is required');
      return;
    }

    setInitializing(true);
    setError('');

    try {
      await initZoom(zoomRootRef.current);

      const { signature, sdkKey } = await getSignature(meetingNumber, 0);

      await joinMeeting({
        signature,
        sdkKey,
        meetingNumber,
        userName,
        password: meetingPassword,
      });

      setInMeeting(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

      startRecording((blob) => handleUpload(blob));

      await supabase
        .from('meetings')
        .update({ status: 'recording' })
        .eq('id', meetingId);
    } catch (err) {
      setError('Could not join meeting: ' + (err.message || 'Unknown error'));
      setInitializing(false);
    }
  };

  const handleLeave = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopRecording();
    await leaveMeeting();
    setInMeeting(false);
  };

  const handleUpload = async (blob) => {
    setUploading(true);
    setError('');

    const fileName = `${meetingId}-${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from('meeting-audio')
      .upload(fileName, blob);

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('meeting-audio')
      .getPublicUrl(fileName);

    await supabase
      .from('meetings')
      .update({ audio_url: urlData.publicUrl, status: 'processing' })
      .eq('id', meetingId);

    navigate(`/summary/${meetingId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{meeting?.title || 'Meeting'}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {inMeeting ? 'In Meeting' : 'Join to Record'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        {!inMeeting ? (
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Zoom Meeting ID"
                value={meetingNumber}
                onChange={(e) => setMeetingNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Meeting Password (optional)"
                value={meetingPassword}
                onChange={(e) => setMeetingPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={initializing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {initializing ? 'Joining...' : 'Join Meeting'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 text-sm font-medium">Recording</span>
            </div>
            <div className="text-5xl font-mono text-gray-900 mb-6">{formatTime(elapsed)}</div>

            {uploading ? (
              <div className="text-blue-600 text-sm">Uploading and processing...</div>
            ) : (
              <button
                onClick={handleLeave}
                className="bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-full w-20 h-20 flex items-center justify-center mx-auto transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div ref={zoomRootRef} id="zoom-meeting" className={inMeeting ? 'mt-6' : 'hidden'} />

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 text-sm text-gray-500 hover:text-gray-700"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
