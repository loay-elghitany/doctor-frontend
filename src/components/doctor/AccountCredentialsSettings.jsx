import { useState } from "react";
import axios from "axios";

const AccountCredentialsSettings = () => {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const payload = {};
      if (email.trim()) {
        payload.email = email.trim();
      }
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const response = await axios.put(
        "/api/doctor/update-credentials",
        payload,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response?.data?.success) {
        setMessage({
          type: "success",
          text: response.data.message || "تم تحديث بيانات الحساب بنجاح",
        });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setMessage({
          type: "error",
          text: response?.data?.message || "حدث خطأ أثناء الحفظ",
        });
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "حدث خطأ أثناء الحفظ";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto bg-white shadow-sm rounded-3xl border border-slate-200 p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          إعدادات بيانات الحساب
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          حدّث بريدك الإلكتروني أو كلمة المرور بأمان.
        </p>
      </div>

      {message.text && (
        <div
          className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            البريد الإلكتروني الجديد
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="أدخل بريدًا إلكترونيًا جديدًا"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="border-t border-slate-200 pt-6">
          <div className="mb-4 text-sm font-semibold text-slate-800">
            تغيير كلمة المرور
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                كلمة المرور الحالية
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
    </section>
  );
};

export default AccountCredentialsSettings;
