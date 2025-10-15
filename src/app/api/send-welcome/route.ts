import { NextResponse } from "next/server";
import { Resend } from "resend";
import React from "react";
import WelcomeEmail from "@/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const subjects: Record<string, string> = {
  en: "🎁 Welcome to Zolarus!",
  pt: "🎁 Bem-vindo ao Zolarus!",
  es: "🎁 ¡Bienvenido a Zolarus!",
  fr: "🎁 Bienvenue à Zolarus!",
};

export async function POST(req: Request) {
  try {
    const { email, lang = "en" } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Zolarus <noreply@arison8.com>",
      to: [email],
      subject: subjects[lang] ?? subjects.en,
      react: React.createElement(WelcomeEmail, { email, lang }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Send failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
