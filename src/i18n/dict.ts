export type Locale = "en" | "pt" | "es" | "fr";
export type Lang = Locale;

export const STRINGS: Record<Locale, any> = {
  en: {
    nav: {
      language: "Language",
      dashboard: "Dashboard",
      shop: "Shop",
      explore: "Explore gifts",
      referrals: "Refs",
      reminders: "Reminders",
      profile: "Profile",
      signIn: "Sign in",
      signOut: "Sign out",
    },
    home: {
      title: "Welcome to Zolarus",
      subtitle:
        "Smarter gift ideas, reminders, and effortless shopping — in your language.",
      ctaShop: "Start shopping",
      ctaSignIn: "Sign in to continue",
    },
    header: "Let's get some ideas and shop now at Amazon!",
    resultsIntro: "Open Amazon with your selected ideas below.",
    browserTranslateHint:
      "Don’t see this page in your language on Amazon? Most browsers can translate: right-click → Translate.",
    placeholders: {
      forWhom:
        "for whom (e.g., boyfriend, girlfriend, husband, wife, mom, dad, kids)",
      occasion: "occasion (e.g., birthday, anniversary, wedding, graduation)",
      keywords: "keywords (e.g., gym, perfume, watch)",
    },
    labels: {
      forWhom: "for whom",
      occasion: "occasion",
      min: "min",
      max: "max",
      keywords: "keywords",
    },
    ideas: {
      open: "Open on Amazon",
      moreOnPage: "See more on my Amazon page",
      suggestionTitles: [
        "Core idea",
        "Accessories",
        "Popular — top sold (last 30 days)",
        "On sale",
      ],
      suggestionNotes: () => ["", "", "Thoughtful & useful", "Deal hunters welcome"],
    },
    buttons: { getIdeas: "Get ideas", tryNew: "Try new ideas" },
  },

  pt: {
    nav: {
      language: "Idioma",
      dashboard: "Painel",
      shop: "Shop",
      explore: "Explorar presentes",
      referrals: "Indicações",
      reminders: "Lembretes",
      profile: "Perfil",
      signIn: "Entrar",
      signOut: "Sair",
    },
    home: {
      title: "Bem-vindo ao Zolarus",
      subtitle:
        "Ideias de presentes, lembretes e compras sem esforço — no seu idioma.",
      ctaShop: "Começar a comprar",
      ctaSignIn: "Entrar para continuar",
    },
    header: "Vamos buscar ideias e comprar agora na Amazon!",
    resultsIntro: "Abra a Amazon com as ideias selecionadas abaixo.",
    browserTranslateHint:
      "A página não está em português? No navegador: clique com o botão direito → Traduzir.",
    placeholders: {
      forWhom:
        "para quem (ex.: namorado, namorada, marido, esposa, mãe, pai, crianças)",
      occasion:
        "ocasião (ex.: aniversário, aniversário de casamento, casamento, formatura)",
      keywords: "palavras-chave (ex.: academia, perfume, relógio)",
    },
    labels: {
      forWhom: "para quem",
      occasion: "ocasião",
      min: "mín",
      max: "máx",
      keywords: "palavras-chave",
    },
    ideas: {
      open: "Abrir na Amazon",
      moreOnPage: "Ver mais na minha página Amazon",
      suggestionTitles: [
        "Ideia principal",
        "Acessórios",
        "Popular — mais vendidos (últimos 30 dias)",
        "Em promoção",
      ],
      suggestionNotes: () => ["", "", "Útil e com carinho", "Boas ofertas"],
    },
    buttons: { getIdeas: "Ver ideias", tryNew: "Tentar novas ideias" },
  },

  es: {
    nav: {
      language: "Idioma",
      dashboard: "Panel",
      shop: "Shop",
      explore: "Explorar regalos",
      referrals: "Recs",
      reminders: "Recordatorios",
      profile: "Perfil",
      signIn: "Iniciar sesión",
      signOut: "Salir",
    },
    home: {
      title: "Bienvenido a Zolarus",
      subtitle:
        "Ideas de regalos, recordatorios y compras sencillas — en tu idioma.",
      ctaShop: "Empezar a comprar",
      ctaSignIn: "Iniciar sesión para continuar",
    },
    header: "¡Busquemos ideas y compremos ahora en Amazon!",
    resultsIntro: "Abre Amazon con las ideas seleccionadas a continuación.",
    browserTranslateHint:
      "¿No ves la página en español? Clic derecho → Traducir.",
    placeholders: {
      forWhom:
        "para quién (p. ej., novio, novia, esposo, esposa, mamá, papá, niños)",
      occasion: "ocasión (p. ej., cumpleaños, aniversario, boda, graduación)",
      keywords: "palabras clave (p. ej., gimnasio, perfume, reloj)",
    },
    labels: {
      forWhom: "para quién",
      occasion: "ocasión",
      min: "mín",
      max: "máx",
      keywords: "palabras clave",
    },
    ideas: {
      open: "Abrir en Amazon",
      moreOnPage: "Ver más en mi página de Amazon",
      suggestionTitles: [
        "Idea principal",
        "Accesorios",
        "Popular — más vendidos (últimos 30 días)",
        "En oferta",
      ],
      suggestionNotes: () => ["", "", "Útil y con intención", "Buenas ofertas"],
    },
    buttons: { getIdeas: "Ver ideas", tryNew: "Probar nuevas ideas" },
  },

  fr: {
    nav: {
      language: "Langue",
      dashboard: "Tableau de bord",
      shop: "Shop",
      explore: "Idées cadeaux",
      referrals: "Parrainages",
      reminders: "Rappels",
      profile: "Profil",
      signIn: "Se connecter",
      signOut: "Se déconnecter",
    },
    home: {
      title: "Bienvenue sur Zolarus",
      subtitle:
        "Des idées cadeaux, des rappels et des achats faciles — dans votre langue.",
      ctaShop: "Commencer les achats",
      ctaSignIn: "Se connecter pour continuer",
    },
    header: "Trouvons des idées et faisons nos achats sur Amazon !",
    resultsIntro: "Ouvrez Amazon avec vos idées sélectionnées ci-dessous.",
    browserTranslateHint:
      "La page n’est pas en français ? Clic droit → Traduire.",
    placeholders: {
      forWhom:
        "pour qui (ex. : petit ami, petite amie, mari, femme, maman, papa, enfants)",
      occasion:
        "occasion (ex. : anniversaire, anniversaire de mariage, mariage, remise de diplôme)",
      keywords: "mots-clés (ex. : salle de sport, parfum, montre)",
    },
    labels: {
      forWhom: "pour qui",
      occasion: "occasion",
      min: "min",
      max: "max",
      keywords: "mots-clés",
    },
    ideas: {
      open: "Ouvrir sur Amazon",
      moreOnPage: "Voir plus sur ma page Amazon",
      suggestionTitles: [
        "Idée principale",
        "Accessoires",
        "Populaire — meilleures ventes (30 derniers jours)",
        "En promotion",
      ],
      suggestionNotes: () => ["", "", "Utile et attentionné", "Bonnes affaires"],
    },
    buttons: { getIdeas: "Voir des idées", tryNew: "Essayer de nouvelles idées" },
  },
};
