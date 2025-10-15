import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM || 'Zolarus <noreply@arison8.com>';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'matt@arison8.com';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const to: string | string[] = body.to ?? body.email;
    const subject: string = body.subject;
    const html: string = body.html;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: 'Missing to/subject/html' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    // ✅ note the data?.id
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error('🚨 /api/send error:', err);
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
