import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import doctorService from "../services/doctorService";
import { uploadImageToCloudinary } from "../utils/cloudinaryStorage";
import { getMainDomain } from "../utils/subdomain";
import {
  User,
  Image,
  Settings,
  Upload,
  Trash2,
  X,
  ExternalLink,
  Save,
  Camera,
  Plus,
  Loader2,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Palette,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// Tab configuration
const TABS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "visuals", label: "Visuals", icon: Image },
  { id: "details", label: "Clinic Details", icon: Settings },
];

// Animation variants
const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Glassmorphism Card Component
const GlassCard = ({ children, className = "", hover = true }) => (
  <motion.div
    className={`backdrop-blur-xl bg-white/70 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-lg ${hover ? "hover:shadow-xl hover:-translate-y-1" : ""} transition-all duration-300 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    {children}
  </motion.div>
);

// Image Upload with Preview Component
const ImageUploadPreview = ({
  label,
  imageSrc,
  onUpload,
  onRemove,
  uploading,
  aspectRatio = "square",
  placeholder,
  icon: Icon,
}) => {
  const fileInputRef = useRef(null);

  const aspectClasses = {
    square: "aspect-square",
    wide: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative group">
        {imageSrc ? (
          <div
            className={`relative overflow-hidden rounded-xl ${aspectClasses[aspectRatio]} bg-slate-100 dark:bg-slate-700`}
          >
            <img
              src={imageSrc}
              alt={label}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-5 h-5 text-slate-700" />
              </motion.button>
              <motion.button
                type="button"
                onClick={onRemove}
                className="p-3 bg-red-500/90 rounded-full hover:bg-red-500 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-5 h-5 text-white" />
              </motion.button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <motion.div
            className={`flex flex-col items-center justify-center ${aspectClasses[aspectRatio]} rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-300`}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {Icon ? (
              <Icon className="w-12 h-12 text-slate-400 mb-3" />
            ) : (
              <Upload className="w-12 h-12 text-slate-400 mb-3" />
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {placeholder || "Click to upload"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              PNG, JPG, WEBP (max 5MB)
            </p>
          </motion.div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files?.[0])}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  );
};

// Photo Gallery Item Component
const PhotoGalleryItem = ({ url, index, onDelete, uploading }) => (
  <motion.div
    className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700"
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.2 }}
  >
    <img
      src={url}
      alt={`Clinic photo ${index + 1}`}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
    {/* Delete button */}
    <motion.button
      type="button"
      onClick={() => onDelete(index)}
      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <X className="w-4 h-4" />
    </motion.button>
    {uploading && (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    )}
  </motion.div>
);

// Empty State Component
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
      {title}
    </h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
      {description}
    </p>
    {action}
  </div>
);

// Loading Skeleton Component
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
);

// Main Component
export const DoctorClinicProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState({
    bio: "",
    specialty: "",
    profilePicture: "",
    coverImage: "",
    clinicPhotos: [],
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
    landingPageSettings: {
      themeColor: "#2563eb",
      welcomeMessage: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const mainDomain = useMemo(() => getMainDomain(), []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await doctorService.getDoctorProfile();
        const data = response.data?.data || {};
        setForm((prev) => ({
          ...prev,
          bio: data.bio || "",
          specialty: data.specialty || "",
          profilePicture: data.profilePicture || "",
          coverImage: data.coverImage || "",
          clinicPhotos: data.clinicPhotos || [],
          socialLinks: {
            facebook: data.socialLinks?.facebook || "",
            instagram: data.socialLinks?.instagram || "",
            twitter: data.socialLinks?.twitter || "",
          },
          landingPageSettings: {
            themeColor: data.landingPageSettings?.themeColor || "#2563eb",
            welcomeMessage: data.landingPageSettings?.welcomeMessage || "",
          },
        }));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load clinic profile");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocial = (field, value) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value },
    }));
  };

  const updateLandingSettings = (field, value) => {
    setForm((prev) => ({
      ...prev,
      landingPageSettings: { ...prev.landingPageSettings, [field]: value },
    }));
  };

  // Image upload handlers
  const handleProfilePictureUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const downloadUrl = await uploadImageToCloudinary(file);
      updateField("profilePicture", downloadUrl);
    } catch (err) {
      setError(err.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleCoverImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const downloadUrl = await uploadImageToCloudinary(file);
      updateField("coverImage", downloadUrl);
    } catch (err) {
      setError(err.message || "Failed to upload cover image");
    } finally {
      setUploading(false);
    }
  };

  const handleClinicPhotosUpload = async (files) => {
    const fileArray = Array.from(files || []);
    if (!fileArray.length) return;
    try {
      setUploading(true);
      const uploaded = await Promise.all(
        fileArray.map((file) => uploadImageToCloudinary(file))
      );
      setForm((prev) => ({
        ...prev,
        clinicPhotos: [...prev.clinicPhotos, ...uploaded],
      }));
    } catch (err) {
      setError(err.message || "Failed to upload clinic photos");
    } finally {
      setUploading(false);
    }
  };

  // Image deletion handlers
  const handleRemoveProfilePicture = () => {
    updateField("profilePicture", "");
  };

  const handleRemoveCoverImage = () => {
    updateField("coverImage", "");
  };

  const handleDeletePhoto = (index) => {
    setForm((prev) => ({
      ...prev,
      clinicPhotos: prev.clinicPhotos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      await doctorService.updateClinicProfile(form);
      setMessage("Clinic profile saved successfully.");
      // Auto-hide success message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save clinic profile");
    } finally {
      setSaving(false);
    }
  };

  const previewUrl =
    mainDomain && user?.clinicSlug
      ? `${window.location.protocol}//${user.clinicSlug}.${mainDomain}`
      : null;

  // Render loading state
  if (loading) {
    return (
      <MainLayout userType="doctor">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout userType="doctor">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Clinic Profile
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Configure your public landing page and clinic branding.
          </p>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                {message}
              </p>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300 font-medium">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <GlassCard className="mb-6 p-2" hover={false}>
          <nav className="flex gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </GlassCard>

        {/* Tab Content */}
        <form onSubmit={handleSave}>
          <AnimatePresence mode="wait">
            {activeTab === "basic" && (
              <motion.div
                key="basic"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Basic Info Section */}
                <GlassCard className="p-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        Clinic Bio
                      </label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => updateField("bio", e.target.value)}
                        placeholder="Tell patients about your clinic..."
                        rows={4}
                        className="input-base resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        Specialty
                      </label>
                      <input
                        value={form.specialty}
                        onChange={(e) => updateField("specialty", e.target.value)}
                        placeholder="e.g., Cardiology, Dermatology, General Practice"
                        className="input-base"
                      />
                    </div>
                  </div>
                </GlassCard>

                {/* Social Links */}
                <GlassCard className="p-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Social Media Links
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        value={form.socialLinks.facebook}
                        onChange={(e) => updateSocial("facebook", e.target.value)}
                        placeholder="Facebook URL"
                        className="input-base pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        value={form.socialLinks.instagram}
                        onChange={(e) => updateSocial("instagram", e.target.value)}
                        placeholder="Instagram URL"
                        className="input-base pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        value={form.socialLinks.twitter}
                        onChange={(e) => updateSocial("twitter", e.target.value)}
                        placeholder="Twitter URL"
                        className="input-base pl-10"
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "visuals" && (
              <motion.div
                key="visuals"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Profile & Cover Images */}
                <GlassCard className="p-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    Branding Images
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUploadPreview
                      label="Profile Picture"
                      imageSrc={form.profilePicture}
                      onUpload={handleProfilePictureUpload}
                      onRemove={handleRemoveProfilePicture}
                      uploading={uploading}
                      aspectRatio="square"
                      placeholder="Upload profile picture"
                      icon={User}
                    />
                    <ImageUploadPreview
                      label="Cover Image"
                      imageSrc={form.coverImage}
                      onUpload={handleCoverImageUpload}
                      onRemove={handleRemoveCoverImage}
                      uploading={uploading}
                      aspectRatio="wide"
                      placeholder="Upload cover image"
                      icon={Image}
                    />
                  </div>
                </GlassCard>

                {/* Clinic Photos Gallery */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Image className="w-5 h-5 text-blue-600" />
                      Clinic Photos Gallery
                    </h2>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {form.clinicPhotos.length} photo{form.clinicPhotos.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {form.clinicPhotos.length > 0 ? (
                    <>
                      <motion.div
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6"
                        layout
                      >
                        <AnimatePresence>
                          {form.clinicPhotos.map((url, idx) => (
                            <PhotoGalleryItem
                              key={`${url}-${idx}`}
                              url={url}
                              index={idx}
                              onDelete={handleDeletePhoto}
                              uploading={uploading && uploadingPhotoIndex === idx}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.div>
                      {/* Add more photos button */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleClinicPhotosUpload(e.target.files)}
                          className="hidden"
                        />
                        <motion.button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Plus className="w-5 h-5" />
                          <span className="font-medium">Add More Photos</span>
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      icon={Image}
                      title="No Photos Yet"
                      description="Add photos of your clinic to help patients recognize your location and feel more comfortable before their visit."
                      action={
                        <motion.button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-primary flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Plus className="w-4 h-4" />
                          Upload First Photo
                        </motion.button>
                      }
                    />
                  )}
                </GlassCard>
              </motion.div>
            )}

            {activeTab === "details" && (
              <motion.div
                key="details"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Landing Page Settings */}
                <GlassCard className="p-6">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-blue-600" />
                    Landing Page Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        Theme Color
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <input
                            type="color"
                            value={form.landingPageSettings.themeColor}
                            onChange={(e) =>
                              updateLandingSettings("themeColor", e.target.value)
                            }
                            className="w-14 h-14 rounded-xl cursor-pointer border-2 border-slate-200 dark:border-slate-600"
                          />
                        </div>
                        <input
                          value={form.landingPageSettings.themeColor}
                          onChange={(e) =>
                            updateLandingSettings("themeColor", e.target.value)
                          }
                          placeholder="#2563eb"
                          className="input-base w-40 font-mono"
                        />
                        <div
                          className="px-4 py-2 rounded-lg text-white font-medium"
                          style={{ backgroundColor: form.landingPageSettings.themeColor }}
                        >
                          Preview
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Welcome Message
                      </label>
                      <input
                        value={form.landingPageSettings.welcomeMessage}
                        onChange={(e) =>
                          updateLandingSettings("welcomeMessage", e.target.value)
                        }
                        placeholder="Welcome to our clinic..."
                        className="input-base"
                      />
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        This message will be displayed on your landing page.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticky Action Bar */}
          <motion.div
            className="sticky bottom-0 mt-8 py-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950 -mx-6 px-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4" hover={false}>
              <div className="flex items-center gap-3">
                {uploading && (
                  <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading images...
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {previewUrl && (
                  <motion.a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Live Preview
                  </motion.a>
                )}
                <motion.button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        </form>
      </div>
    </MainLayout>
  );
};