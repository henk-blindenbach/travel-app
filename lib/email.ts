export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; missingConfig?: boolean };

function fromAddress() {
  return process.env.EMAIL_FROM || process.env.RESEND_FROM || "Op reis <onboarding@resend.dev>";
}

/** Resend HTTP API. No SDK dependency — works once RESEND_API_KEY is set. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      missingConfig: true,
      error: "RESEND_API_KEY ontbreekt. Voeg de secret toe in Vercel (en lokaal) om e-mails te versturen.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
  if (!response.ok) {
    return {
      ok: false,
      error: payload.message || payload.name || `Resend HTTP ${response.status}`,
    };
  }

  return { ok: true, id: payload.id || "unknown" };
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
