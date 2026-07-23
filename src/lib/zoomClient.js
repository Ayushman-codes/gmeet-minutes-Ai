import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

const client = ZoomMtgEmbedded.createClient();

let mediaRecorder = null;
let audioChunks = [];

export function initZoom(rootElement) {
  return client.init({
    zoomAppRoot: rootElement,
    language: 'en-US',
    patchJsMedia: true,
    leaveOnPageUnload: true,
  });
}

export async function getSignature(meetingNumber, role) {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sign-zoom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ meetingNumber, role }),
  });

  if (!res.ok) throw new Error(`Signature request failed: ${res.status}`);
  return res.json();
}

export function joinMeeting({ signature, sdkKey, meetingNumber, userName, password }) {
  return client.join({
    signature,
    sdkKey,
    meetingNumber,
    userName,
    password,
  });
}

export async function startRecording(onStop, onStarted) {
  audioChunks = [];

  let stream;

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser' },
      audio: {
        suppressLocalAudioPlayback: false,
      },
      systemAudio: 'include',
      preferCurrentTab: false,
      selfBrowserSurface: 'exclude',
      systemAudio: 'include',
      optInAudio: true,
    });
  } catch (err) {
    console.warn('Display media cancelled, trying mic fallback:', err);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (micErr) {
      throw new Error('Audio capture denied. Please allow microphone access or share tab audio.');
    }
  }

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error('No audio tracks. When sharing, you must enable "Share tab audio" or "Share system audio".');
  }

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus',
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    stream.getTracks().forEach((t) => t.stop());
    if (onStop) onStop(blob);
  };

  mediaRecorder.start();
  if (onStarted) onStarted();
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

export async function leaveMeeting() {
  try {
    if (client && typeof client.leave === 'function') {
      await client.leave();
    }
  } catch (err) {
    console.warn('Zoom leave error (non-fatal):', err);
  }
}

export { client };
