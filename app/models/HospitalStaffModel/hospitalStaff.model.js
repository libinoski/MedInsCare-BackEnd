// hospitalStaff.model.js
const bcrypt = require("bcrypt");
const db = require("../db");
const { promisify } = require("util");
const dbQuery = promisify(db.query.bind(db));
//
//
//
//
//
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
// 
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
// 
const MedicalRecord = function (record) {
  this.recordId = record.recordId;
  this.patientId = record.patientId;
  this.hospitalId = record.hospitalId;
  this.hospitalStaffId = record.hospitalStaffId;
  this.patientName = record.patientName;
  this.patientEmail = record.patientEmail;
  this.staffReport = record.staffReport;
  this.reportImage = record.reportImage;
  this.medicineAndLabCosts = record.medicineAndLabCosts;
  this.byStanderName = record.byStanderName;
  this.byStanderPhone = record.byStanderPhone;
  this.hospitalName = record.hospitalName;
  this.hospitalEmail = record.hospitalEmail;
  this.hospitalStaffName = record.hospitalStaffName;
  this.hospitalStaffEmail = record.hospitalStaffEmail;
  this.admissionDate = record.admissionDate;
  this.dateGenerated = record.dateGenerated;
  this.updateStatus = record.updateStatus;
  this.updatedDate = record.updatedDate;
  this.isActive = record.isActive;
  this.deleteStatus = record.deleteStatus;
};
//
//
//
//
//
// HOSPITAL STAFF LOGIN
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
// HOSPITAL STAFF CHANGE PASSWORD
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
// HOSPITAL STAFF CHANGE ID PROOF IMAGE
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
// HOSPITAL STAFF CHANGE PROFILE IMAGE
HospitalStaff.changeProfileImage = async (hospitalStaffId,newProfileImageFilename) => {
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
                hospitalStaffProfileImage = ?,
                updateStatus = 1, 
                updatedDate = CURRENT_TIMESTAMP()
            WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0
        `;

    await dbQuery(updateQuery, [newProfileImageFilename, hospitalStaffId]);

    return true;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// HOSPITAL STAFF VIEW PROFILE
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
// HOSPITAL STAFF UPDATE PROFILE
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
// HOSPITAL STAFF VIEW ALL NEWS
HospitalStaff.viewAllNews = async (hospitalStaffId) => {
  try {
    // Fetch hospitalId associated with the hospitalStaffId
    const hospitalIdQuery = `
      SELECT hospitalId
      FROM Hospital_Staffs
      WHERE hospitalStaffId = ? AND isActive = 1 AND deleteStatus = 0
    `;
    const hospitalIdResult = await dbQuery(hospitalIdQuery, [hospitalStaffId]);

    if (hospitalIdResult.length === 0) {
      throw new Error("Hospital staff not found");
    }

    const hospitalId = hospitalIdResult[0].hospitalId;

    // Verify hospital existence and active status
    const verifyHospitalQuery = `
      SELECT hospitalId
      FROM Hospitals
      WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0
    `;
    const hospitalResult = await dbQuery(verifyHospitalQuery, [hospitalId]);

    if (hospitalResult.length === 0) {
      throw new Error("Hospital not found or inactive");
    }

    // Fetch all hospital news based on the retrieved hospitalId
    const viewAllNewsQuery = `
      SELECT *
      FROM Hospital_News
      WHERE hospitalId = ? AND deleteStatus = 0
    `;
    const allNews = await dbQuery(viewAllNewsQuery, [hospitalId]);

    return allNews;
  } catch (error) {
    console.error("Error viewing all hospital news:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL STAFF VIEW ONE NEWS
HospitalStaff.viewOneNews = async (hospitalNewsId, hospitalStaffId) => {
  try {
    const hospitalIdQuery = "SELECT hospitalId FROM Hospital_Staffs WHERE hospitalStaffId = ? AND isActive = 1";
    const hospitalIdResult = await dbQuery(hospitalIdQuery, [hospitalStaffId]);

    if (hospitalIdResult.length === 0) {
      throw new Error("Hospital staff not found");
    }

    const hospitalId = hospitalIdResult[0].hospitalId;

    // Verify hospital existence and active status
    const verifyHospitalQuery = `
      SELECT hospitalId
      FROM Hospitals
      WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0
    `;
    const hospitalResult = await dbQuery(verifyHospitalQuery, [hospitalId]);

    if (hospitalResult.length === 0) {
      throw new Error("Hospital not found or inactive");
    }

    // Fetch the hospital news
    const query = `
      SELECT *
      FROM Hospital_News
      WHERE hospitalNewsId = ? AND hospitalId = ? AND deleteStatus = 0
    `;
    const result = await dbQuery(query, [hospitalNewsId, hospitalId]);

    if (result.length === 0) {
      throw new Error("Hospital news not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching hospital news:", error);
    throw error;
  }
};
//
//
// HOSPITAL STAFF REGISTER PATIENT
HospitalStaff.registerPatient = async (patientData) => {
  try {
    const staffHospitalQuery = `
      SELECT hs.hospitalStaffId, hs.hospitalId
      FROM Hospital_Staffs hs
      JOIN Hospitals h ON hs.hospitalId = h.hospitalId
      WHERE hs.hospitalStaffId = ? AND hs.deleteStatus = 0 AND hs.isSuspended = 0
      AND h.isActive = 1 AND h.deleteStatus = 0
    `;
    const staffHospitalResult = await dbQuery(staffHospitalQuery, [patientData.hospitalStaffId]);
    if (staffHospitalResult.length === 0) {
      const errors = { staff: "Hospital staff not found, or linked hospital is not active/not exists" };
      throw { name: "ValidationError", errors: errors };
    }

    patientData.hospitalId = staffHospitalResult[0].hospitalId;

    const errors = {};

    const checkAadharQuery = "SELECT * FROM Patients WHERE patientAadhar=? AND dischargeStatus = 0";
    const aadharRes = await dbQuery(checkAadharQuery, [patientData.patientAadhar]);
    if (aadharRes.length > 0) {
      errors["aadhar"] = "Aadhar number already exists";
    }

    const checkEmailQuery = "SELECT * FROM Patients WHERE patientEmail=? AND dischargeStatus	= 0";
    const emailRes = await dbQuery(checkEmailQuery, [patientData.patientEmail]);
    if (emailRes.length > 0) {
      errors["email"] = "Email already exists";
    }

    // If there are validation errors, throw a ValidationError
    if (Object.keys(errors).length > 0) {
      throw { name: "ValidationError", errors: errors };
    }

    // Hash the patient's password
    const hashedPassword = await promisify(bcrypt.hash)(patientData.patientPassword, 10);
    patientData.patientPassword = hashedPassword;

    // Insert patient data into the database
    const insertQuery = "INSERT INTO Patients SET ?";
    const insertRes = await dbQuery(insertQuery, patientData);

    // Return the newly registered patient data, including the generated patientId and hospitalId
    return {patientId: insertRes.insertId, hospitalId: patientData.hospitalId, ...patientData };
  } catch (error) {
    console.error("Error during patient registration in model:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL STAFF  VIEW ONE PATIENT
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
// HOSPITAL STAFF VIEW ALL PATIENTS
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
// HOSPITAL STAFF SEARCH PATIENTS
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
// HOSPITAL STAFF  ADD MEDICAL RECORD
HospitalStaff.addMedicalRecord = async (patientId, hospitalStaffId, medicalRecordData) => {
  try {
    // Fetch patient details
    const patientQuery = `
      SELECT P.hospitalId, P.patientName, P.patientEmail, P.admissionDate,
             H.hospitalName, H.hospitalEmail,
             HS.hospitalStaffName, HS.hospitalStaffEmail
      FROM Patients P
      JOIN Hospitals H ON P.hospitalId = H.hospitalId
      JOIN Hospital_Staffs HS ON P.hospitalStaffId = HS.hospitalStaffId
      WHERE P.patientId = ? AND P.dischargeStatus = 0
    `;
    const patientDetails = await dbQuery(patientQuery, [patientId]);

    if (patientDetails.length === 0) {
      throw new Error("Patient not found or not admitted");
    }

    const { hospitalId, patientName, patientEmail, admissionDate, hospitalName, hospitalEmail, hospitalStaffName, hospitalStaffEmail } = patientDetails[0];

    // Include fetched values in medicalRecordData
    const medicalRecord = {
      patientId: patientId,
      hospitalId: hospitalId,
      hospitalStaffId: hospitalStaffId,
      patientName: patientName,
      patientEmail: patientEmail,
      admissionDate: admissionDate,
      hospitalName: hospitalName,
      hospitalEmail: hospitalEmail,
      hospitalStaffName: hospitalStaffName,
      hospitalStaffEmail: hospitalStaffEmail,
      ...medicalRecordData
    };

    // Insert medical record into the database
    const insertQuery = "INSERT INTO Medical_Records SET ?";
    const insertRes = await dbQuery(insertQuery, medicalRecord);

    return { recordId: insertRes.insertId, ...medicalRecord };
  } catch (error) {
    throw error;
  }
};






module.exports = { HospitalStaff, Patient, MedicalRecord };
