// hospitalStaff.model.js
const bcrypt = require("bcrypt");
const db = require("../db");
const { promisify } = require("util");
const dbQuery = promisify(db.query.bind(db));
//
//
//
//
// Hospital Staff Model
const HospitalStaff = function (hospitalStaff) {
  this.hospitalId = hospitalStaff.hospitalId;
  this.hospitalStaffName = hospitalStaff.hospitalStaffName;
  this.hospitalStaffProfileImage = hospitalStaff.hospitalStaffProfileImage;
  this.hospitalStaffIdProofImage = hospitalStaff.hospitalStaffIdProofImage;
  this.hospitalStaffMobile = hospitalStaff.hospitalStaffMobile;
  this.hospitalStaffEmail = hospitalStaff.hospitalStaffEmail;
  this.hospitalStaffAddress = hospitalStaff.hospitalStaffAddress;
  this.hospitalStaffAadhar = hospitalStaff.hospitalStaffAadhar;
  this.hospitalStaffPassword = hospitalStaff.hospitalStaffPassword;
  this.addedDate = hospitalStaff.addedDate;
  this.updatedDate = hospitalStaff.updatedDate;
  this.deleteStatus = hospitalStaff.deleteStatus;
  this.isSuspended = hospitalStaff.isSuspended;
  this.updateStatus = hospitalStaff.updateStatus;
  this.passwordUpdateStatus = hospitalStaff.passwordUpdateStatus;
};
//
//
//
//
// Patient Model
const Patient = function (patient) {
  this.patientId = patient.patientId;
  this.hospitalStaffId = patient.hospitalStaffId;
  this.hospitalId = patient.hospitalId;
  this.patientName = patient.patientName;
  this.patientEmail = patient.patientEmail;
  this.patientAadhar = patient.patientAadhar;
  this.patientMobile = patient.patientMobile;
  this.patientProfileImage = patient.patientProfileImage;
  this.patientIdProofImage = patient.patientIdProofImage;
  this.patientAddress = patient.patientAddress;
  this.patientGender = patient.patientGender;
  this.patientAge = patient.patientAge;
  this.patientPassword = patient.patientPassword;
  this.patientRegisteredDate = patient.patientRegisteredDate;
  this.updatedDate = patient.updatedDate;
  this.patientDischargedDate = patient.patientDischargedDate;
  this.passwordUpdateStatus = patient.passwordUpdateStatus;
  this.dischargeStatus = patient.dischargeStatus;
  this.updateStatus = patient.updateStatus;
};
//
//
//
//
// Hospital staff Login
HospitalStaff.login = async (email, password) => {
  const query = `
        SELECT HS.*, H.isActive AS hospitalIsActive, H.deleteStatus AS hospitalDeleteStatus
        FROM Hospital_Staffs HS
        JOIN Hospitals H ON HS.hospitalId = H.hospitalId
        WHERE HS.hospitalStaffEmail = ? AND HS.deleteStatus = 0 AND HS.isSuspended = 0 AND H.deleteStatus = 0
    `;
  try {
    const result = await dbQuery(query, [email]);

    if (result.length === 0) {
      throw new Error("Hospital staff not found");
    }

    const hospitalStaff = result[0];

    if (!hospitalStaff.hospitalIsActive) {
      throw new Error("The associated hospital is not active");
    }

    if (hospitalStaff.hospitalDeleteStatus !== 0) {
      throw new Error("The associated hospital is deleted");
    }

    const isMatch = await promisify(bcrypt.compare)(
      password,
      hospitalStaff.hospitalStaffPassword
    );

    if (!isMatch) {
      throw new Error("Invalid password");
    }

    return hospitalStaff;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// HospitalStaff Change Password
HospitalStaff.changePassword = async (hospitalStaffId,oldPassword,newPassword) => {
  const checkStaffQuery = `
        SELECT HS.*, H.isActive AS hospitalIsActive, H.deleteStatus AS hospitalDeleteStatus
        FROM Hospital_Staffs HS
        JOIN Hospitals H ON HS.hospitalId = H.hospitalId
        WHERE HS.hospitalStaffId = ? AND HS.deleteStatus = 0 AND HS.isSuspended = 0 AND H.deleteStatus = 0
    `;

  try {
    const selectRes = await dbQuery(checkStaffQuery, [hospitalStaffId]);

    if (selectRes.length === 0) {
      throw new Error("Staff not found");
    }

    const hospitalStaff = selectRes[0];

    if (!hospitalStaff.hospitalIsActive) {
      throw new Error("The associated hospital is not active");
    }

    if (hospitalStaff.hospitalDeleteStatus !== 0) {
      throw new Error("The associated hospital is deleted");
    }

    const isMatch = await promisify(bcrypt.compare)(
      oldPassword,
      hospitalStaff.hospitalStaffPassword
    );

    if (!isMatch) {
      throw new Error("Invalid old password");
    }

    const hashedNewPassword = await promisify(bcrypt.hash)(newPassword, 10);

    const updatePasswordQuery = `
            UPDATE Hospital_Staffs
            SET
                updateStatus = 1,
                updatedDate = CURRENT_DATE(),
                deleteStatus = 0,
                isSuspended = 0,
                hospitalStaffPassword = ?,
                passwordUpdateStatus = 1
            WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0
        `;

    const updatePasswordValues = [hashedNewPassword, hospitalStaffId];
    const updatePasswordRes = await dbQuery(
      updatePasswordQuery,
      updatePasswordValues
    );
    console.log("Password update query result:", updatePasswordRes);
    console.log(
      "Staff password updated successfully for hospitalStaffId:",
      hospitalStaffId
    );
    return true; // Just returning true to indicate success
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// HospitalStaff Update ID Proof Image
HospitalStaff.changeIdProofImage = async (hospitalStaffId,newIdProofImageFilename) => {
  const verifyQuery = `
        SELECT hospitalStaffId
        FROM Hospital_Staffs
        WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0
    `;

  try {
    const verifyResult = await dbQuery(verifyQuery, [hospitalStaffId]);

    if (verifyResult.length === 0) {
      throw new Error("Hospital staff not found");
    }

    const updateQuery = `
            UPDATE Hospital_Staffs
            SET 
                hospitalStaffIdProofImage = ?,
                updateStatus = 1, 
                updatedDate = CURRENT_TIMESTAMP()
            WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0
        `;

    await dbQuery(updateQuery, [newIdProofImageFilename, hospitalStaffId]);

    return true;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// HospitalStaff Update Profile Image
HospitalStaff.changeProfileImage = async (hospitalStaffId,newProfileImageFilename) => {
  const query = `
        UPDATE Hospital_Staffs
        SET
            hospitalStaffProfileImage = ?,
            updateStatus = 1,
            updatedDate = CURRENT_TIMESTAMP()
        WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0
    `;

  try {
    const result = await dbQuery(query, [
      newProfileImageFilename,
      hospitalStaffId,
    ]);
    if (result.affectedRows === 0) {
      throw new Error("Failed to update profile image or staff not found.");
    }
    console.log(
      `Profile image updated successfully for hospitalStaffId: ${hospitalStaffId}`
    );
    return true; // Indicates success
  } catch (error) {
    console.error("Error updating profile image:", error);
    throw error;
  }
};
//
//
//
//
// Hospitalstaff update Profile
HospitalStaff.viewProfile = async (hospitalStaffId) => {
  const query =
    "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended= 0";
  try {
    const result = await dbQuery(query, [hospitalStaffId]);

    if (result.length === 0) {
      throw new Error("Hospital staff not found");
    }

    return result[0];
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// Hospitalstaff update Profile
HospitalStaff.updateProfile = async (updatedHospitalStaff) => {
  const checkHospitalStaffQuery =
    "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0";

  try {
    const selectRes = await dbQuery(checkHospitalStaffQuery, [
      updatedHospitalStaff.hospitalStaffId,
    ]);

    if (selectRes.length === 0) {
      throw new Error("Hospital Staff not found");
    }

    // Check if hospitalStaffAadhar already exists for another staff member
    const checkAadharQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar = ? AND hospitalStaffId != ? AND deleteStatus = 0 AND isSuspended = 0";
    const aadharRes = await dbQuery(checkAadharQuery, [
      updatedHospitalStaff.hospitalStaffAadhar,
      updatedHospitalStaff.hospitalStaffId,
    ]);

    if (aadharRes.length > 0) {
      throw new Error("Aadhar Number Already Exists.");
    }

    const updateQuery = `
            UPDATE Hospital_Staffs
            SET
                updateStatus = 1,
                updatedDate = CURRENT_DATE(),
                hospitalStaffName = ?,
                hospitalStaffMobile = ?,
                hospitalStaffAddress = ?,
                hospitalStaffAadhar = ?
            WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0
        `;

    const updateValues = [
      updatedHospitalStaff.hospitalStaffName,
      updatedHospitalStaff.hospitalStaffMobile,
      updatedHospitalStaff.hospitalStaffAddress,
      updatedHospitalStaff.hospitalStaffAadhar,
      updatedHospitalStaff.hospitalStaffId,
    ];

    await dbQuery(updateQuery, updateValues);

    console.log("Updated hospital staff details:", {
      id: updatedHospitalStaff.hospitalStaffId,
      ...updatedHospitalStaff,
    });
    return updatedHospitalStaff; // Returning the updated data without additional status and message
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// Hospital staff Register new patient
HospitalStaff.registerPatient = async (newPatient) => {
  try {
    const checkHospitalStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND deleteStatus=0 AND isSuspended=0";
    const checkAadharQuery =
      "SELECT * FROM Patients WHERE patientAadhar=? AND dischargeStatus = 0";
    const checkEmailQuery =
      "SELECT * FROM Patients WHERE patientEmail=? AND dischargeStatus = 0";

    const errors = {};

    const hospitalStaffResult = await dbQuery(checkHospitalStaffQuery, [
      newPatient.hospitalStaffId,
    ]);

    if (hospitalStaffResult.length === 0) {
      errors["hospitalStaffId"] = "Hospital staff does not exist";
    }

    const aadharRes = await dbQuery(checkAadharQuery, [
      newPatient.patientAadhar,
    ]);
    if (aadharRes.length > 0) {
      errors["patientAadhar"] = "Aadhar number already exists";
    }

    const emailRes = await dbQuery(checkEmailQuery, [newPatient.patientEmail]);
    if (emailRes.length > 0) {
      errors["patientEmail"] = "Email already exists";
    }

    if (Object.keys(errors).length > 0) {
      throw { name: "ValidationError", errors: errors };
    }

    const hospitalId = hospitalStaffResult[0].hospitalId;

    newPatient.hospitalId = hospitalId;

    const hashedPassword = await promisify(bcrypt.hash)(
      newPatient.patientPassword,
      10
    );
    newPatient.patientPassword = hashedPassword;

    const insertQuery = "INSERT INTO Patients SET ?";
    const insertRes = await dbQuery(insertQuery, newPatient);

    return { patientId: insertRes.insertId, ...newPatient };
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// Hospital staff View One patient
HospitalStaff.viewOnePatient = async (hospitalStaffId, patientId) => {
  try {
    const viewOnePatientQuery = `
            SELECT P.*, HS.isSuspended AS staffIsSuspended, H.isActive AS hospitalIsActive, H.deleteStatus AS hospitalDeleteStatus
            FROM Patients P
            JOIN Hospitals H ON P.hospitalId = H.hospitalId
            JOIN Hospital_Staffs HS ON P.hospitalStaffId = HS.hospitalStaffId
            WHERE P.hospitalId = (SELECT hospitalId FROM Hospital_Staffs WHERE hospitalStaffId = ?) 
            AND P.patientId = ? AND P.dischargeStatus = 0
        `;
    const patient = await dbQuery(viewOnePatientQuery, [
      hospitalStaffId,
      patientId,
    ]);

    if (patient.length === 0) {
      throw new Error("Patient not found");
    }

    const patientData = patient[0];

    if (patientData.staffIsSuspended) {
      throw new Error("The associated hospital staff is suspended");
    }

    if (!patientData.hospitalIsActive) {
      throw new Error("The associated hospital is not active");
    }

    if (patientData.hospitalDeleteStatus !== 0) {
      throw new Error("The associated hospital is deleted");
    }

    return patientData;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// Hospital staff View All patients
HospitalStaff.viewAllPatients = async (hospitalStaffId) => {
  try {
    const viewAllPatientsQuery = `
            SELECT P.*, HS.isSuspended AS staffIsSuspended, H.isActive AS hospitalIsActive, H.deleteStatus AS hospitalDeleteStatus
            FROM Patients P
            JOIN Hospitals H ON P.hospitalId = H.hospitalId
            JOIN Hospital_Staffs HS ON P.hospitalStaffId = HS.hospitalStaffId
            WHERE P.hospitalId = (SELECT hospitalId FROM Hospital_Staffs WHERE hospitalStaffId = ?) AND P.dischargeStatus = 0
        `;
    const allPatients = await dbQuery(viewAllPatientsQuery, [hospitalStaffId]);

    allPatients.forEach((patient) => {
      if (patient.staffIsSuspended) {
        throw new Error("The associated hospital staff is suspended");
      }

      if (!patient.hospitalIsActive) {
        throw new Error("The associated hospital is not active");
      }

      if (patient.hospitalDeleteStatus !== 0) {
        throw new Error("The associated hospital is deleted");
      }
    });

    return allPatients;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// Hospital staff Search Patients
HospitalStaff.searchPatients = async (hospitalStaffId, searchQuery) => {
  const hospitalStatusQuery = `
        SELECT H.isActive, H.deleteStatus
        FROM Hospitals H
        JOIN Hospital_Staffs HS ON H.hospitalId = HS.hospitalId
        WHERE HS.hospitalStaffId = ? AND HS.deleteStatus = 0 AND HS.isSuspended = 0`;

  try {
    const hospitalStatusResult = await dbQuery(hospitalStatusQuery, [
      hospitalStaffId,
    ]);

    // Check if no hospital is associated with the given hospitalStaffId
    if (hospitalStatusResult.length === 0) {
      throw new Error("Associated hospital not found");
    }

    // Check if the associated hospital is not active
    if (hospitalStatusResult[0].isActive === 0) {
      throw new Error("Associated hospital is not active");
    }

    // Check if the associated hospital is marked as deleted
    if (hospitalStatusResult[0].deleteStatus === 1) {
      throw new Error("Associated hospital is marked as deleted");
    }

    // Proceed with patient search
    const query = `
            SELECT * 
            FROM Patients
            WHERE hospitalId = (
                SELECT hospitalId 
                FROM Hospital_Staffs 
                WHERE hospitalStaffId = ?
            )
            AND dischargeStatus = 0
            AND (
                patientId LIKE ? OR
                patientName LIKE ? OR
                patientMobile LIKE ? OR
                patientEmail LIKE ? OR
                patientGender LIKE ? OR
                patientAge LIKE ? OR
                patientAddress LIKE ? OR
                patientAadhar LIKE ? OR
                patientRegisteredDate LIKE ?
            )
        `;

    const result = await dbQuery(query, [
      hospitalStaffId,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
    ]);

    if (result.length === 0) {
      throw new Error("No patients found");
    }

    return result;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
module.exports = { HospitalStaff, Patient };
