'use client';

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ShopCTA from "@/components/ShopCTA"; // ⬅ added

/* ---------------------- config ---------------------- */
const STRIPE_LINK = "https://buy.stripe.com/bJeeV563U5yyaJi5uMfAc00";

/* ---------------------- i18n ---------------------- */
type Lang = "en" | "pt" | "es" | "fr";
const LANGS: Lang[] = ["en", "pt", "es", "fr"];
const isLang = (v: string | null): v is Lang => !!v && LANGS.includes(v as Lang);

const L: Record<Lang, any> = {
  en: {
    title: "Dashboard",
    welcome: "Welcome,",
    profile: "Profile",
    basicInfo: "Basic info",
    setup: "Set up profile",
    shop: "Shop",
    exploreGifts: "Explore gifts",
    refs: "Refs",
    browseNow: "Browse / Shop now",
    reminders: "Reminders",
    remindersLead:
      "Set reminders for special occasions and we'll email you on time.",
    upcoming: "Upcoming",
    open: "Open",
    credits: "Zola Credits",
    coming: "Coming soon",
    referralsTitle: "Referrals",
    referralsCaption: "Credits toward shopping — start referring today.",
    copy: "Copy",
    share: "Share",

    compareTitle: "Compare prices across stores",
    comparePriceLine: "$0.99/month subscription",
    subscribeCta: "Subscribe — $0.99/mo",
    benefits:
      "Compare prices across other stores to save on gifts and everyday buys. We'll surface smart matches for what you're shopping, so you don’t overpay when prices vary.",
  },
  pt: {
    title: "Painel",
    welcome: "Bem-vindo,",
    profile: "Perfil",
    basicInfo: "Informações básicas",
    setup: "Configurar perfil",
    shop: "Shop",
    exploreGifts: "Explorar presentes",
    refs: "Indicações",
    browseNow: "Ver / Comprar agora",
    reminders: "Lembretes",
    remindersLead:
      "Defina lembretes de datas especiais e enviaremos um email na hora certa.",
    upcoming: "Próximos",
    open: "Abrir",
    credits: "Créditos Zola",
    coming: "Em breve",
    referralsTitle: "Indicações",
    referralsCaption: "Créditos para compras — comece a indicar hoje.",
    copy: "Copiar",
    share: "Compartilhar",

    compareTitle: "Compare preços em várias lojas",
    comparePriceLine: "Assinatura de US$ 0,99/mês",
    subscribeCta: "Assinar — US$ 0,99/mês",
    benefits:
      "Compare preços em outras lojas para economizar em presentes e compras do dia a dia. Mostramos sugestões para o que você procura, evitando pagar mais quando os preços variam.",
  },
  es: {
    title: "Panel",
    welcome: "Bienvenido,",
    profile: "Perfil",
    basicInfo: "Información básica",
    setup: "Configurar perfil",
    shop: "Shop",
    exploreGifts: "Explorar regalos",
    refs: "Referidos",
    browseNow: "Ver / Comprar ahora",
    reminders: "Recordatorios",
    remindersLead:
      "Configura recordatorios de fechas especiales y te enviaremos un correo a tiempo.",
    upcoming: "Próximos",
    open: "Abrir",
    credits: "Créditos Zola",
    coming: "Próximamente",
    referralsTitle: "Referidos",
    referralsCaption: "Créditos para compras — empieza a referir hoy.",
    copy: "Copiar",
    share: "Compartir",

    compareTitle: "Compara precios en varias tiendas",
    comparePriceLine: "Suscripción de US$ 0,99/mes",
    subscribeCta: "Suscribirse — US$ 0,99/mes",
    benefits:
      "Compara precios en otras tiendas para ahorrar en regalos y compras diarias. Te mostramos opciones para lo que buscas, así no pagas de más cuando los precios cambian.",
  },
  fr: {
    title: "Tableau de bord",
    welcome: "Bienvenue,",
    profile: "Profil",
    basicInfo: "Infos de base",
    setup: "Configurer le profil",
    shop: "Shop",
    exploreGifts: "Idées cadeaux",
    refs: "Parrainages",
    browseNow: "Parcourir / Acheter",
    reminders: "Rappels",
    remindersLead:
      "Créez des rappels pour les dates importantes et nous vous enverrons un email à temps.",
    upcoming: "À venir",
    open: "Ouvrir",
    credits: "Crédits Zola",
    coming: "Bientôt disponible",
    referralsTitle: "Parrainages",
    referralsCaption:
      "Crédits shopping — commencez à parrainer aujourd'hui.",
    copy: "Copier",
    share: "Partager",

    compareTitle: "Comparez les prix entre magasins",
    comparePriceLine: "Abonnement à 0,99 $/mois",
    subscribeCta: "S’abonner — 0,99 $/mois",
    benefits:
      "Comparez les prix dans d’autres boutiques pour économiser sur les cadeaux et les achats du quotidien. Nous proposons des correspondances pour ce que vous cherchez, afin d’éviter de payer trop cher.",
  },
};

