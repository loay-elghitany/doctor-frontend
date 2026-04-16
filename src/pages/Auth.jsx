import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Button } from "../components/ui";
import { AuthLayout } from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";
import { motion } from "framer-motion";
import { Users, Calendar, Lock, BarChart3 } from "lucide-react";

// Enhanced Home/Landing Page
export const Home = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const roleCards = [
    {
      title: "المرضى",
      description: "احجز مواعيد طبية بسهولة وتابع رحلتك الصحية في مكان واحد",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "الأطباء",
      description: "أدر مواعيدك ومرضاك وسجلاتهم الطبية بكفاءة عالية",
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "السكرتارية",
      description: "نظم جدول العيادة وأدر العمليات الإدارية بسلاسة",
      icon: Lock,
      color: "from-green-500 to-emerald-500",
    },
  ];

  const features = [
    {
      icon: Users,
      title: "إدارة المرضى",
      description: "سجل شامل لكل مريض مع التاريخ الطبي الكامل",
    },
    {
      icon: Calendar,
      title: "نظام المواعيد",
      description: "حجز ذكي مع إشعارات تلقائية ومتابعة سهلة",
    },
    {
      icon: Lock,
      title: "أدوار وصلاحيات",
      description: "تحكم آمن بصلاحيات كل مستخدم حسب دوره",
    },
    {
      icon: BarChart3,
      title: "لوحات تحكم ذكية",
      description: "رؤى وتحليلات فورية لأداء العيادة",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "التسجيل",
      description: "إنشاء حساب بسيط لك أو للعيادة",
    },
    {
      number: "2",
      title: "الإعداد",
      description: "أضف فريقك والمرضى والمواعيد",
    },
    {
      number: "3",
      title: "الإدارة",
      description: "ابدأ بتنظيم عملك بكفاءة أعلى",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              mydoc90
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("roles")}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              الأدوار
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              المميزات
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              كيفية الاستخدام
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              mydoc90 — إدارة عيادتك بذكاء وسهولة
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              نظام متكامل لإدارة المرضى، المواعيد، والسكرتارية… سواء كنت دكتور،
              مريض، أو سكرتير — كل حاجة في مكان واحد.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/login")}
                className="px-8 py-3 text-lg"
              >
                ابدأ الآن مجاناً
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => scrollToSection("features")}
                className="px-8 py-3 text-lg"
              >
                اعرف أكتر
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Background gradient decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
      </section>

      {/* Roles Section */}
      <section
        id="roles"
        className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              مصمم لكل من في العيادة
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              أدوات مخصصة لكل دور بما يناسب احتياجاته
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {roleCards.map((role, index) => {
              const Icon = role.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group relative"
                  whileHover={{ y: -5 }}
                >
                  <div
                    className={`bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 absolute -inset-0.5 rounded-2xl blur transition`}
                  ></div>
                  <Card className="relative p-8 dark:bg-gray-800 dark:border-gray-700 h-full">
                    <div
                      className={`bg-gradient-to-br ${role.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {role.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-right">
                      {role.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              المميزات الأساسية
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              كل ما تحتاجه لتشغيل عيادتك بكفاءة
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex gap-6 p-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              كيفية الاستخدام
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              ثلاث خطوات بسيطة للبدء الآن
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative"
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4 text-white text-3xl font-bold shadow-lg"
                  >
                    {step.number}
                  </motion.div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              جاهز للبدء؟
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
              انضم الآن وابدأ إدارة عيادتك بطريقة أذكى وأسهل
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/login")}
              className="px-8 py-3 text-lg"
            >
              ابدأ الآن مجاناً
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2024 mydoc90. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
};

// Placeholder Login Page
export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [userType, setUserType] = React.useState("patient");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const defaultRedirect =
    userType === "patient"
      ? "/patient/dashboard"
      : userType === "doctor"
        ? "/doctor/dashboard"
        : userType === "secretary"
          ? "/secretary/dashboard"
          : "/login";

  const safeFromPath = location.state?.from?.pathname;
  const from =
    safeFromPath && safeFromPath.startsWith(`/${userType}`)
      ? safeFromPath
      : defaultRedirect;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    // Backend requires password for all roles (patient and doctor)
    if (!password) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    console.log("Login attempt:", { userType, email: trimmedEmail });

    try {
      const user = await login(trimmedEmail, password, userType);
      console.log("Login success:", user);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred.";
      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Login
        </h2>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4 mb-6">
            <label className="flex items-center">
              <input
                type="radio"
                value="patient"
                checked={userType === "patient"}
                onChange={(e) => setUserType(e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-700">Patient</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="doctor"
                checked={userType === "doctor"}
                onChange={(e) => setUserType(e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-700">Doctor</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="secretary"
                checked={userType === "secretary"}
                onChange={(e) => setUserType(e.target.value)}
                className="mr-2"
              />
              <span className="text-gray-700">Secretary</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>
      </Card>
    </AuthLayout>
  );
};
