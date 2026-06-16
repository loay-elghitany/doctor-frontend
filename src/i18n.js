import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const translationPath = (lng) => `/locales/${lng}/translation.json`;

const fetchTranslations = async (lng) => {
  const response = await fetch(translationPath(lng));
  if (!response.ok) {
    throw new Error(`Unable to fetch translations for ${lng}`);
  }
  const payload = await response.json();
  return payload.translation || payload;
};

const initI18n = async () => {
  const [en, ar] = await Promise.all([
    fetchTranslations("en"),
    fetchTranslations("ar"),
  ]);

  const resources = {
    en: { translation: en },
    ar: { translation: ar },
  };

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "ar",
      initImmediate: false,
      react: {
        useSuspense: true,
        bindI18n: "languageChanged loaded",
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
      interpolation: { escapeValue: false },
    });
};

export const i18nReady = initI18n().catch((error) => {
  console.error("i18n initialization failed:", error);
});

// Helper to dynamically sync HTML attributes
export const syncHtmlDirection = (lng) => {
  const rootHtml = document.documentElement;
  rootHtml.setAttribute("lang", lng);
  rootHtml.setAttribute("dir", lng === "ar" ? "rtl" : "ltr");
};

i18n.on("languageChanged", (lng) => syncHtmlDirection(lng));

i18nReady.then(() => syncHtmlDirection(i18n.language));

export default i18n;
