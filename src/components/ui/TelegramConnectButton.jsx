import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

const TelegramConnectButton = ({ userRole, userId, isLinked, botUsername }) => {
  const { t } = useTranslation();
  const payload = `${userRole}_${userId}`;
  const telegramDeepLink = `https://t.me/${botUsername}?start=${encodeURIComponent(payload)}`;

  const baseClasses =
    "inline-flex items-center justify-center gap-3 rounded-3xl px-5 py-3 text-sm font-semibold transition-all duration-300 shadow-lg shadow-sky-500/15";
  const linkedClasses =
    "bg-emerald-500/10 text-emerald-900 border border-emerald-200 dark:border-emerald-700 dark:text-emerald-100 cursor-not-allowed";
  const unlinkedClasses =
    "bg-gradient-to-r from-[#229ED9] to-blue-400 text-white border border-white/20 hover:shadow-xl";

  if (!botUsername) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
        يرجى تكوين متغير البيئة{" "}
        <code className="font-mono">
          {t(
            "components_ui_TelegramConnectButton.text_vite_telegram_bot_username",
          )}
        </code>
      </div>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      {isLinked ? (
        <button
          type="button"
          className={`${baseClasses} ${linkedClasses}`}
          disabled
          aria-disabled="true"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
            <Send className="w-4 h-4" />
          </span>
          ✅ تم تفعيل إشعارات تليجرام
        </button>
      ) : (
        <motion.a
          href={telegramDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClasses} ${unlinkedClasses}`}
          aria-label={t(
            "components_ui_TelegramConnectButton.attr_aria_label_activate_telegram_no",
          )}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
            <Send className="w-4 h-4" />
          </span>
          📱 تفعيل إشعارات تليجرام (مجاناً)
        </motion.a>
      )}
    </motion.div>
  );
};

export default TelegramConnectButton;
