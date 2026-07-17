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

export function startRecording(onStop) {
  audioChunks = [];

  const stream = new MediaStream();

  navigator.mediaDevices.getUserMedia({ audio: true }).then((micStream) => {
    micStream.getAudioTracks().forEach((track) => stream.addTrack(track));

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      if (onStop) onStop(blob);
    };

    mediaRecorder.start();
  });

  return mediaRecorder;
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

export function leaveMeeting() {
  return client.leave();
}

export { client };
