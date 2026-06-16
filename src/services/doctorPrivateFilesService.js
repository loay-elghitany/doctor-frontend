import api from "./api";

// Get all private files for a patient
export const getPrivateFiles = async (patientId) => {
  try {
    const response = await api.get(
      `/doctors/patients/${patientId}/private-files`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new private file
export const createPrivateFile = async (patientId, fileData) => {
  try {
    const response = await api.post(
      `/doctors/patients/${patientId}/private-files`,
      fileData,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a private file
export const deletePrivateFile = async (fileId, patientId) => {
  try {
    const response = await api.delete(`/doctors/private-files/${fileId}`, {
      data: { patientId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
