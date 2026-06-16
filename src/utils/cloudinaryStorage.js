const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_PDF_TYPES = new Set(["application/pdf"]);

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024;

export const validateImageFile = (file) => {
  if (!file) {
    throw new Error("File is required for upload");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image size must be 5MB or less");
  }
};

export const validateFileByType = (file, fileType) => {
  if (!file) {
    throw new Error("File is required for upload");
  }

  switch (fileType) {
    case "image":
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        throw new Error("Only JPG, PNG, and WEBP images are allowed");
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error("Image size must be 5MB or less");
      }
      break;

    case "pdf":
      if (!ALLOWED_PDF_TYPES.has(file.type)) {
        throw new Error("Only PDF files are allowed");
      }
      if (file.size > MAX_PDF_SIZE_BYTES) {
        throw new Error("PDF size must be 20MB or less");
      }
      break;

    case "audio":
      if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
        throw new Error("Only MP3, WAV, OGG, and M4A audio files are allowed");
      }
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        throw new Error("Audio file size must be 50MB or less");
      }
      break;

    default:
      if (file.size > MAX_PDF_SIZE_BYTES) {
        throw new Error("File size must be 20MB or less");
      }
  }
};

export const uploadImageToCloudinary = async (file) => {
  validateImageFile(file);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Failed to upload image");
  }

  return data.secure_url;
};

export const uploadFileToCloudinary = async (file, fileType = "other") => {
  validateFileByType(file, fileType);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  // Use the raw endpoint for non-image files
  const resourceType = ["image"].includes(fileType) ? "image" : "raw";

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Failed to upload file");
  }

  return data.secure_url;
};
