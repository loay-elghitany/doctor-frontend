import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import financialService from "../services/financialService";

const PatientFinancials = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const response = await financialService.getMySummary();
        // Extract plans from the correct nested structure
        const plansData = response.data?.data?.plans || [];
        setSummary(Array.isArray(plansData) ? plansData : []);
      } catch (error) {
        console.error("Error fetching financials", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancials();
  }, []);

  if (loading)
    return <div className="text-center p-6">جاري تحميل الحسابات...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800">حساباتي وخطة العلاج</h2>

      {!Array.isArray(summary) || summary.length === 0 ? (
        <p className="text-gray-500">لا توجد خطط علاجية حالياً.</p>
      ) : (
         summary.map((plan) => {
           const progress = Math.min(
             (plan.amountPaid / plan.totalCost) * 100,
             100
           );

           return (
             <motion.div
               key={plan.id}
               whileHover={{ scale: 1.01 }}
               className="bg-white/60 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 shadow-sm"
             >
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-semibold text-teal-700">
                   {plan.title}
                 </h3>
                 <span
                   className={`px-3 py-1 rounded-full text-sm font-medium ${
                     plan.status === "completed"
                       ? "bg-green-100 text-green-700"
                       : "bg-blue-100 text-blue-700"
                   }`}
                 >
                   {plan.status === "completed" ? "مكتمل" : "مستمر"}
                 </span>
               </div>

               <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                 <div className="bg-gray-50 p-3 rounded-lg">
                   <p className="text-sm text-gray-500">الإجمالي</p>
                   <p className="text-lg font-bold text-gray-800">
                     {plan.totalCost} ج.م
                   </p>
                 </div>
                 <div className="bg-green-50 p-3 rounded-lg">
                   <p className="text-sm text-green-600">المدفوع</p>
                   <p className="text-lg font-bold text-green-700">
                     {plan.amountPaid} ج.م
                   </p>
                 </div>
                 <div className="bg-red-50 p-3 rounded-lg">
                   <p className="text-sm text-red-500">المتبقي</p>
                   <p className="text-lg font-bold text-red-600">
                     {plan.remainingBalance} ج.م
                   </p>
                 </div>
               </div>

               {/* Progress Bar */}
               <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   className="bg-teal-500 h-2.5 rounded-full"
                 ></motion.div>
               </div>
               <p className="text-right text-xs text-gray-500">
                 % {progress.toFixed(0)} تم سداده
               </p>
             </motion.div>
           );
         })
      )}
    </motion.div>
  );
};

export default PatientFinancials;
