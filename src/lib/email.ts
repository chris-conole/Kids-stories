import { Resend } from "resend";

let _resend: Resend | null = null;
function resend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "Dreamloom <onboarding@resend.dev>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Dreamloom";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend().emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

/** Auth.js magic-link email. */
export async function sendMagicLink(to: string, url: string) {
  const html = shell(`
    <h1 style="margin:0 0 12px;font-family:Georgia,serif;color:#2b2954">Sign in to ${APP_NAME}</h1>
    <p style="margin:0 0 24px;color:#3d3a79">Tap the button below to sign in. This link expires shortly and can only be used once.</p>
    <p style="margin:0 0 24px">
      <a href="${url}" style="background:#4a4796;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Sign in</a>
    </p>
    <p style="margin:0;color:#7b7ec6;font-size:13px">If you didn't request this, you can safely ignore it.</p>
  `);
  return sendEmail({ to, subject: `Sign in to ${APP_NAME}`, html });
}

/** Nightly "your story is ready" delivery email. */
export async function sendStoryReadyEmail(opts: {
  to: string;
  childName: string;
  title: string;
  synopsis: string;
  readUrl: string;
}) {
  const html = shell(`
    <p style="margin:0 0 8px;color:#7b7ec6;font-size:13px;letter-spacing:.08em;text-transform:uppercase">Tonight's story for ${escapeHtml(opts.childName)}</p>
    <h1 style="margin:0 0 12px;font-family:Georgia,serif;color:#2b2954">${escapeHtml(opts.title)}</h1>
    <p style="margin:0 0 24px;color:#3d3a79">${escapeHtml(opts.synopsis)}</p>
    <p style="margin:0 0 24px">
      <a href="${opts.readUrl}" style="background:#4a4796;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Read tonight's story</a>
    </p>
    <p style="margin:0;color:#7b7ec6;font-size:13px">Sweet dreams from all of us at ${APP_NAME}.</p>
  `);
  return sendEmail({
    to: opts.to,
    subject: `📖 ${opts.title} — tonight's story for ${opts.childName}`,
    html,
  });
}

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f5fb;padding:32px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 24px rgba(28,27,57,.08)">
      ${inner}
    </div>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
