import "server-only";

/**
 * Minimal transactional email sender. Uses Resend when RESEND_API_KEY is
 * configured; otherwise logs the message to the server console so nothing
 * silently disappears during local development. The reset-token mechanism
 * itself (generation, hashing, expiry, single use) is fully real either
 * way — only the delivery channel is a stub without a provider key.
 */
export async function sendEmail(params: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Atelia <no-reply@atelia.example>";

  if (!apiKey) {
    console.log(`\n[email:dev] To: ${params.to}\nSubject: ${params.subject}\n\n${params.text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: params.to, subject: params.subject, text: params.text }),
  });
  if (!res.ok) {
    console.error("Failed to send email via Resend", await res.text());
  }
}
