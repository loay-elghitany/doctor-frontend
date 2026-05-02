import React, { useState, useEffect } from "react";
import financialService from "../services/financialService";
import { useCurrentRole } from "../hooks/useCurrentRole";
import { motion, AnimatePresence } from "framer-motion";
import CreateTreatmentPlanModal from "./CreateTreatmentPlanModal";
import {
  GlassCard,
  InvoiceCard,
  PremiumProgressBar,
  EmptyState,
  LoadingSpinner,
  StatusBadge,
} from "./ui/PremiumUI";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const FinancialManager = ({ patientId }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { role } = useCurrentRole(); // 'doctor' or 'secretary'

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await financialService.getPatientSummary(patientId);
      const plansData = res.data?.data?.plans || [];
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error("Error fetching patient financials", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchPlans();
  }, [patientId]);

  const handleAddPayment = async (planId) => {
    const amount = prompt("أدخل المبلغ المدفوع:");
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("الرجاء إدخال مبلغ صحيح أكبر من الصفر");
      return;
    }

    const payload = {
      planId,
      patientId,
      amountPaid: Number(amount),
      paymentMethod: "cash",
    };

    try {
      await financialService.createPayment(payload);
      alert("تم تسجيل الدفعة بنجاح");
      fetchPlans();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "حدث خطأ أثناء تسجيل الدفعة";
      alert(`خطأ: ${errorMessage}`);
      console.error("Payment creation error:", error);
    }
  };

  const handleCreatePlan = async (payload) => {
    try {
      await financialService.createTreatmentPlan(payload);
      alert("تم إنشاء خطة العلاج بنجاح");
      setIsModalOpen(false);
      fetchPlans();
    } catch (error) {
      console.error("Error creating treatment plan:", error);
      alert("حدث خطأ أثناء إنشاء خطة العلاج");
      throw error;
    }
  };

  // Calculate total statistics
  const totalStats = plans.reduce(
    (acc, plan) => {
      acc.totalCost += Number(plan.totalCost) || 0;
      acc.totalPaid += Number(plan.amountPaid) || 0;
      acc.totalRemaining += Number(plan.remainingBalance) || 0;
      return acc;
    },
    { totalCost: 0, totalPaid: 0, totalRemaining: 0 },
  );

  const overallProgress =
    totalStats.totalCost > 0
      ? Math.round((totalStats.totalPaid / totalStats.totalCost) * 100)
      : 0;

  // Get status for plan
  const getPlanStatus = (plan) => {
    if (plan.remainingBalance <= 0) return "completed";
    if (plan.amountPaid > 0) return "pending";
    return "scheduled";
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="mt-8">
        <LoadingSpinner message="Loading financial data..." />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard gradient className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Cost
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalStats.totalCost)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard gradient className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Paid
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalStats.totalPaid)}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard gradient className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Remaining
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalStats.totalRemaining)}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Overall Progress */}
      {plans.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                الملخص المالي العام
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(totalStats.totalPaid)} of{" "}
                {formatCurrency(totalStats.totalCost)} paid
              </p>
            </div>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {overallProgress}%
            </span>
          </div>
          <PremiumProgressBar
            value={overallProgress}
            max={100}
            color={overallProgress >= 100 ? "success" : "primary"}
            size="lg"
          />
        </GlassCard>
      )}

      {/* Treatment Plans Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            خطط العلاج
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            إدارة خطط الدفع وتتبع الرصيد المعلق
          </p>
        </div>
        {role === "doctor" && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="btn-premium btn-premium-primary px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            خطة جديدة
          </motion.button>
        )}
      </div>

      {/* Plans List */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6" gradient>
                  {/* Plan Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                        {plan.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Created:{" "}
                        {plan.createdAt
                          ? new Date(plan.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <StatusBadge status={getPlanStatus(plan)} size="md" />
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        الإجمالي
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(plan.totalCost)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                        مدفوع
                      </p>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(plan.amountPaid)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                      <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                        معلق
                      </p>
                      <p className="font-semibold text-red-700 dark:text-red-300">
                        {formatCurrency(plan.remainingBalance)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        تقدم الدفع
                      </span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {plan.totalCost > 0
                          ? Math.round((plan.amountPaid / plan.totalCost) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <PremiumProgressBar
                      value={
                        plan.totalCost > 0
                          ? (plan.amountPaid / plan.totalCost) * 100
                          : 0
                      }
                      max={100}
                      color={plan.remainingBalance <= 0 ? "success" : "primary"}
                      size="sm"
                    />
                  </div>

                  {/* Actions */}
                  {plan.remainingBalance > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddPayment(plan.id)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition"
                    >
                      <CreditCard className="w-4 h-4" />
                      تسجيل الدفع
                    </motion.button>
                  )}

                  {plan.remainingBalance <= 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 justify-center">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">الخطة مدفوعة بالكامل</span>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No Treatment Plans"
          description="There are no treatment plans created yet. Create a new plan to start tracking payments."
          actionLabel={role === "doctor" ? "Create First Plan" : undefined}
          onAction={role === "doctor" ? () => setIsModalOpen(true) : undefined}
        />
      )}

      {/* Create Plan Modal */}
      <CreateTreatmentPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreatePlan}
        patientId={patientId}
      />
    </div>
  );
};

export default FinancialManager;
