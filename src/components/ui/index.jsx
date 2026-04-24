import { AnimatePresence, motion } from "framer-motion";
import {
  GlassCard,
  Skeleton,
  StatCardSkeleton,
  AppointmentSkeleton,
  EmptyState,
  PremiumSearch,
  PremiumProgressBar,
  StatusBadge,
  InvoiceCard,
  TimelineEvent,
  LoadingSpinner,
  QuickActionButton,
  BentoGridItem,
  WizardStep,
} from "./PremiumUI";

export {
  GlassCard,
  Skeleton,
  StatCardSkeleton,
  AppointmentSkeleton,
  EmptyState,
  PremiumSearch,
  PremiumProgressBar,
  StatusBadge,
  InvoiceCard,
  TimelineEvent,
  LoadingSpinner,
  QuickActionButton,
  BentoGridItem,
  WizardStep,
};

// Button component
export const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  fullWidth = false,
  loading = false,
  isLoading = false,
  className = "",
  ...props
}) => {
  const baseClass = "btn-base";
  const variantClass = `btn-${variant}`;
  const sizeClass =
    size === "sm"
      ? "px-2 py-1 text-sm"
      : size === "lg"
        ? "px-6 py-3 text-lg"
        : "";
  const widthClass = fullWidth ? "w-full" : "";
  const isBusy = loading || isLoading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isBusy}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${disabled || isBusy ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      whileHover={!(disabled || isBusy) ? { scale: 1.05 } : {}}
      whileTap={!(disabled || isBusy) ? { scale: 0.97 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Input component - supports text, email, password, number, date, datetime-local, select
export const Input = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  children, // For select options
  ...props
}) => {
  // Handle select element differently
  if (type === "select") {
    return (
      <div className="w-full mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-base ${error ? "border-red-500 focus:ring-red-500 animate-shake" : ""} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input-base ${error ? "border-red-500 focus:ring-red-500 animate-shake" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// Textarea component
export const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        className={`input-base ${error ? "border-red-500 focus:ring-red-500 animate-shake" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

// Badge component
export const Badge = ({ children, variant = "pending", className = "" }) => {
  const badgeClass = `badge badge-${variant}`;
  return (
    <motion.span
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className={`${badgeClass} ${className}`}
    >
      {children}
    </motion.span>
  );
};

// Card component
export const Card = ({ children, className = "", header, footer }) => {
  return (
    <motion.div
      layout
      whileHover={{ y: -3, boxShadow: "0 24px 40px rgba(15, 23, 42, 0.08)" }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`card ${className}`}
    >
      {header && (
        <div className="mb-4 pb-4 border-b border-gray-200">{header}</div>
      )}
      {children}
      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-200">{footer}</div>
      )}
    </motion.div>
  );
};

// Modal component
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  const sizeClass =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <motion.div
            className={`${sizeClass} bg-white rounded-lg shadow-lg max-h-screen overflow-y-auto`}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="flex justify-between items-center border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">{children}</div>
            {footer && (
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Loading Spinner component
export const Spinner = ({ size = "md" }) => {
  const sizeClass =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-12 h-12" : "w-8 h-8";
  return (
    <div
      className={`${sizeClass} border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin`}
    />
  );
};

// Alert component
export const Alert = ({ type = "info", message, onClose }) => {
  const bgColor = {
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={`${bgColor[type]} px-4 py-3 rounded-lg mb-4 flex justify-between items-center`}
      >
        <p>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-lg font-bold hover:opacity-70"
          >
            ×
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
