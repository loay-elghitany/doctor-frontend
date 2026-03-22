import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "../components/layout/Layout";
import doctorService from "../services/doctorService";
import { debugLog, debugError } from "../utils/debug";

/**
 * DoctorContact Page
 * Public page to display a doctor's contact information
 * Route: /doctor/:doctorId/contact
 * Accessible to all users (no authentication required)
 */
export const DoctorContact = () => {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        debugLog("DoctorContact", "Fetching doctor contact info", { doctorId });

        if (!doctorId) {
          setError("Doctor ID is missing");
          setLoading(false);
          return;
        }

        const response = await doctorService.getPublicProfile(doctorId);

        if (response.data?.success) {
          setDoctor(response.data.data);
          debugLog("DoctorContact", "Contact info loaded successfully");
        } else {
          setError("Failed to load doctor contact information");
        }
      } catch (err) {
        debugError("DoctorContact", "Error fetching contact info", err);
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
          <p className="text-gray-500">Loading contact information...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !doctor) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {error || "Contact information not found"}
          </p>
          <p className="text-sm text-gray-500">
            The doctor's contact information is not available.
          </p>
        </div>
      </MainLayout>
    );
  }

  const hasContactInfo =
    doctor.publicContactInfo &&
    (doctor.publicContactInfo.phone ||
      doctor.publicContactInfo.email ||
      doctor.publicContactInfo.whatsApp ||
      doctor.publicContactInfo.address ||
      doctor.publicContactInfo.website);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Contact Dr. {doctor.name}
        </h1>

        <div className="card">
          {!hasContactInfo ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Contact information is not yet available.
              </p>
              <p className="text-sm text-gray-500">
                Please try again later or visit our main contact page.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctor.publicContactInfo.phone && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-gray-900 mb-2">Phone</h3>
                    <a
                      href={`tel:${doctor.publicContactInfo.phone}`}
                      className="text-lg text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {doctor.publicContactInfo.phone}
                    </a>
                  </div>
                )}

                {doctor.publicContactInfo.email && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-medium text-gray-900 mb-2">Email</h3>
                    <a
                      href={`mailto:${doctor.publicContactInfo.email}`}
                      className="text-lg text-green-600 hover:text-green-800 font-semibold break-all"
                    >
                      {doctor.publicContactInfo.email}
                    </a>
                  </div>
                )}

                {doctor.publicContactInfo.whatsApp && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h3 className="font-medium text-gray-900 mb-2">WhatsApp</h3>
                    <a
                      href={`https://wa.me/${doctor.publicContactInfo.whatsApp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-emerald-600 hover:text-emerald-800 font-semibold"
                    >
                      {doctor.publicContactInfo.whatsApp}
                    </a>
                  </div>
                )}

                {doctor.publicContactInfo.address && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="font-medium text-gray-900 mb-2">Address</h3>
                    <p className="text-gray-700">
                      {doctor.publicContactInfo.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Website */}
              {doctor.publicContactInfo.website && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-gray-900 mb-2">Website</h3>
                  <a
                    href={doctor.publicContactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {doctor.publicContactInfo.website}
                  </a>
                </div>
              )}

              {/* Social Media */}
              {(doctor.publicContactInfo.facebook ||
                doctor.publicContactInfo.instagram ||
                doctor.publicContactInfo.twitter) && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Follow on Social Media
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {doctor.publicContactInfo.facebook && (
                      <a
                        href={doctor.publicContactInfo.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Facebook
                      </a>
                    )}
                    {doctor.publicContactInfo.instagram && (
                      <a
                        href={doctor.publicContactInfo.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                    {doctor.publicContactInfo.twitter && (
                      <a
                        href={doctor.publicContactInfo.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Back to About */}
              <div className="border-t pt-6">
                <a
                  href={`/doctor/${doctorId}/about`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to About
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
