export type AppLocale = "mn" | "en";

export const APP_LOCALE: AppLocale = "mn";
export const POLICY_TERMS_VERSION = "2026-04-04";
export const POLICY_PRIVACY_VERSION = "2026-04-04";

type CopySchema = {
  tabs: {
    market: string;
    signal: string;
    news: string;
    profile: string;
  };
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    signIn: string;
    createAccount: string;
    or: string;
    footer: string;
  };
  news: {
    headerTitle: string;
    tabs: {
      history: string;
      upcoming: string;
      outlook: string;
    };
    modalTitle: string;
    emptyUpcoming: string;
    emptyHistory: string;
    emptyOutlook: string;
    pastEventFallback: string;
  };
  home: {
    headerTitle: string;
    loading: string;
    lastUpdatePrefix: string;
    table: {
      symbol: string;
      price: string;
      change: string;
      changePercent: string;
    };
  };
  signal: {
    subtitle: string;
    loading: string;
    unsupportedPair: string;
    rateLimited: string;
    emptyDefault: string;
    back: string;
    retry: string;
    summaryTitle: string;
    forecastTitle: string;
    riskTitle: string;
    expand: string;
    collapse: string;
    badges: {
      staleCache: string;
      fallbackCache: string;
      cached: string;
      marketMode: string;
      realtime: string;
    };
    uncertaintyLabel: string;
    actionabilityLabel: string;
    humanOversightLabel: string;
    humanOversightRequired: string;
    humanOversightOptional: string;
    disclaimerTitle: string;
    disclaimerText: string;
  };
  profile: {
    sections: {
      settings: string;
      security: string;
      about: string;
    };
    actions: {
      editProfile: string;
      changePassword: string;
      help: string;
      terms: string;
      privacy: string;
      aboutApp: string;
      signOut: string;
      version: string;
      close: string;
    };
    labels: {
      notifications: string;
      notificationsDesc: string;
      signalAlerts: string;
      signalAlertsDesc: string;
      signalThreshold: string;
      signalThresholdDescPrefix: string;
      newsAlerts: string;
      newsAlertsDesc: string;
      newsImpactFilter: string;
      securityAlerts: string;
      securityAlertsDesc: string;
      theme: string;
      dark: string;
      light: string;
      system: string;
      highImpactOnly: string;
      highAndMedium: string;
      allLevels: string;
      signalThresholdTitle: string;
      signalThresholdDefaultSuffix: string;
      signalThresholdHighSuffix: string;
    };
    editModal: {
      title: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      cancel: string;
      save: string;
    };
    passwordModal: {
      title: string;
      currentPasswordLabel: string;
      currentPasswordPlaceholder: string;
      newPasswordLabel: string;
      newPasswordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      updatePassword: string;
    };
    themeModalTitle: string;
    impactFilterTitle: string;
  };
  signup: {
    back: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    termsLead: string;
    termsLink: string;
    privacyLink: string;
    createAccount: string;
    alreadyHaveAccount: string;
    signIn: string;
  };
  notifications: {
    headerTitle: string;
    unreadSuffix: string;
    markAllRead: string;
    saving: string;
    emptyTitle: string;
    emptySubtitle: string;
    now: string;
    minuteSuffix: string;
    hourSuffix: string;
    dayAgoSuffix: string;
  };
};

