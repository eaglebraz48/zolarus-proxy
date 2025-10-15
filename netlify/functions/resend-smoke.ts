import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const FROM = process.env.RESEND_FROM || "Zolarus <noreply@arison8.com>";

export async function handler(event) {
  try {
    const url = new URL(event.rawUrl);
    const to = url.searchParams.get("to") || "ierathel@live.com";

    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: "Zolarus self-test",
      html: "<p>If you received this, Resend in production works.</p>",
    });

    if (result?.error) {
      console.error("RESEND_FAIL", result.error);
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: result.error }) };
    }
    console.log("RESEND_OK", result?.data);
    return { statusCode: 200, body: JSON.stringify({ ok: true, id: result?.data?.id, to }) };
  } catch (e) {
    console.error("RESEND_THROW", e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, message: String(e?.message || e) }) };
  }
}
