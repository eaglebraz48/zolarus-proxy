import { NextResponse } from "next/server";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Msg[] | undefined };
  const last = messages?.slice().reverse().find((m) => m.role === "user");
  const q = (last?.content || "").toLowerCase();

  let reply =
    "Zolarus lets you create email reminders (one-off or recurring). " +
    "Type what you want to remember and when. I can point you to the Reminders page.";

  if (q.includes("how") && q.includes("work")) {
    reply =
      "Create a reminder with a title and a time. Our scheduler (Netlify cron) checks due items and sends via Resend. " +
      "You can confirm sends in the Reminders list.";
  } else if (q.includes("create") || q.includes("new reminder")) {
    reply =
      "Head to Reminders → New. Give it a clear title (e.g., “Pay rent”), set the time, and save. " +
      "You’ll get an email when it’s due.";
  } else if (q.includes("recurr")) {
    reply =
      "Recurring: set the schedule (e.g., every Monday 9am). The cron picks it up and emails you each time.";
  } else if (q.includes("email") || q.includes("deliver")) {
    reply =
      "We send through Resend with your verified domain. You can see delivery status in your Resend dashboard.";
  } else if (q.includes("help") || q.includes("guide")) {
    reply =
      "Try: “create reminder for dentist next Tue 3pm”, or ask “how do I set weekly standup reminder?”";
  }

  return NextResponse.json({ reply });
}
