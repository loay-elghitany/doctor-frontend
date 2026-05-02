import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  Facebook,
  HeartPulse,
  Instagram,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import doctorService from "../services/doctorService";
import { getMainDomain, getTenantSubdomain } from "../utils/subdomain";

const buildMainDomainUrl = () => {
  const domain = getMainDomain();
  if (domain) {
    return `${window.location.protocol}//${domain}`;
  }
  return `${window.location.protocol}//${window.location.host}`;
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const floatingIcons = [
  {
    Icon: Activity,
    className: "left-[8%] top-[26%] text-cyan-300/45",
    duration: 5.5,
  },
  {
    Icon: HeartPulse,
    className: "right-[14%] top-[18%] text-blue-200/40",
    duration: 6.5,
  },
  {
    Icon: Stethoscope,
    className: "left-[22%] bottom-[12%] text-teal-200/35",
    duration: 7.2,
  },
];

const fallbackPattern = (themeColor) => ({
  backgroundImage: `
      radial-gradient(circle at 15% 20%, ${themeColor}33 0%, transparent 45%),
      radial-gradient(circle at 80% 10%, #0ea5e933 0%, transparent 40%),
      radial-gradient(circle at 80% 90%, #14b8a633 0%, transparent 40%),
      linear-gradient(135deg, #0f172a 0%, #0b2742 45%, #0f766e 100%)
    `,
});

const StatCard = ({ icon: Icon, title, text }) => (
  <motion.div
    variants={fadeUp}
    whileInView="visible"
    initial="hidden"
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.55 }}
    className="rounded-2xl border border-white/30 bg-white/65 p-5 shadow-lg backdrop-blur-xl"
  >
    <div className="mb-3 inline-flex rounded-xl bg-slate-900 p-2 text-cyan-300">
      <Icon size={18} />
    </div>
    <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
  </motion.div>
);

// Helper to clean phone number for WhatsApp link
const cleanPhoneNumber = (phone) => {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
};

// Social icon configuration with colors and icons
const socialConfig = [
  {
    key: "facebook",
    Icon: Facebook,
    color: "#1877F2",
    hoverColor: "hover:text-[#1877F2]",
    label: "Facebook",
  },
  {
    key: "instagram",
    Icon: Instagram,
    color: "#E4405F",
    hoverColor: "hover:text-[#E4405F]",
    label: "Instagram",
  },
  {
    key: "twitter",
    Icon: X,
    color: "#1DA1F2",
    hoverColor: "hover:text-[#1DA1F2]",
    label: "Twitter",
  },
  {
    key: "whatsApp",
    Icon: MessageCircle,
    color: "#25D366",
    hoverColor: "hover:text-[#25D366]",
    label: "WhatsApp",
  },
];

// Individual social icon component with animation
const SocialIcon = ({ link, config, index }) => {
  const { Icon, hoverColor, label } = config;

  return (
    <motion.a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-colors duration-200 ${hoverColor} hover:bg-white/20 hover:text-white shadow-md hover:shadow-lg`}
      aria-label={label}
      title={label}
    >
      <Icon size={18} strokeWidth={2} />
    </motion.a>
  );
};

// Floating WhatsApp button with pulse animation
const FloatingWhatsAppButton = ({ phoneNumber }) => {
  const whatsappLink = phoneNumber
    ? `https://wa.me/${cleanPhoneNumber(phoneNumber)}`
    : null;

  if (!whatsappLink) return null;

  return (
    <motion.a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_15px_rgba(37,211,102,0.4)] md:bottom-24 md:right-8"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 0 0 0 rgba(37, 211, 102, 0.4)",
          "0 0 0 12px rgba(37, 211, 102, 0)",
        ],
      }}
      transition={{
        scale: { duration: 0.3, repeat: Infinity, repeatType: "reverse" },
        boxShadow: { duration: 2, repeat: Infinity, ease: "easeOut" },
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Contact us on WhatsApp"
      title="تواصل معنا عبر WhatsApp"
    >
      <MessageCircle size={24} strokeWidth={2} />
    </motion.a>
  );
};

