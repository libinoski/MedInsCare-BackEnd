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
  this.registeredDate = patient.registeredDate;
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
  this.registeredDate = record.registeredDate;
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
  const query =
    "SELECT * FROM Hospital_Staffs WHERE hospitalStaffEmail = ? AND isActive = 1 AND deleteStatus = 0 AND IsSuspended = 0";

  try {
    const result = await dbQuery(query, [email]);

    if (result.length === 0) {
      throw new Error("Hospital staff not found");
    }

    const hospitalStaff = result[0];

    const isMatch = await promisify(bcrypt.compare)(
      password,
      hospitalStaff.hospitalStaffPassword
    );

    if (!isMatch) {
      throw new Error("Wrong password");
    }

    return hospitalStaff;
  } catch (error) {
    console.error("Error during hospital login:", error);
    throw error;
  }
};


//
//
//
//
// HOSPITAL STAFF CHANGE PASSWORD
HospitalStaff.changePassword = async (hospitalStaffId, oldPassword, newPassword) => {
  const checkHospitalStaffQuery =
    "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isActive = 1 AND isSuspended = 0";

  try {
    const selectRes = await dbQuery(checkHospitalStaffQuery, [hospitalStaffId]);
    if (selectRes.length === 0) {
      throw new Error("Hospital staff not found");
    }

    const hospitalStaff = selectRes[0];
    const isMatch = await promisify(bcrypt.compare)(
      oldPassword,
      hospitalStaff.hospitalStaffPassword
    );

    if (!isMatch) {
      throw new Error("Incorrect old password");
    }

    const hashedNewPassword = await promisify(bcrypt.hash)(newPassword, 10);
    const updatePasswordQuery = `
            UPDATE Hospital_Staffs
            SET
                updateStatus = 1,
                updatedDate = CURRENT_DATE(),
                deleteStatus = 0,
                isActive = 1,
                hospitalStaffPassword = ?,
                passwordUpdateStatus = 1
            WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isActive = 1
        `;

    const updatePasswordValues = [hashedNewPassword, hospitalStaffId];

    await dbQuery(updatePasswordQuery, updatePasswordValues);

    console.log(
      "Hospital staff password updated successfully for hospitalStaffId:",
      hospitalId
    );
    return { message: "Password updated successfully" };
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// HOSPITAL STAFF CHANGE ID PROOF IMAGE
HospitalStaff.changeIdProofImage = async (hospitalStaffId, newIdProofImageFilename) => {
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
HospitalStaff.changeProfileImage = async (hospitalStaffId, newProfileImageFilename) => {
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
      WHERE hospitalStaffId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 0
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
//
//
// HOSPITAL STAFF VIEW ALL NOTIFICATIONS FROM HOSPITAL
HospitalStaff.viewAllNotifications = async (hospitalStaffId) => {
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

    // Fetch all notifications for the hospital staff with hospitalImage and hospitalName
    const viewAllNotificationsQuery = `
    SELECT n.*, h.hospitalImage, h.hospitalName
    FROM Notification_To_Hospital_Staffs n
    JOIN Hospitals h ON n.hospitalId = h.hospitalId
    WHERE n.hospitalId = ? AND n.hospitalStaffId = ?
    ORDER BY n.sendDate DESC

    `;
    const allNotifications = await dbQuery(viewAllNotificationsQuery, [hospitalId, hospitalStaffId]);

    // Check if there are no notifications found
    if (allNotifications.length === 0) {
      throw new Error("No notifications found for this hospital staff");
    }

    return allNotifications; // Return notifications including hospitalImage and hospitalName
  } catch (error) {
    console.error("Error viewing all notifications for hospital staff:", error);
    throw error;
  }
};
//
//
//
//
//
//HOSPITAL STAFF VIEW ONE NOTIFICATION FROM HOSPITAL
HospitalStaff.viewOneNotification = async (notificationId, hospitalStaffId) => {
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

    // Fetch the notification for the hospital staff with hospitalImage and hospitalName
    const viewOneNotificationQuery = `
      SELECT n.*, h.hospitalImage, h.hospitalName
      FROM Notification_To_Hospital_Staffs n
      JOIN Hospitals h ON n.hospitalId = h.hospitalId
      WHERE n.hospitalId = ? AND n.hospitalStaffId = ? AND n.notificationId = ?
    `;
    const notification = await dbQuery(viewOneNotificationQuery, [hospitalId, hospitalStaffId, notificationId]);

    if (notification.length === 0) {
      throw new Error("Notification not found");
    }

    return notification[0]; // Return the notification including hospitalImage and hospitalName
  } catch (error) {
    console.error("Error viewing one notification for hospital staff:", error);
    throw error;
  }
};

//
//
//
//
// HOSPITAL STAFF REGISTER PATIENT
HospitalStaff.registerPatient = async (newPatientData) => {
  try {
    const staffHospitalQuery = `
      SELECT hospitalId
      FROM Hospital_Staffs
      WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0
    `;

    const staffHospitalResult = await dbQuery(staffHospitalQuery, [newPatientData.hospitalStaffId]);

    if (staffHospitalResult.length === 0) {
      throw new Error("Hospital staff not found or is inactive/suspended");
    }

    const errors = {};

    const checkAadharQuery = "SELECT * FROM Patients WHERE patientAadhar = ? AND dischargeStatus = 0";
    const aadharRes = await dbQuery(checkAadharQuery, [newPatientData.patientAadhar]);
    if (aadharRes.length > 0) {
      errors["Aadhar"] = ["Aadhar number already exists"];
    }

    const checkEmailQuery = "SELECT * FROM Patients WHERE patientEmail = ? AND dischargeStatus = 0";
    const emailRes = await dbQuery(checkEmailQuery, [newPatientData.patientEmail]);
    if (emailRes.length > 0) {
      errors["Email"] = ["Email already exists"];
    }

    if (Object.keys(errors).length > 0) {
      throw { name: "ValidationError", errors: errors };
    }

    const hashedPassword = await promisify(bcrypt.hash)(newPatientData.patientPassword, 10);
    newPatientData.patientPassword = hashedPassword;

    // Assign hospitalId from staffHospitalResult to newPatientData
    newPatientData.hospitalId = staffHospitalResult[0].hospitalId;

    const insertQuery = "INSERT INTO Patients SET ?";
    const insertRes = await dbQuery(insertQuery, newPatientData);

    return { patientId: insertRes.insertId, hospitalId: staffHospitalResult[0].hospitalId, ...newPatientData };
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
// HOSPITAL STAFF SEND NOTIFICATION TO PATIENT
HospitalStaff.sendNotificationToPatient = async (hospitalStaffId, patientId, notificationMessage) => {
  try {
    // Check if hospital staff exists and is active
    const checkStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND isActive = 1 AND deleteStatus = 0";
    const checkStaffResult = await dbQuery(checkStaffQuery, [hospitalStaffId]);
    if (checkStaffResult.length === 0) {
      throw new Error("Hospital Staff not found or not active");
    }

    // Get the hospitalId associated with the hospital staff
    const hospitalId = checkStaffResult[0].hospitalId;

    // Check if patient exists, is active, and belongs to the same hospital as the hospital staff
    const checkPatientQuery = "SELECT * FROM Patients WHERE patientId = ? AND isActive = 1 AND deleteStatus = 0 AND hospitalId = ?";
    const checkPatientResult = await dbQuery(checkPatientQuery, [patientId, hospitalId]);
    if (checkPatientResult.length === 0) {
      throw new Error("Patient not found or not active");
    }

    // Insert the notification
    const insertNotificationQuery = "INSERT INTO Notification_To_Patients_From_Staff (hospitalStaffId, patientId, message) VALUES (?, ?, ?)";
    const result = await dbQuery(insertNotificationQuery, [hospitalStaffId, patientId, notificationMessage]);

    const notificationId = result.insertId;

    const notificationDetails = {
      notificationId: notificationId,
      hospitalStaffId: hospitalStaffId,
      patientId: patientId,
      message: notificationMessage,
    };

    return notificationDetails;
  } catch (error) {
    console.error("Error sending notification to patient:", error);
    throw error;
  }
};
//
//
//
//
//
// HOSPITAL STAFF  ADD MEDICAL RECORD
HospitalStaff.addMedicalRecord = async (hospitalStaffId, patientId, recordDetails) => {
  try {
    // Validate hospitalStaffId presence and its status
    const staffValidationQuery = `
      SELECT hospitalId, hospitalStaffName, hospitalStaffEmail
      FROM Hospital_Staffs
      WHERE hospitalStaffId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 0
    `;
    const staffResults = await dbQuery(staffValidationQuery, [hospitalStaffId]);
    if (staffResults.length === 0) {
      throw new Error("Invalid or inactive hospital staff ID provided.");
    }
    const { hospitalId, hospitalStaffName, hospitalStaffEmail } = staffResults[0];

    // Validate patientId presence and its status
    const patientValidationQuery = `
      SELECT patientName, patientEmail, registeredDate
      FROM Patients
      WHERE patientId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0
    `;
    const patientResults = await dbQuery(patientValidationQuery, [patientId, hospitalId]);
    if (patientResults.length === 0) {
      throw new Error("Invalid patient ID provided or patient does not belong to the same hospital.");
    }
    const { patientName, patientEmail, registeredDate } = patientResults[0]; // Retrieve registeredDate

    // Retrieve hospital details
    const hospitalQuery = `
      SELECT hospitalName, hospitalEmail 
      FROM Hospitals 
      WHERE hospitalId = ? 
        AND isActive = 1 
        AND deleteStatus = 0
    `;
    const hospitalResult = await dbQuery(hospitalQuery, [hospitalId]);
    if (hospitalResult.length === 0) {
      throw new Error("Hospital not found or not active.");
    }
    const { hospitalName, hospitalEmail } = hospitalResult[0];

    // Construct the record with provided details and fetched data
    const { staffReport, medicineAndLabCosts, byStanderName, byStanderMobileNumber } = recordDetails;

    // Insert new medical record without dateGenerated since it's set by the database
    const insertQuery = `
      INSERT INTO Medical_Records (
        patientId, hospitalId, hospitalStaffId, patientName, patientEmail,
        staffReport, medicineAndLabCosts, byStanderName, byStanderMobileNumber,
        hospitalName, hospitalEmail, hospitalStaffName, hospitalStaffEmail,
        registeredDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [
      patientId, hospitalId, hospitalStaffId, patientName, patientEmail,
      staffReport, medicineAndLabCosts, byStanderName, byStanderMobileNumber,
      hospitalName, hospitalEmail, hospitalStaffName, hospitalStaffEmail, registeredDate
    ];
    const insertResult = await dbQuery(insertQuery, insertValues);

    // Retrieve the inserted record from the database
    const insertedRecordQuery = `
      SELECT *
      FROM Medical_Records
      WHERE recordId = ?
    `;
    const insertedRecord = await dbQuery(insertedRecordQuery, [insertResult.insertId]);

    if (insertedRecord.length === 0) {
      throw new Error("Failed to retrieve the inserted record.");
    }

    return insertedRecord[0]; // Return the inserted record
  } catch (error) {
    console.error("Error adding medical record:", error);
    throw error;
  }
};





//
//
//
//
// HOSPITAL STAFF  REQUEST DISCHARGE OF ONE PATIENT
HospitalStaff.requestDischarge = async (hospitalStaffId, patientId, message) => {
  try {
    const checkStaffQuery = `
      SELECT hospitalId FROM Hospital_Staffs
      WHERE hospitalStaffId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 0`;
    const staffResult = await dbQuery(checkStaffQuery, [hospitalStaffId]);
    if (staffResult.length === 0) {
      throw new Error("Hospital staff not found or not active");
    }
    const hospitalId = staffResult[0].hospitalId;

    const checkPatientQuery = `
      SELECT patientId FROM Patients
      WHERE patientId = ? AND hospitalId = ? AND dischargeStatus = 0
    `;
    const patientResult = await dbQuery(checkPatientQuery, [patientId, hospitalId]);
    if (patientResult.length === 0) {
      throw new Error("Patient not found or already discharged");
    }

    const insertDischargeRequestQuery = `
      INSERT INTO Discharge_Requests (hospitalId, hospitalStaffId, patientId, message)
      VALUES (?, ?, ?, ?)
    `;
    await dbQuery(insertDischargeRequestQuery, [hospitalId, hospitalStaffId, patientId, message]);

    return true; // Indicating successful operation
  } catch (error) {
    console.error("Error requesting patient discharge:", error);
    throw error;
  }
};

//
//
//
//
// HOSPITAL STAFF VIEW ALL APPROVED DISCHARGE REQUESTS
HospitalStaff.viewAllApprovedDischargeRequests = async (hospitalStaffId) => {
  try {
    const staffHospitalQuery = `
      SELECT hospitalId
      FROM Hospital_Staffs
      WHERE hospitalStaffId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 0
    `;
    const hospitalResult = await dbQuery(staffHospitalQuery, [hospitalStaffId]);

    if (hospitalResult.length === 0) {
      throw new Error("Hospital staff not found or not active");
    }

    const hospitalId = hospitalResult[0].hospitalId;

    // Now, fetch all approved discharge requests for this hospital.
    const fetchQuery = `
      SELECT * FROM Discharge_Requests
      WHERE hospitalId = ? AND isApproved = 1 AND deleteStatus = 0
    `;
    const dischargeRequests = await dbQuery(fetchQuery, [hospitalId]);

    return dischargeRequests;
  } catch (error) {
    console.error("Error viewing approved discharge requests:", error);
    throw error;
  }
};
//
//
//
//
//






module.exports = { HospitalStaff, Patient, MedicalRecord };
