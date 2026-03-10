import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import doctorService from "../services/doctorService";
import { debugLog, debugError } from "../utils/debug";

/**
 * DoctorAbout Page
 * Public page to display a doctor's profile information
 * Route: /doctor/:doctorId/about
 * Accessible to all users (no authentication required)
 */
export const DoctorAbout = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        debugLog("DoctorAbout", "Fetching doctor profile", { doctorId });

        if (!doctorId) {
          setError("Doctor ID is missing");
          setLoading(false);
          return;
        }

        const response = await doctorService.getPublicProfile(doctorId);

        if (response.data?.success) {
          setDoctor(response.data.data);
          debugLog("DoctorAbout", "Profile loaded successfully");
        } else {
          setError("Failed to load doctor profile");
        }
      } catch (err) {
        debugError("DoctorAbout", "Error fetching profile", err);
        setError("Doctor profile not found or is unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [doctorId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading doctor profile...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !doctor) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {error || "Doctor profile not found"}
          </p>
          <p className="text-sm text-gray-500">
            The doctor profile you are looking for is not available.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          About Dr. {doctor.name}
        </h1>

        <div className="card mb-8">
          {/* Doctor Header - Image + Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b">
            {/* Profile Image */}
            <div className="md:col-span-1 flex flex-col items-center">
              {doctor.profileImage ? (
                <img
                  src={doctor.profileImage}
                  alt={doctor.name}
                  className="w-48 h-48 rounded-lg object-cover shadow-md mb-4"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-gray-200 flex items-center justify-center shadow-md mb-4">
                  <span className="text-gray-500 text-lg">No Image</span>
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {doctor.name}
              </h2>
              {doctor.specialization && (
                <p className="text-blue-600 font-medium mt-2">
                  {doctor.specialization}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              {doctor.bio ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    About
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {doctor.bio}
                  </p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <span>No bio information available.</span>
                </div>
              )}
            </div>
          </div>

          {/* Certificates Section */}
          {doctor.certificates && doctor.certificates.length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Certificates & Qualifications
              </h3>
              <div className="space-y-3">
                {doctor.certificates.map((cert, index) => (
                  <div
                    key={index}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <p className="font-medium text-gray-900">{cert.title}</p>
                    {cert.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {cert.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Section */}
          {doctor.publicContactInfo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctor.publicContactInfo.phone && (
                  <div className="flex items-start">
                    <span className="text-blue-600 font-medium w-24">
                      Phone:
                    </span>
                    <a
                      href={`tel:${doctor.publicContactInfo.phone}`}
                      className="text-gray-700 hover:text-blue-600"
                    >
                      {doctor.publicContactInfo.phone}
                    </a>
                  </div>
                )}

                {doctor.publicContactInfo.whatsApp && (
                  <div className="flex items-start">
                    <span className="text-blue-600 font-medium w-24">
                      WhatsApp:
                    </span>
                    <a
                      href={`https://wa.me/${doctor.publicContactInfo.whatsApp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-blue-600"
                    >
                      {doctor.publicContactInfo.whatsApp}
                    </a>
                  </div>
                )}

                {doctor.publicContactInfo.email && (
                  <div className="flex items-start">
                    <span className="text-blue-600 font-medium w-24">
                      Email:
                    </span>
                    <a
                      href={`mailto:${doctor.publicContactInfo.email}`}
                      className="text-gray-700 hover:text-blue-600"
                    >
                      {doctor.publicContactInfo.email}
                    </a>
                  </div>
                )}

                {doctor.publicContactInfo.address && (
                  <div className="flex items-start">
                    <span className="text-blue-600 font-medium w-24">
                      Address:
                    </span>
                    <span className="text-gray-700">
                      {doctor.publicContactInfo.address}
                    </span>
                  </div>
                )}

                {doctor.publicContactInfo.website && (
                  <div className="flex items-start">
                    <span className="text-blue-600 font-medium w-24">
                      Website:
                    </span>
                    <a
                      href={doctor.publicContactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-blue-600"
                    >
                      {doctor.publicContactInfo.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(doctor.publicContactInfo.facebook ||
                doctor.publicContactInfo.instagram ||
                doctor.publicContactInfo.twitter) && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-3">
                    Follow on Social Media
                  </p>
                  <div className="flex gap-4">
                    {doctor.publicContactInfo.facebook && (
                      <a
                        href={doctor.publicContactInfo.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Facebook
                      </a>
                    )}
                    {doctor.publicContactInfo.instagram && (
                      <a
                        href={doctor.publicContactInfo.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-800"
                      >
                        Instagram
                      </a>
                    )}
                    {doctor.publicContactInfo.twitter && (
                      <a
                        href={doctor.publicContactInfo.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-600"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