/* ---------------------------------------------------------------------- */

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const sp = useSearchParams();
  const lang = (isLang(sp.get("lang")) ? (sp.get("lang") as Lang) : "en") as Lang;
  const t = L[lang];

  const [email, setEmail] = React.useState<string | null>(null);
  const [referralCount, setReferralCount] = React.useState<number>(0);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=global&lang=${lang}`
      : "";

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (mounted) setEmail(user?.email ?? null);

      if (user?.id) {
        const { count } = await supabase
          .from("referrals")
          .select("*", { count: "exact", head: true })
          .eq("referrer_id", user.id);
        if (mounted) setReferralCount(count ?? 0);
      } else {
        setReferralCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lang]);

  const withLang = (href: string) => {
    const p = new URLSearchParams(sp as unknown as URLSearchParams);
    p.set("lang", lang);
    return `${href}?${p.toString()}`;
  };

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: 12 }}>{t.title}</h1>

      {email && (
        <div style={{ color: "#374151", marginBottom: 20 }}>
          {t.welcome} <span style={{ fontWeight: 600 }}>{email}</span>!
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <Card>
          <CardTitle>{t.profile}</CardTitle>
          <div style={{ color: "#374151", marginBottom: 8 }}>{t.basicInfo}</div>
          <Link href={withLang("/profile")} style={btnPrimary}>
            {t.setup}
          </Link>
        </Card>

        <Card>
          <CardTitle>{t.reminders}</CardTitle>
          <div style={{ color: "#374151", marginBottom: 8 }}>{t.remindersLead}</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>0</div>
          <Link href={withLang("/reminders")} style={btnPrimary}>
            {t.open}
          </Link>
        </Card>

        {/* Shop card */}
        <Card>
          <CardTitle>{t.shop}</CardTitle>

          <Link href={withLang("/shop")} style={btnSecondary}>
            {t.browseNow}
          </Link>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 700, color: "#111827" }}>{t.compareTitle}</div>
            <div style={{ fontWeight: 700, color: "#111827" }}>{t.comparePriceLine}</div>
            <p style={{ marginTop: 8, color: "#374151" }}>{t.benefits}</p>
          </div>

          {/* ⬇ replaced Stripe link with ShopCTA */}
          <div style={{ marginTop: 8 }}>
            <ShopCTA />
          </div>
        </Card>

        <Card>
          <CardTitle>{t.credits}</CardTitle>
          <div style={{ color: "#6b7280", marginBottom: 8 }}>{t.coming}</div>
          <button style={btnDisabled} disabled>
            {t.coming}
          </button>
        </Card>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginTop: 24,
        }}
      >
        <Link href={withLang("/referrals")} style={referralsCircleBtn}>
          {t.referralsTitle}
        </Link>
        <div style={{ fontSize: 14, color: "#374151", textAlign: "center" }}>
          {t.referralsCaption}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 12,
            width: "100%",
            maxWidth: 560,
          }}
        >
          <input
            value={shareUrl}
            readOnly
            style={{
              flex: 1,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
            }}
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            style={{
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.copy}
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Join me on Zolarus", url: shareUrl });
              } else {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            style={{
              background: "#F59E0B",
              color: "#111827",
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.share}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- tiny UI helpers -------------------------- */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 16,
        background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontWeight: 700,
        fontSize: 16,
        marginBottom: 10,
        color: "#111827",
      }}
    >
      {children}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  backgroundColor: "#FF9900",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 14px",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  backgroundColor: "#232F3E",
  color: "#FFD814",
  border: "1px solid #FFD814",
  borderRadius: 8,
  padding: "8px 14px",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};

const btnDisabled: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  color: "#9ca3af",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "8px 14px",
  fontWeight: 600,
  fontSize: 14,
  cursor: "not-allowed",
};

const referralsCircleBtn: React.CSSProperties = {
  width: 120,
  height: 120,
  borderRadius: "9999px",
  backgroundColor: "#2563EB",
  border: "4px solid #DBEAFE",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontWeight: 800,
  letterSpacing: 0.2,
  boxShadow: "0 10px 15px rgba(37,99,235,.25)",
};