export const DoctorLandingPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const clinicSlug = useMemo(() => getTenantSubdomain(), []);
  const mainDomainUrl = useMemo(() => buildMainDomainUrl(), []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await doctorService.getPublicProfile(clinicSlug);
        setProfile(response.data?.data || null);
      } catch (err) {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(
            err.response?.data?.message || "Failed to load clinic profile",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [clinicSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Loading clinic profile...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Clinic Not Found</h1>
        <p className="text-slate-600">
          هذا العنوان غير مرتبط بأي عيادة مسجلة لدينا. يرجى التحقق من الرابط أو
          العودة إلى الموقع الرئيسي للعثور على العيادة الصحيحة.
        </p>
        <a
          href={mainDomainUrl}
          className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          العودة إلى الصفحة الرئيسية
        </a>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || "Unable to load profile."}</p>
        <a
          href={mainDomainUrl}
          className="rounded-xl bg-slate-900 px-6 py-3 text-white"
        >
          العودة إلى الصفحة الرئيسية
        </a>
      </div>
    );
  }

  const themeColor = profile.landingPageSettings?.themeColor || "#2563eb";
  const ctaText =
    profile.landingPageSettings?.welcomeMessage ||
    `Welcome to ${profile.name}'s clinic`;
  const clinicPhotos = profile.clinicPhotos || [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={
            profile.coverImage
              ? {
                  backgroundImage: `url(${profile.coverImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : fallbackPattern(themeColor)
          }
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/55 via-slate-900/70 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%)]" />

        {floatingIcons.map(({ Icon, className, duration }) => (
          <motion.div
            key={`${className}-${duration}`}
            className={`pointer-events-none absolute ${className}`}
            animate={{ y: [0, -10, 0], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon size={48} strokeWidth={1.5} />
          </motion.div>
        ))}

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-28">
          <header className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white/95">
              {profile.name}
            </h1>
            <Link
              to="/login"
              className="rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
            >
              إبدأ من هنا
            </Link>
          </header>

          <motion.div
            className="mt-14 max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.7 }}
          >
            <span
              className="inline-flex items-center rounded-full border border-white/35 px-4 py-1 text-sm font-medium text-white/95 backdrop-blur-md"
              style={{ backgroundColor: `${themeColor}66` }}
            >
              {profile.specialty || "Healthcare Excellence"}
            </span>
            <h2 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
              {ctaText}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
              {profile.bio ||
                "اكتشف رعاية صحية مخصصة تجمع بين الخبرة الطبية والتكنولوجيا الحديثة لتوفير تجربة علاجية استثنائية تضع راحتك وصحتك في المقام الأول."}
            </p>
            <motion.button
              onClick={() => navigate("/login")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(56,189,248,0.55)",
                  "0 0 0 14px rgba(56,189,248,0)",
                ],
              }}
              transition={{
                boxShadow: { duration: 1.8, repeat: Infinity, ease: "easeOut" },
              }}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 px-7 py-3 text-base font-semibold text-white shadow-[0_12px_35px_rgba(14,165,233,0.45)] cursor-pointer"
            >
              <CalendarClock size={18} />
              حجز موعد
            </motion.button>
          </motion.div>
        </div>

        <div className="relative mx-auto -mt-16 max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="inline-flex rounded-3xl border-4 border-white/75 bg-white/20 p-2 backdrop-blur-md shadow-2xl"
          >
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.name}
                className="h-28 w-28 rounded-2xl object-cover sm:h-36 sm:w-36"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-200 text-slate-500 sm:h-36 sm:w-36">
                لا يوجد صور
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="grid gap-5 md:grid-cols-3"
        >
          <StatCard
            icon={ShieldCheck}
            title="علاج موثوق وآمن"
            text="رعاية صحية موثوقة وآمنة مع التزام صارم بأعلى معايير الجودة والسلامة في كل خطوة من رحلتك العلاجية."
          />
          <StatCard
            icon={Stethoscope}
            title="الطب العام"
            text="خبرة متخصصة مصممة لاحتياجاتك وسجلك الطبي وأهدافك الصحية طويلة المدى."
          />
          <StatCard
            icon={HeartPulse}
            title="تجربة مخصصة"
            text="تجربة رعاية صحية مخصصة تجمع بين الخبرة الطبية والتكنولوجيا الحديثة لتوفير تجربة علاجية استثنائية تضع راحتك وصحتك في المقام الأول."
          />
        </motion.section>

        <motion.section
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
          className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">
                معرض العيادة
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                نظرة سريعة على بيئة الرعاية ومرافقنا في العيادة.
              </p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              {profile.clinicInfo?.clinicSlug || "Clinic"}
            </p>
          </div>

          {clinicPhotos.length ? (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>div:not(:first-child)]:mt-4">
              {clinicPhotos.map((photo, idx) => (
                <motion.div
                  key={`${photo}-${idx}`}
                  whileHover={{ scale: 1.02 }}
                  className="group relative overflow-hidden rounded-2xl bg-slate-200 shadow-sm transition"
                >
                  <img
                    src={photo}
                    alt={`Clinic ${idx + 1}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-95"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              لا توجد صور للعيادة حالياً.
            </div>
          )}
        </motion.section>
      </main>

      {/* Footer with Social Links */}
      <footer className="relative bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold">تواصل مع {profile.name}</h3>
              <p className="mt-2 text-sm text-slate-400">
                تابعنا على وسائل التواصل الاجتماعي للبقاء على اطلاع بأحدث
                الأخبار والعروض من عيادتنا. نحن هنا لدعمك في رحلتك الصحية!
              </p>
            </div>

            {/* Social Media Icons */}
            <motion.div
              className="flex items-center gap-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.15,
                    delayChildren: 0.2,
                  },
                },
              }}
            >
              {socialConfig.map((config, index) => {
                const link = profile.publicContactInfo?.[config.key];
                if (!link) return null;

                // Format WhatsApp link with wa.me prefix
                const formattedLink =
                  config.key === "whatsApp"
                    ? `https://wa.me/${cleanPhoneNumber(link)}`
                    : link;

                return (
                  <SocialIcon
                    key={config.key}
                    link={formattedLink}
                    config={config}
                    index={index}
                  />
                );
              })}
            </motion.div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton
        phoneNumber={profile.publicContactInfo?.whatsApp}
      />

      <motion.button
        id="book-appointment"
        onClick={() => navigate("/login")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,165,233,0.45)] md:bottom-8 md:right-8 md:px-6 md:text-base cursor-pointer border-0"
      >
        <CalendarClock size={18} />
        احجز موعد
      </motion.button>
    </div>
  );
};
