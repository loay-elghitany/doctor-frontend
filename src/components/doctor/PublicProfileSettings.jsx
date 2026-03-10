import React, { useState, useEffect } from "react";
import doctorService from "../../services/doctorService";
import { debugLog, debugError } from "../../utils/debug";

/**
 * PublicProfileSettings Component
 * Allows doctor to manage their public profile visible to patients
 * Fields: bio, profileImage, specialization, certificates, contact info
 * All changes are user-specific (tenant isolation in backend)
 */
export const PublicProfileSettings = () => {
  // Form state
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertDesc, setNewCertDesc] = useState("");

  // Contact state
  const [phone, setPhone] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch current profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        debugLog("PublicProfileSettings", "Fetching current profile");

        // Get own profile (authenticated)
        const response = await doctorService.getDoctorProfile();

        if (response.data?.data?.id) {
          // Now fetch full public profile
          const profileResponse = await doctorService.getPublicProfile(
            response.data.data.id,
          );

          if (profileResponse.data?.data) {
            const data = profileResponse.data.data;

            setBio(data.bio || "");
            setProfileImage(data.profileImage || "");
            setSpecialization(data.specialization || "");
            setCertificates(data.certificates || []);

            if (data.publicContactInfo) {
              setPhone(data.publicContactInfo.phone || "");
              setWhatsApp(data.publicContactInfo.whatsApp || "");
              setEmail(data.publicContactInfo.email || "");
              setAddress(data.publicContactInfo.address || "");
              setWebsite(data.publicContactInfo.website || "");
              setFacebook(data.publicContactInfo.facebook || "");
              setInstagram(data.publicContactInfo.instagram || "");
              setTwitter(data.publicContactInfo.twitter || "");
            }
          }
        }

        setLoading(false);
      } catch (error) {
        debugError("PublicProfileSettings", "Failed to fetch profile", error);
        setErrorMessage("Failed to load profile settings");
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle adding certificate
  const handleAddCertificate = () => {
    if (newCertTitle.trim()) {
      setCertificates([
        ...certificates,
        { title: newCertTitle, description: newCertDesc || null },
      ]);
      setNewCertTitle("");
      setNewCertDesc("");
      setSuccessMessage("");
    }
  };

  // Handle removing certificate
  const handleRemoveCertificate = (index) => {
    setCertificates(certificates.filter((_, i) => i !== index));
    setSuccessMessage("");
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage("");

      // Validate lengths
      if (bio && bio.length > 1000) {
        setErrorMessage("Bio must not exceed 1000 characters");
        setSaving(false);
        return;
      }

      if (specialization && specialization.length > 500) {
        setErrorMessage("Specialization must not exceed 500 characters");
        setSaving(false);
        return;
      }

      debugLog("PublicProfileSettings", "Saving profile", {
        bioLength: bio.length,
        hasCertificates: certificates.length > 0,
      });

      const payload = {
        bio: bio || null,
        profileImage: profileImage || null,
        specialization: specialization || null,
        certificates: certificates.length > 0 ? certificates : null,
        publicContactInfo: {
          phone: phone || null,
          whatsApp: whatsApp || null,
          email: email || null,
          address: address || null,
          website: website || null,
          facebook: facebook || null,
          instagram: instagram || null,
          twitter: twitter || null,
        },
      };

      const response = await doctorService.updateProfileSettings(payload);

      if (response.data?.success) {
        setSuccessMessage("Profile updated successfully!");
        debugLog("PublicProfileSettings", "Profile saved");

        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(response.data?.message || "Failed to update profile");
      }
    } catch (error) {
      debugError("PublicProfileSettings", "Failed to save profile", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while saving";
      setErrorMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Public Profile</h2>
        <p className="text-gray-500">Loading profile settings...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Public Profile</h2>
      <p className="text-sm text-gray-600 mb-6">
        Manage the profile information that patients see about you.
      </p>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ✓ {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          ✗ {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio / About You
          </label>
          <textarea
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              setSuccessMessage("");
            }}
            placeholder="Write a brief bio about yourself..."
            maxLength={1000}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {bio.length}/1000 characters
          </p>
        </div>

        {/* Profile Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image URL
          </label>
          <input
            type="url"
            value={profileImage}
            onChange={(e) => {
              setProfileImage(e.target.value);
              setSuccessMessage("");
            }}
            placeholder="https://example.com/profile-image.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste the URL of your profile image
          </p>
        </div>

        {/* Specialization */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialization
          </label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => {
              setSpecialization(e.target.value);
              setSuccessMessage("");
            }}
            placeholder="e.g., Cardiology, Dentistry, General Practice"
            maxLength={500}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {specialization.length}/500 characters
          </p>
        </div>

        {/* Certificates */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Certificates & Qualifications
          </h3>

          {certificates.length > 0 && (
            <div className="mb-4 space-y-2">
              {certificates.map((cert, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{cert.title}</p>
                    {cert.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {cert.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveCertificate(index)}
                    className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate Title
              </label>
              <input
                type="text"
                value={newCertTitle}
                onChange={(e) => {
                  setNewCertTitle(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="e.g., MD in Internal Medicine"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={newCertDesc}
                onChange={(e) => {
                  setNewCertDesc(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="e.g., University of Medical Sciences, 2015"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleAddCertificate}
              disabled={!newCertTitle.trim()}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Add Certificate
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={whatsApp}
                onChange={(e) => {
                  setWhatsApp(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="doctor@clinic.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="123 Main St, City, State 12345"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => {
                  setWebsite(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => {
                  setFacebook(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => {
                  setInstagram(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter
              </label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => {
                  setTwitter(e.target.value);
                  setSuccessMessage("");
                }}
                placeholder="https://twitter.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t mt-6 pt-4 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
        <p className="text-xs text-gray-500 self-center">
          This information is visible to patients on your About page
        </p>
      </div>
    </div>
  );
};