const COPY: Record<AppLocale, CopySchema> = {
  mn: {
    tabs: {
      market: "Зах зээл",
      signal: "Сигнал",
      news: "Мэдээ",
      profile: "Профайл",
    },
    login: {
      title: "PREDICTRIX",
      subtitle: "AI Форекс туслах",
      emailLabel: "И-МЭЙЛ",
      emailPlaceholder: "И-мэйл хаягаа оруулна уу",
      passwordLabel: "НУУЦ ҮГ",
      passwordPlaceholder: "Нууц үгээ оруулна уу",
      forgotPassword: "Нууц үгээ мартсан уу?",
      signIn: "Нэвтрэх",
      createAccount: "Бүртгэл үүсгэх",
      or: "ЭСВЭЛ",
      footer: "Зөвхөн судалгааны зорилготой",
    },
    news: {
      headerTitle: "Зах зээлийн мэдээ",
      tabs: {
        history: "Өмнөх мэдээ",
        upcoming: "Удахгүй болох",
        outlook: "Дүгнэлт",
      },
      modalTitle: "AI дүгнэлт",
      emptyUpcoming: "Төлөвлөгдсөн үйл явдал алга",
      emptyHistory: "Өмнөх мэдээлэл олдсонгүй",
      emptyOutlook: "Мэдээлэл байхгүй байна",
      pastEventFallback: "Өмнөх үйл явдал",
    },
    home: {
      headerTitle: "Форекс зах зээл",
      loading: "Зах зээлийн мэдээлэл ачаалж байна...",
      lastUpdatePrefix: "Сүүлийн шинэчлэл",
      table: {
        symbol: "Хослол",
        price: "Үнэ",
        change: "Өөрчлөлт",
        changePercent: "% өөрчлөлт",
      },
    },
    signal: {
      subtitle: "AI Шинжилгээ",
      loading: "AI шинжилж байна...",
      unsupportedPair: "Одоогийн хувилбарт зөвхөн EUR/USD дэмжигдэнэ",
      rateLimited: "Сервер түр ачаалалтай байна. Түр хүлээгээд дахин оролдоно уу",
      emptyDefault: "Шинжилгээ хийгдээгүй байна",
      back: "Буцах",
      retry: "Дахин оролдох",
      summaryTitle: "ДҮГНЭЛТ",
      forecastTitle: "ТААМАГЛАЛ",
      riskTitle: "ЭРСДЭЛТ ХҮЧИН ЗҮЙЛС",
      expand: "Дэлгэрэнгүй харах",
      collapse: "Буулгах",
      badges: {
        staleCache: "ХУУЧИН КЭШ",
        fallbackCache: "НӨӨЦ КЭШ",
        cached: "КЭШ",
        marketMode: "ЗАХ ЗЭЭЛИЙН ГОРИМ",
        realtime: "БОДИТ ЦАГИЙН AI",
      },
      uncertaintyLabel: "Тодорхойгүй байдлын түвшин",
      actionabilityLabel: "Үйлдлийн зөвлөмж",
      humanOversightLabel: "Хүний хяналт",
      humanOversightRequired: "Шаардлагатай",
      humanOversightOptional: "Санал болгож байна",
      disclaimerTitle: "АНХААРУУЛГА",
      disclaimerText: "Зөвхөн судалгааны зорилготой. Санхүүгийн зөвлөгөө биш!",
    },
    profile: {
      sections: {
        settings: "ТОХИРГОО",
        security: "АЮУЛГҮЙ БАЙДАЛ",
        about: "ТУХАЙ",
      },
      actions: {
        editProfile: "Профайл засах",
        changePassword: "Нууц үг солих",
        help: "Тусламж",
        terms: "Үйлчилгээний нөхцөл",
        privacy: "Нууцлалын бодлого",
        aboutApp: "Аппын тухай",
        signOut: "Гарах",
        version: "Хувилбар",
        close: "Хаах",
      },
      labels: {
        notifications: "МЭДЭГДЭЛ",
        notificationsDesc: "Push мэдэгдэл асаах",
        signalAlerts: "СИГНАЛ МЭДЭГДЭЛ",
        signalAlertsDesc: "Өндөр итгэлцэлтэй сигнал",
        signalThreshold: "СИГНАЛЫН БОСГО",
        signalThresholdDescPrefix: "Хамгийн бага итгэлцэл",
        newsAlerts: "МЭДЭЭ МЭДЭГДЭЛ",
        newsAlertsDesc: "Эдийн засгийн мэдээ (10 минутын өмнө)",
        newsImpactFilter: "МЭДЭЭНИЙ НӨЛӨӨНИЙ ШҮҮЛТҮҮР",
        securityAlerts: "АЮУЛГҮЙ БАЙДЛЫН МЭДЭГДЭЛ",
        securityAlertsDesc: "Шинэ төхөөрөмжөөс нэвтрэх үед",
        theme: "СЭДЭВ",
        dark: "Бараан",
        light: "Гэрэл",
        system: "Систем",
        highImpactOnly: "Өндөр нөлөөтэй",
        highAndMedium: "Өндөр + Дунд",
        allLevels: "Бүх түвшин",
        signalThresholdTitle: "Сигналын итгэлцлийн босго",
        signalThresholdDefaultSuffix: " (Анхдагч)",
        signalThresholdHighSuffix: " (Өндөр)",
      },
      editModal: {
        title: "Профайл засах",
        nameLabel: "НЭР",
        namePlaceholder: "Нэр оруулна уу",
        emailLabel: "ИМЭЙЛ",
        emailPlaceholder: "И-мэйл оруулна уу",
        cancel: "Цуцлах",
        save: "Хадгалах",
      },
      passwordModal: {
        title: "Нууц үг солих",
        currentPasswordLabel: "ОДООГИЙН НУУЦ ҮГ",
        currentPasswordPlaceholder: "Одоогийн нууц үгээ оруулна уу",
        newPasswordLabel: "ШИНЭ НУУЦ ҮГ",
        newPasswordPlaceholder: "Хамгийн багадаа 6 тэмдэгт",
        confirmPasswordLabel: "ШИНЭ НУУЦ ҮГ ДАВТАХ",
        confirmPasswordPlaceholder: "Шинэ нууц үгээ давтана уу",
        updatePassword: "Нууц үг шинэчлэх",
      },
      themeModalTitle: "Сэдэв сонгох",
      impactFilterTitle: "Мэдээний нөлөөний шүүлтүүр",
    },
    signup: {
      back: "Буцах",
      title: "БҮРТГҮҮЛЭХ",
      subtitle: "Predictrix-д нэгдэх",
      nameLabel: "НЭР",
      namePlaceholder: "Таны нэр",
      emailLabel: "И-МЭЙЛ",
      emailPlaceholder: "И-мэйл",
      passwordLabel: "НУУЦ ҮГ",
      passwordPlaceholder: "Хамгийн багадаа 6 тэмдэгт",
      confirmPasswordLabel: "НУУЦ ҮГ ДАВТАХ",
      confirmPasswordPlaceholder: "Нууц үгээ давтана уу",
      termsLead: "Би ",
      termsLink: "Үйлчилгээний нөхцөл",
      privacyLink: "Нууцлалын бодлого",
      createAccount: "Бүртгэл үүсгэх",
      alreadyHaveAccount: "Бүртгэлтэй юу? ",
      signIn: "Нэвтрэх",
    },
    notifications: {
      headerTitle: "Мэдэгдэл",
      unreadSuffix: "шинэ",
      markAllRead: "Бүгд уншсан",
      saving: "Хадгалж байна...",
      emptyTitle: "Мэдэгдэл байхгүй",
      emptySubtitle: "Шинэ сигнал болон мэдээний мэдэгдлүүд энд харагдана",
      now: "Одоо",
      minuteSuffix: "мин",
      hourSuffix: "цаг",
      dayAgoSuffix: "өдрийн өмнө",
    },
  },
  en: {
    tabs: {
      market: "Market",
      signal: "Signal",
      news: "News",
      profile: "Profile",
    },
    login: {
      title: "PREDICTRIX",
      subtitle: "AI Trading Assistant",
      emailLabel: "EMAIL",
      emailPlaceholder: "Enter your email",
      passwordLabel: "PASSWORD",
      passwordPlaceholder: "Enter your password",
      forgotPassword: "Forgot password?",
      signIn: "Sign In",
      createAccount: "Create Account",
      or: "OR",
      footer: "For research purposes only",
    },
    news: {
      headerTitle: "Market Intelligence",
      tabs: {
        history: "History",
        upcoming: "Upcoming",
        outlook: "Outlook",
      },
      modalTitle: "AI Analysis",
      emptyUpcoming: "No events scheduled",
      emptyHistory: "No historical events found",
      emptyOutlook: "No data available",
      pastEventFallback: "Past Event",
    },
    home: {
      headerTitle: "Forex Market",
      loading: "Loading market data...",
      lastUpdatePrefix: "Last update",
      table: {
        symbol: "Symbol",
        price: "Price",
        change: "Change",
        changePercent: "Change %",
      },
    },
    signal: {
      subtitle: "AI Analysis",
      loading: "Analyzing with AI...",
      unsupportedPair: "Current release supports only EUR/USD",
      rateLimited: "Server is busy. Please try again shortly",
      emptyDefault: "Analysis is not available",
      back: "Back",
      retry: "Retry",
      summaryTitle: "SUMMARY",
      forecastTitle: "FORECAST",
      riskTitle: "RISK FACTORS",
      expand: "View more",
      collapse: "Collapse",
      badges: {
        staleCache: "STALE CACHE",
        fallbackCache: "FALLBACK CACHE",
        cached: "CACHED",
        marketMode: "MARKET MODE",
        realtime: "REAL-TIME AI",
      },
      uncertaintyLabel: "Uncertainty Level",
      actionabilityLabel: "Actionability",
      humanOversightLabel: "Human Oversight",
      humanOversightRequired: "Required",
      humanOversightOptional: "Recommended",
      disclaimerTitle: "NOTICE",
      disclaimerText: "For research purposes only. Not financial advice!",
    },
    profile: {
      sections: {
        settings: "SETTINGS",
        security: "SECURITY",
        about: "ABOUT",
      },
      actions: {
        editProfile: "Edit profile",
        changePassword: "Change Password",
        help: "Help",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
        aboutApp: "About App",
        signOut: "Sign Out",
        version: "Version",
        close: "Close",
      },
      labels: {
        notifications: "NOTIFICATIONS",
        notificationsDesc: "Enable push notifications",
        signalAlerts: "SIGNAL ALERTS",
        signalAlertsDesc: "High-confidence trading signals",
        signalThreshold: "SIGNAL THRESHOLD",
        signalThresholdDescPrefix: "Min confidence",
        newsAlerts: "NEWS ALERTS",
        newsAlertsDesc: "Economic news events (10 min before)",
        newsImpactFilter: "NEWS IMPACT FILTER",
        securityAlerts: "SECURITY ALERTS",
        securityAlertsDesc: "Login from new device",
        theme: "THEME",
        dark: "Dark",
        light: "Light",
        system: "System",
        highImpactOnly: "High Impact Only",
        highAndMedium: "High + Medium",
        allLevels: "All Levels",
        signalThresholdTitle: "Signal Confidence Threshold",
        signalThresholdDefaultSuffix: " (Default)",
        signalThresholdHighSuffix: " (High)",
      },
      editModal: {
        title: "Edit profile",
        nameLabel: "NAME",
        namePlaceholder: "Enter name",
        emailLabel: "EMAIL",
        emailPlaceholder: "Enter email",
        cancel: "Cancel",
        save: "Save",
      },
      passwordModal: {
        title: "Change Password",
        currentPasswordLabel: "CURRENT PASSWORD",
        currentPasswordPlaceholder: "Enter current password",
        newPasswordLabel: "NEW PASSWORD",
        newPasswordPlaceholder: "Min 12 characters",
        confirmPasswordLabel: "CONFIRM PASSWORD",
        confirmPasswordPlaceholder: "Confirm new password",
        updatePassword: "Update Password",
      },
      themeModalTitle: "Select Theme",
      impactFilterTitle: "News Impact Filter",
    },
    signup: {
      back: "Back",
      title: "SIGN UP",
      subtitle: "Join Predictrix",
      nameLabel: "NAME",
      namePlaceholder: "Your name",
      emailLabel: "EMAIL",
      emailPlaceholder: "Email",
      passwordLabel: "PASSWORD",
      passwordPlaceholder: "Min 12 characters",
      confirmPasswordLabel: "CONFIRM PASSWORD",
      confirmPasswordPlaceholder: "Confirm password",
      termsLead: "I agree to ",
      termsLink: "Terms",
      privacyLink: "Privacy Policy",
      createAccount: "Create Account",
      alreadyHaveAccount: "Already have account? ",
      signIn: "Sign In",
    },
    notifications: {
      headerTitle: "Notifications",
      unreadSuffix: "new",
      markAllRead: "Mark all read",
      saving: "Saving...",
      emptyTitle: "No notifications",
      emptySubtitle: "New signal and news notifications appear here",
      now: "Now",
      minuteSuffix: "min",
      hourSuffix: "h",
      dayAgoSuffix: "days ago",
    },
  },
};

export const UI_COPY: CopySchema = COPY[APP_LOCALE];
