import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Recorder() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchMeeting();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      stream.getVideoTracks().forEach((t) => t.stop());

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => handleUpload(new Blob(chunksRef.current, { type: 'audio/webm' }));

      mediaRecorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);

      await supabase
        .from('meetings')
        .update({ status: 'recording' })
        .eq('id', meetingId);
    } catch (err) {
      setError('Could not start recording. Make sure you grant tab audio permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
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
        <p className="text-sm text-gray-500 mb-6">Recording</p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        <div className="mb-6">
          {recording && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 text-sm font-medium">Recording</span>
            </div>
          )}
          <div className="text-5xl font-mono text-gray-900 mb-6">{formatTime(elapsed)}</div>
        </div>

        {uploading ? (
          <div className="text-blue-600 text-sm">Uploading and processing...</div>
        ) : !recording ? (
          <button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white font-medium rounded-full w-20 h-20 flex items-center justify-center mx-auto transition"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-full w-20 h-20 flex items-center justify-center mx-auto transition"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        )}

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
