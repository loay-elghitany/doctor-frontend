import { motion } from "framer-motion";

const floatMotion = {
  y: [0, -6, 0],
  x: [0, 4, 0],
};

export const MedicalHeroIllustration = () => {
  return (
    <div className="relative isolate overflow-hidden rounded-[28px] border border-slate-200 bg-blue-50/60 p-5 shadow-sm">
      <motion.div
        className="absolute -left-8 top-4 h-24 w-24 rounded-full bg-blue-200/80 blur-2xl"
        animate={floatMotion}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute right-6 bottom-3 h-20 w-20 rounded-full bg-sky-100/90 blur-2xl"
        animate={{ y: [0, 8, 0], x: [0, -4, 0] }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -right-4 top-14 h-16 w-16 rounded-full bg-white/70 shadow-lg"
        animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      <motion.svg
        viewBox="0 0 320 240"
        fill="none"
        className="relative h-full w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <rect
          x="10"
          y="20"
          width="300"
          height="180"
          rx="32"
          fill="#ffffff"
          stroke="#bfdbfe"
          strokeWidth="2"
        />
        <path
          d="M74 124c0-22 18-40 40-40h88c22 0 40 18 40 40v24c0 22-18 40-40 40H114c-22 0-40-18-40-40v-24Z"
          fill="#eff6ff"
        />
        <circle cx="126" cy="112" r="22" fill="#93c5fd" />
        <path
          d="M94 164c5-20 23-32 46-32s41 12 46 32"
          stroke="#60a5fa"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect x="132" y="72" width="40" height="50" rx="14" fill="#dbeafe" />
        <path
          d="M146 94h28"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M150 112h20"
          stroke="#60a5fa"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <motion.path
          d="M56 76c7-12 26-22 38-14 12 8 18 24 15 38-3 14-16 24-30 24-14 0-26-10-29-24-2-10 1-22 6-24Z"
          fill="#dbeafe"
          animate={{ rotate: [0, 2, 0], scale: [1, 1.02, 1] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          style={{ originX: "50%", originY: "50%" }}
        />
        <motion.path
          d="M196 56c2-12 16-20 28-18 12 2 22 14 20 26-2 12-14 20-26 18-10-2-20-12-22-24Z"
          fill="#bfdbfe"
          animate={{ y: [0, -4, 0], rotate: [0, 4, 0] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          style={{ originX: "50%", originY: "50%" }}
        />
        <circle cx="226" cy="86" r="8" fill="#3b82f6" />
        <circle cx="252" cy="62" r="6" fill="#60a5fa" />
        <circle cx="40" cy="58" r="6" fill="#93c5fd" />
      </motion.svg>
    </div>
  );
};
