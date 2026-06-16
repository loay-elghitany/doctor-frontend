import { useTranslation } from "react-i18next";
import { useState } from "react";
import axios from "axios";

const AccountCredentialsSettings = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const payload = {
        email: email.trim(),
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      };

      const response = await axios.put(
        `${apiUrl}/doctor/update-credentials`,
        payload,
        {
          withCredentials: true,
        },
      );

      if (response?.data?.message) {
        setSuccessMessage(response.data.message);
        setErrorMessage("");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setSuccessMessage("");
        setErrorMessage("تم إرسال الطلب ولكن لم يتم تلقي رد صالح من الخادم.");
      }
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.message ||
        "حدث خطأ أثناء حفظ البيانات. حاول مرة أخرى.";
      setErrorMessage(serverMessage);
      setSuccessMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-lg sm:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">
          تحديث بيانات الدخول
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          قم بتحديث بريدك الإلكتروني وكلمة المرور بأمان. ستبقى بيانات ملف
          العيادة منفصلة.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            البريد الإلكتروني الجديد
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t(
              "components_AccountCredentialsSettings.attr_placeholder_example_clinic_com",
            )}
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 z-10 h-px w-24 -translate-x-1/2 bg-slate-200"></div>
          <div className="relative z-20 mx-auto flex w-full justify-center">
            <span className="rounded-full bg-white px-4 text-xs uppercase tracking-[0.24em] text-slate-500 shadow-sm">
              تغيير كلمة المرور
            </span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              كلمة المرور الحالية
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="••••••••••"
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="••••••••••"
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
    </div>
  );
};

export default AccountCredentialsSettings;
