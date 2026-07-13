export function openGmailCompose({ to, subject, body }) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: to.join(','),
    su: subject,
    body,
  });
  window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank');
}
