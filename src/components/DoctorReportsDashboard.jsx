import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MainLayout } from "./layout/Layout";
import { GlassCard, EmptyState, LoadingSpinner } from "./ui";
import { doctorReportsService } from "../services/doctorReportsService";
import { useAuth } from "../context/AuthContext";
import {
  CalendarRange,
  TrendingUp,
  CheckCircle2,
  Users,
  CircleDollarSign,
  ReceiptText,
  Clock3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const DoctorReportsDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [range, setRange] = useState("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const RANGE_OPTIONS = [
    { value: "today", label: t("reports.range_today") },
    { value: "week", label: t("reports.range_week") },
    { value: "last_week", label: t("reports.range_last_week") },
    { value: "month", label: t("reports.range_month") },
    { value: "year", label: t("reports.range_year") },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await doctorReportsService.getDashboard(
          range,
          user?.clinicSlug,
        );
        setData(response?.data?.data || null);
      } catch (err) {
        setError(err?.response?.data?.message || t("reports.error_loading"));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [range, user?.clinicSlug]);

  const metrics = useMemo(() => {
    if (!data?.metrics) {
      return {
        totalAppointments: 0,
        completedAppointments: 0,
        attendanceRate: 0,
        totalRevenue: 0,
        pendingInvoices: 0,
        peakBookingHour: "--",
      };
    }

    return data.metrics;
  }, [data]);

  const comparison = data?.comparison || {};

  const statCards = [
    {
      title: t("reports.stat_total_appointments"),
      value: metrics.totalAppointments,
      helper: t("reports.stat_helper_prev"),
      delta: comparison.totalAppointmentsDelta,
      icon: CalendarRange,
      accent: "from-blue-600 to-cyan-500",
    },
    {
      title: t("reports.stat_completed_appointments"),
      value: metrics.completedAppointments,
      helper: t("reports.stat_helper_completed"),
      delta: comparison.completedDelta,
      icon: CheckCircle2,
      accent: "from-emerald-600 to-green-500",
    },
    {
      title: t("reports.stat_attendance_rate"),
      value: formatPercent(metrics.attendanceRate),
      helper: t("reports.stat_helper_attendance"),
      delta: comparison.completedDelta,
      icon: Users,
      accent: "from-violet-600 to-fuchsia-500",
    },
    {
      title: t("reports.stat_total_revenue"),
      value: `${formatCurrency(metrics.totalRevenue)} ${t("reports.currency")}`,
      helper: t("reports.stat_helper_revenue"),
      delta: comparison.revenueDelta,
      icon: CircleDollarSign,
      accent: "from-amber-600 to-orange-500",
    },
  ];

  if (loading) {
    return (
      <MainLayout userType="doctor">
        <LoadingSpinner message={t("reports.loading")} size="lg" />
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="doctor">
      <div className="space-y-8" dir="rtl">
        <GlassCard gradient className="overflow-hidden border border-white/40">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                Reports & Analytics
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                {t("reports.title")}
              </h1>
              <p className="mt-3 text-base text-slate-600">
                {t("reports.subtitle")}
              </p>
            </div>
            <div className="flex min-w-[220px] flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
              <label className="text-sm font-medium text-slate-600">
                {t("reports.date_range_label")}
              </label>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {error ? (
          <GlassCard>
            <p className="text-sm text-red-600">{error}</p>
          </GlassCard>
        ) : null}

        {!error && data?.isEmpty ? (
          <EmptyState
            icon={ReceiptText}
            title={t("reports.empty_title")}
            description={t("reports.empty_desc")}
            size="md"
          />
        ) : null}

        {!error && !data?.isEmpty ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                const isPositive = (card.delta || 0) >= 0;
                return (
                  <GlassCard key={card.title} className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{card.title}</p>
                        <p className="mt-3 text-2xl font-bold text-slate-900">
                          {card.value}
                        </p>
                      </div>
                      <div
                        className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-slate-500">{card.helper}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {Number(card.delta || 0).toFixed(1)}%
                      </span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      {t("reports.quick_summary")}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {t("reports.clinic_performance")}
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      {t("reports.peak_booking_hour")}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {metrics.peakBookingHour}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      {t("reports.pending_invoices")}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {metrics.pendingInvoices}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      {t("reports.pending_invoices_value")}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {formatCurrency(metrics.pendingInvoiceValue)}{" "}
                      {t("reports.currency")}
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">
                      {t("reports.clinic_log")}
                    </p>
                    <h2 className="text-xl font-bold text-slate-900">
                      {data?.clinicSlug || user?.clinicSlug || "clinic"}
                    </h2>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span>{t("reports.cancelled_appointments")}</span>
                    <span className="font-semibold text-slate-900">
                      {metrics.cancelledAppointments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span>{t("reports.stat_completed_appointments")}</span>
                    <span className="font-semibold text-slate-900">
                      {metrics.completedAppointments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span>{t("reports.attendance_rate_label")}</span>
                    <span className="font-semibold text-slate-900">
                      {formatPercent(metrics.attendanceRate)}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default DoctorReportsDashboard;
