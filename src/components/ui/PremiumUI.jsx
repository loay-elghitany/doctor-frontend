import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Calendar,
  Clock,
  User,
  CreditCard,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

// Premium Glass Card Component
export const GlassCard = ({
  children,
  className = "",
  hover = true,
  gradient = false,
  onClick,
}) => {
  const baseClasses = `
    backdrop-blur-md bg-white/70 dark:bg-gray-900/70
    border border-white/20 dark:border-gray-700/30
    rounded-[28px] p-6 shadow-lg
    transition-all duration-300
  `;

  const hoverClasses = hover
    ? "hover:scale-[1.02] hover:shadow-2xl hover:border-white/40"
    : "";
  const gradientClasses = gradient
    ? "bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20"
    : "";
  const clickableClasses = onClick ? "cursor-pointer" : "";

  return (
    <motion.div
      className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${clickableClasses} ${className}`}
      whileHover={hover ? { y: -4 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      layout
    >
      {children}
    </motion.div>
  );
};

// Skeleton Loader Component
export const Skeleton = ({ className = "", variant = "rectangular" }) => {
  const variants = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded-full h-4",
    image: "rounded-xl",
  };

  return <div className={`skeleton ${variants[variant]} ${className}`} />;
};

// Skeleton Card for Dashboard Stats
export const StatCardSkeleton = () => (
  <GlassCard className="p-6">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" variant="text" />
        <Skeleton className="h-8 w-16" variant="text" />
      </div>
    </div>
  </GlassCard>
);

// Skeleton for Appointment List
export const AppointmentSkeleton = () => (
  <GlassCard className="p-4">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-full" variant="circular" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" variant="text" />
        <Skeleton className="h-4 w-48" variant="text" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </GlassCard>
);

// Empty State Component
export const EmptyState = ({
  icon: Icon = FileText,
  title = "No Data Available",
  description = "There's nothing to show here yet.",
  actionLabel,
  onAction,
  size = "md",
}) => {
  const sizes = {
    sm: { icon: 48, title: "text-lg", desc: "text-sm", padding: "py-8" },
    md: { icon: 64, title: "text-xl", desc: "text-base", padding: "py-12" },
    lg: { icon: 80, title: "text-2xl", desc: "text-lg", padding: "py-16" },
  };

  const currentSize = sizes[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`empty-state ${currentSize.padding}`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 p-4 rounded-full bg-blue-50 dark:bg-blue-900/20">
          <Icon
            className={`w-${currentSize.icon} h-${currentSize.icon} text-blue-500`}
            style={{ width: currentSize.icon, height: currentSize.icon }}
          />
        </div>
        <h3
          className={`font-semibold text-gray-900 dark:text-white ${currentSize.title} mb-2`}
        >
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
        {actionLabel && onAction && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className="btn-premium btn-premium-primary px-6 py-3"
          >
            {actionLabel}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Premium Search Bar Component
export const PremiumSearch = ({
  value,
  onChange,
  placeholder = "Search...",
  onKeyPress,
  className = "",
}) => {
  return (
    <motion.div
      className={`relative ${className}`}
      whileFocusWithin={{ scale: 1.02 }}
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        className="premium-search w-full pl-12 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md">
          ⌘K
        </kbd>
      </div>
    </motion.div>
  );
};

// Premium Progress Bar
export const PremiumProgressBar = ({
  value = 0,
  max = 100,
  color = "primary",
  showLabel = false,
  size = "md",
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const colors = {
    primary: "from-blue-500 to-cyan-400",
    success: "from-green-500 to-emerald-400",
    warning: "from-amber-500 to-orange-400",
    danger: "from-red-500 to-rose-400",
  };

  return (
    <div className="w-full">
      <div
        className={`premium-progress ${sizes[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700`}
      >
        <motion.div
          className={`h-full bg-gradient-to-r ${colors[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};

// Status Badge Component
export const StatusBadge = ({ status, size = "sm" }) => {
  const statusConfig = {
    scheduled: {
      color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
      icon: Calendar,
    },
    pending: {
      color:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      icon: Clock,
    },
    confirmed: {
      color:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      icon: CheckCircle,
    },
    completed: {
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      icon: Activity,
    },
    cancelled: {
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      icon: XCircle,
    },
    reschedule_proposed: {
      color:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
      icon: Calendar,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  const sizes = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-5 py-2 text-base",
  };

  return (
    <motion.span
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizes[size]}`}
    >
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status.replace(/_/g, " ")}</span>
    </motion.span>
  );
};

// Invoice Card Component
export const InvoiceCard = ({
  title,
  amount,
  dueDate,
  status,
  progress,
  onClick,
}) => {
  return (
    <GlassCard className="p-6 cursor-pointer" onClick={onClick} gradient>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
            {title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Due: {dueDate}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {amount}
          </span>
          {progress !== undefined && (
            <span className="text-sm text-gray-500">{progress}% paid</span>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <PremiumProgressBar
          value={progress}
          max={100}
          color={progress >= 100 ? "success" : "primary"}
          size="sm"
        />
      )}
    </GlassCard>
  );
};

// Timeline Event Component
export const TimelineEvent = ({
  icon: Icon,
  title,
  description,
  date,
  metadata,
  isLast = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative pl-12 pb-8"
    >
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-cyan-300 dark:from-blue-600 dark:to-cyan-500" />
      )}

      {/* Timeline Dot */}
      <div className="absolute left-0 top-6 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
        <Icon className="w-4 h-4 text-white" />
      </div>

      {/* Event Card */}
      <GlassCard className="ml-4" hover={false}>
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {date}
          </span>
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {description}
          </p>
        )}
        {metadata && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(metadata).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
              >
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

// Loading Spinner with Animation
export const LoadingSpinner = ({ size = "md", message = "Loading..." }) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} border-4 border-blue-200 border-t-blue-500 rounded-full`}
      />
      {message && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      )}
    </motion.div>
  );
};

// Quick Action Button
export const QuickActionButton = ({ icon: Icon, label, onClick, badge }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30 hover:shadow-lg transition-all duration-300"
    >
      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
        {label}
      </span>
      {badge && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
          {badge}
        </span>
      )}
    </motion.button>
  );
};

// Bento Grid Item
export const BentoGridItem = ({
  children,
  span = 3,
  className = "",
  delay = 0,
}) => {
  const spanClasses = {
    3: "col-span-3",
    4: "col-span-4",
    6: "col-span-6",
    8: "col-span-8",
    12: "col-span-12",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`${spanClasses[span]} ${className}`}
    >
      <GlassCard className="h-full">{children}</GlassCard>
    </motion.div>
  );
};

// Wizard Step Component
export const WizardStep = ({
  step,
  title,
  description,
  isActive,
  isCompleted,
}) => {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
            isCompleted
              ? "bg-gradient-to-br from-green-500 to-emerald-400 text-white"
              : isActive
                ? "bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500"
          }`}
        >
          {isCompleted ? <CheckCircle className="w-5 h-5" /> : step}
        </motion.div>
        <p
          className={`mt-2 text-sm font-medium ${isActive ? "text-gray-900 dark:text-white" : "text-gray-500"}`}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Connector Line */}
      <div className="flex-1 mx-4 h-0.5 bg-gray-200 dark:bg-gray-700">
        {isCompleted && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
          />
        )}
      </div>
    </div>
  );
};
