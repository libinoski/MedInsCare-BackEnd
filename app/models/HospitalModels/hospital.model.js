// hospital.model.js
const bcrypt = require("bcrypt");
const db = require("../db");
const { promisify } = require("util");
const dbQuery = promisify(db.query.bind(db));
//
//
//
//
// Hospital Model
const Hospital = function (hospital) {
  this.hospitalId = hospital.hospitalId;
  this.hospitalName = hospital.hospitalName;
  this.hospitalEmail = hospital.hospitalEmail;
  this.hospitalWebSite = hospital.hospitalWebSite;
  this.hospitalAadhar = hospital.hospitalAadhar;
  this.hospitalMobile = hospital.hospitalMobile;
  this.hospitalAddress = hospital.hospitalAddress;
  this.hospitalImage = hospital.hospitalImage;
  this.hospitalPassword = hospital.hospitalPassword;
  this.registeredDate = hospital.registeredDate;
  this.isActive = hospital.isActive;
  this.deleteStatus = hospital.deleteStatus;
  this.updateStatus = hospital.updateStatus;
  this.passwordUpdatedStatus = hospital.passwordUpdatedStatus;
  this.updatedDate = hospital.updatedDate;
};
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
  this.isActive = hospitalStaff.isActive;
  this.deleteStatus = hospitalStaff.deleteStatus;
  this.isSuspended = hospitalStaff.isSuspended;
  this.updateStatus = hospitalStaff.updateStatus;
  this.passwordUpdateStatus = hospitalStaff.passwordUpdateStatus;
};
//
//
//
//
// Hospital News Model
const HospitalNews = function (hospitalNews) {
  this.hospitalNewsId = hospitalNews.hospitalNewsId;
  this.hospitalId = hospitalNews.hospitalId;
  this.hospitalNewsTitle = hospitalNews.hospitalNewsTitle;
  this.hospitalNewsContent = hospitalNews.hospitalNewsContent;
  this.hospitalNewsImage = hospitalNews.hospitalNewsImage;
  this.addedDate = hospitalNews.addedDate;
  this.updatedDate = hospitalNews.updatedDate;
  this.updateStatus = hospitalNews.updateStatus;
  this.deleteStatus = hospitalNews.deleteStatus;
};
//
//
//
//
// Hospital Notification To Hospital Staff Model
const NotificationToHospitalStaffs = function (notification) {
  this.notificationId = notification.notificationId;
  this.hospitalId = notification.hospitalId;
  this.hospitalStaffId = notification.hospitalStaffId;
  this.message = notification.message;
  this.sendDate = notification.sendDate;
  this.isSuccess = notification.isSuccess;
};
//
//
//
//
// DASHBOARD 
Hospital.getDashboardCounts = async (hospitalId) => {
  try {
    // Count of Hospital Staffs
    const staffCountQuery = "SELECT COUNT(*) AS staffCount FROM Hospital_Staffs WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";
    const staffCountResult = await dbQuery(staffCountQuery, [hospitalId]);

    // Count of Patients
    const patientCountQuery = "SELECT COUNT(*) AS patientCount FROM Patients WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";
    const patientCountResult = await dbQuery(patientCountQuery, [hospitalId]);

    // Count of Insurance Providers
    const insuranceProviderCountQuery = "SELECT COUNT(*) AS insuranceProviderCount FROM Insurance_Providers WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";
    const insuranceProviderCountResult = await dbQuery(insuranceProviderCountQuery, [hospitalId]);

    // Count of Medical Records
    const medicalRecordCountQuery = "SELECT COUNT(*) AS medicalRecordCount FROM Medical_Records WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";
    const medicalRecordCountResult = await dbQuery(medicalRecordCountQuery, [hospitalId]);

    // Count of Reviews
    const reviewCountQuery = "SELECT COUNT(*) AS reviewCount FROM Reviews WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";
    const reviewCountResult = await dbQuery(reviewCountQuery, [hospitalId]);

    // Count of Pending Discharge Requests
    const pendingDischargeRequestCountQuery = "SELECT COUNT(*) AS pendingDischargeRequestCount FROM Discharge_Requests WHERE hospitalId = ? AND isApproved = 0 AND deleteStatus = 0";
    const pendingDischargeRequestCountResult = await dbQuery(pendingDischargeRequestCountQuery, [hospitalId]);

    return {
      staffCount: staffCountResult[0].staffCount,
      patientCount: patientCountResult[0].patientCount,
      insuranceProviderCount: insuranceProviderCountResult[0].insuranceProviderCount,
      medicalRecordCount: medicalRecordCountResult[0].medicalRecordCount,
      reviewCount: reviewCountResult[0].reviewCount,
      pendingDischargeRequestCount: pendingDischargeRequestCountResult[0].pendingDischargeRequestCount,
    };
  } catch (error) {
    console.error("Error getting admin dashboard counts:", error);
    throw error;
  }
};
//
//
//
//
//
//
//
// HOSPITAL REGISTER
Hospital.register = async (newHospital) => {
  try {
    const checkEmailQuery =
      "SELECT * FROM Hospitals WHERE hospitalEmail = ? AND deleteStatus=0 AND isActive=1";
    const checkAadharQuery =
      "SELECT * FROM Hospitals WHERE hospitalAadhar = ? AND deleteStatus=0 AND isActive=1";

    const errors = {};

    const emailRes = await dbQuery(checkEmailQuery, [
      newHospital.hospitalEmail,
    ]);
    if (emailRes.length > 0) {
      errors["Email"] = ["Email already exists"];
    }

    const aadharRes = await dbQuery(checkAadharQuery, [
      newHospital.hospitalAadhar,
    ]);
    if (aadharRes.length > 0) {
      errors["Aadhar"] = ["Aadhar number already exists"];
    }

    if (Object.keys(errors).length > 0) {
      throw { name: "ValidationError", errors: errors };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(newHospital.hospitalPassword, 10);
    newHospital.hospitalPassword = hashedPassword;

    const insertQuery = "INSERT INTO Hospitals SET ?";
    const insertRes = await dbQuery(insertQuery, newHospital);

    return { hospitalId: insertRes.insertId, ...newHospital };
  } catch (error) {
    console.error("Error during hospital registration in model:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL LOGIN
Hospital.login = async (email, password) => {
  const query =
    "SELECT * FROM Hospitals WHERE hospitalEmail = ? AND isActive = 1 AND deleteStatus = 0";

  try {
    const result = await dbQuery(query, [email]);

    if (result.length === 0) {
      throw new Error("Hospital not found");
    }

    const hospital = result[0];

    const isMatch = await promisify(bcrypt.compare)(
      password,
      hospital.hospitalPassword
    );

    if (!isMatch) {
      throw new Error("Wrong password");
    }

    return hospital;
  } catch (error) {
    console.error("Error during hospital login:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL CHANGE PASSWORD
Hospital.changePassword = async (hospitalId, oldPassword, newPassword) => {
  const checkHospitalQuery =
    "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";

  try {
    const selectRes = await dbQuery(checkHospitalQuery, [hospitalId]);
    if (selectRes.length === 0) {
      throw new Error("Hospital not found");
    }

    const hospital = selectRes[0];
    const isMatch = await promisify(bcrypt.compare)(
      oldPassword,
      hospital.hospitalPassword
    );

    if (!isMatch) {
      throw new Error("Incorrect old password");
    }

    const hashedNewPassword = await promisify(bcrypt.hash)(newPassword, 10);
    const updatePasswordQuery = `
            UPDATE Hospitals
            SET
                updateStatus = 1,
                updatedDate = CURRENT_DATE(),
                deleteStatus = 0,
                isActive = 1,
                hospitalPassword = ?,
                passwordUpdateStatus = 1
            WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1
        `;

    const updatePasswordValues = [hashedNewPassword, hospitalId];

    await dbQuery(updatePasswordQuery, updatePasswordValues);

    console.log(
      "Hospital password updated successfully for hospitalId:",
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
// HOSPITAL UPDATE IMAGE
Hospital.updateImage = async (hospitalId, newImageFilename) => {
  const checkHospitalQuery =
    "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";

  try {
    const selectRes = await dbQuery(checkHospitalQuery, [hospitalId]);
    if (selectRes.length === 0) {
      throw new Error("Hospital not found");
    }

    const updateQuery = `
            UPDATE Hospitals
            SET hospitalImage = ?
            WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1
        `;
    await dbQuery(updateQuery, [newImageFilename, hospitalId]);
  } catch (error) {
    console.error("Error updating hospital image:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW PROFILE
Hospital.getProfile = async (hospitalId) => {
  const query =
    "SELECT hospitalId,hospitalImage, hospitalName, hospitalEmail, hospitalWebSite, hospitalAadhar, hospitalMobile, hospitalAddress, registeredDate FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";

  try {
    const result = await dbQuery(query, [hospitalId]);

    if (result.length === 0) {
      throw new Error("Hospital not found");
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
// HOSITAL UPDATE PROFILE
Hospital.updateProfile = async (updatedHospital) => {
  const checkHospitalQuery =
    "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";

  try {
    const selectRes = await dbQuery(checkHospitalQuery, [
      updatedHospital.hospitalId,
    ]);

    if (selectRes.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkAadharQuery =
      "SELECT * FROM Hospitals WHERE hospitalAadhar = ? AND hospitalId != ? AND deleteStatus = 0 AND isActive = 1";
    const aadharRes = await dbQuery(checkAadharQuery, [
      updatedHospital.hospitalAadhar,
      updatedHospital.hospitalId,
    ]);

    if (aadharRes.length > 0) {
      throw new Error("Aadhar Number Already Exists.");
    }

    const updateQuery = `
            UPDATE Hospitals
            SET
                updateStatus = 1,
                updatedDate = CURRENT_DATE(),
                deleteStatus = 0,
                isActive = 1,
                hospitalName = ?,
                hospitalWebSite = ?,
                hospitalAadhar = ?,
                hospitalMobile = ?,
                hospitalAddress = ?
            WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1
        `;

    await dbQuery(updateQuery, [
      updatedHospital.hospitalName,
      updatedHospital.hospitalWebSite,
      updatedHospital.hospitalAadhar,
      updatedHospital.hospitalMobile,
      updatedHospital.hospitalAddress,
      updatedHospital.hospitalId,
    ]);

    const updatedDetailsRes = await dbQuery(checkHospitalQuery, [
      updatedHospital.hospitalId,
    ]);

    if (updatedDetailsRes.length === 0) {
      throw new Error("Error fetching updated hospital details.");
    }

    return updatedDetailsRes[0]; // Return updated hospital details
  } catch (error) {
    console.error("Error updating hospital profile:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL REGISTER STAFF
Hospital.registerStaff = async (newHospitalStaff) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus=0 AND isActive=1";
    const checkAadharQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar=? AND deleteStatus=0 AND isSuspended = 0";
    const checkEmailQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffEmail=? AND deleteStatus=0 AND isSuspended = 0";

    // Check if hospitalId exists and is active
    const hospitalResult = await dbQuery(checkHospitalQuery, [newHospitalStaff.hospitalId]);
    if (hospitalResult.length === 0) {
      throw new Error("Hospital not found or not active");
    }

    const errors = {};

    const aadharRes = await dbQuery(checkAadharQuery, [
      newHospitalStaff.hospitalStaffAadhar,
    ]);
    if (aadharRes.length > 0) {
      errors["Aadhar"] = ["Aadhar number already exists"];
    }

    const emailRes = await dbQuery(checkEmailQuery, [
      newHospitalStaff.hospitalStaffEmail,
    ]);
    if (emailRes.length > 0) {
      errors["Email"] = ["Email already exists"];
    }

    if (Object.keys(errors).length > 0) {
      throw { name: "ValidationError", errors: errors };
    }

    const hashedPassword = await promisify(bcrypt.hash)(
      newHospitalStaff.hospitalStaffPassword,
      10
    );
    newHospitalStaff.hospitalStaffPassword = hashedPassword;
    const insertQuery = "INSERT INTO Hospital_Staffs SET ?";
    const insertRes = await dbQuery(insertQuery, newHospitalStaff);

    const insertedStaff = { hospitalStaffId: insertRes.insertId, ...newHospitalStaff };
    return insertedStaff;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// HOSPITAL DELETE STAFF
Hospital.deleteStaff = async (hospitalStaffId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0";
    const checkStaffResult = await dbQuery(checkStaffQuery, [
      hospitalStaffId,
      hospitalId,
    ]);

    if (checkStaffResult.length === 0) {
      throw new Error("Hospital Staff not found");
    }

    const deleteQuery =
      "UPDATE Hospital_Staffs SET deleteStatus = 1, isActive = 0 WHERE hospitalStaffId = ? AND hospitalId = ?";
    await dbQuery(deleteQuery, [hospitalStaffId, hospitalId]);

    return true; // Indicates successful deletion
  } catch (error) {
    console.error("Error deleting hospital staff:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL SUSPEND STAFF
Hospital.suspendStaff = async (hospitalStaffId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 0";
    const checkStaffResult = await dbQuery(checkStaffQuery, [
      hospitalStaffId,
      hospitalId,
    ]);

    if (checkStaffResult.length === 0) {
      throw new Error("Hospital Staff not found");
    }

    const suspendQuery =
      "UPDATE Hospital_Staffs SET isSuspended = 1,isActive= 0 WHERE hospitalStaffId = ? AND hospitalId = ?";
    await dbQuery(suspendQuery, [hospitalStaffId, hospitalId]);

    return true; // Indicates successful suspension
  } catch (error) {
    console.error("Error suspending hospital staff:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL UNSUSPEND STAFF
Hospital.unSuspendStaff = async (hospitalStaffId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0  AND isActive = 0 AND isSuspended = 1";
    const checkStaffResult = await dbQuery(checkStaffQuery, [
      hospitalStaffId,
      hospitalId,
    ]);

    if (checkStaffResult.length === 0) {
      throw new Error("Hospital Staff not found");
    }

    const unsuspendQuery =
      "UPDATE Hospital_Staffs SET isSuspended = 0, isActive = 1 WHERE hospitalStaffId = ? AND hospitalId = ?";
    await dbQuery(unsuspendQuery, [hospitalStaffId, hospitalId]);

    return true; // Indicates successful unsuspension
  } catch (error) {
    console.error("Error unsuspending hospital staff:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ALL SUSPENDED STAFFS
Hospital.viewAllSuspendedStaffs = async (hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewSuspendedStaffsQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalId = ? AND isSuspended = 1 AND isActive = 0 AND deleteStatus = 0";
    const suspendedStaffs = await dbQuery(viewSuspendedStaffsQuery, [hospitalId]);

    return suspendedStaffs;
  } catch (error) {
    console.error("Error viewing all suspended hospital staffs:", error);
    throw error;
  }
};
//
//
//
//
//
// HOSPITAL VIEW ONE SUSPENDED STAFF
Hospital.viewOneSuspendedStaff = async (hospitalStaffId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewOneSuspendedStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND isSuspended = 1 AND isActive = 0 AND deleteStatus = 0";
    const suspendedStaffDetails = await dbQuery(viewOneSuspendedStaffQuery, [
      hospitalStaffId,
      hospitalId,
    ]);

    if (suspendedStaffDetails.length === 0) {
      throw new Error("Suspended staff not found");
    }

    return suspendedStaffDetails[0]; // Returning the suspended staff details directly
  } catch (error) {
    console.error("Error viewing suspended staff:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL UPDATE STAFF
Hospital.updateStaff = async (updatedHospitalStaff) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const checkHospitalRes = await dbQuery(checkHospitalQuery, [
      updatedHospitalStaff.hospitalId,
    ]);

    if (checkHospitalRes.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 0";
    const checkStaffRes = await dbQuery(checkStaffQuery, [
      updatedHospitalStaff.hospitalStaffId,
      updatedHospitalStaff.hospitalId,
    ]);

    if (checkStaffRes.length === 0) {
      throw new Error("Hospital staff not found");
    }

    const checkAadharQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar = ? AND hospitalId = ? AND hospitalStaffId != ? AND isActive = 1 AND deleteStatus = 0";
    const aadharRes = await dbQuery(checkAadharQuery, [
      updatedHospitalStaff.hospitalStaffAadhar,
      updatedHospitalStaff.hospitalId,
      updatedHospitalStaff.hospitalStaffId,
    ]);

    if (aadharRes.length > 0) {
      throw new Error("Aadhar number already exists");
    }

    const updateQuery = `
            UPDATE Hospital_Staffs 
            SET 
                hospitalStaffName = ?,
                hospitalStaffMobile = ?,
                hospitalStaffAddress = ?,
                hospitalStaffAadhar = ?,
                updateStatus = 1,
                updatedDate = CURRENT_DATE(),
                deleteStatus = 0,
                isSuspended = 0
            WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0 AND isSuspended = 0
        `;

    const updateValues = [
      updatedHospitalStaff.hospitalStaffName,
      updatedHospitalStaff.hospitalStaffMobile,
      updatedHospitalStaff.hospitalStaffAddress,
      updatedHospitalStaff.hospitalStaffAadhar,
      updatedHospitalStaff.hospitalStaffId,
      updatedHospitalStaff.hospitalId,
    ];

    await dbQuery(updateQuery, updateValues);

    const fetchUpdatedDataQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ?";
    const fetchRes = await dbQuery(fetchUpdatedDataQuery, [
      updatedHospitalStaff.hospitalStaffId,
      updatedHospitalStaff.hospitalId,
    ]);

    return {
      message: "Hospital Staff updated successfully",
      updatedData: fetchRes[0],
    };
  } catch (error) {
    console.error("Error updating hospital staff:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ALL STAFFS
Hospital.viewAllStaffs = async (hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewAllStaffsQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalId = ? AND deleteStatus = 0 AND isSuspended = 0 AND isActive = 1";
    const allStaffs = await dbQuery(viewAllStaffsQuery, [hospitalId]);

    return allStaffs;
  } catch (error) {
    console.error("Error viewing all hospital staffs:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ONE STAFF
Hospital.viewOneStaff = async (hospitalStaffId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0";
    const staffDetails = await dbQuery(viewStaffQuery, [
      hospitalStaffId,
      hospitalId,
    ]);

    if (staffDetails.length === 0) {
      throw new Error("Hospital Staff not found");
    }

    return staffDetails[0];
  } catch (error) {
    console.error("Error viewing hospital staff:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL SEARCH STAFF
Hospital.searchStaff = async (hospitalId, searchQuery) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const query = `
            SELECT 
                hospitalStaffId, 
                hospitalStaffName, 
                hospitalStaffEmail, 
                hospitalStaffAadhar, 
                hospitalStaffMobile, 
                hospitalStaffAddress, 
                hospitalStaffProfileImage, 
                hospitalStaffIdProofImage, 
                addedDate, 
                updatedDate
            FROM Hospital_Staffs 
            WHERE hospitalId = ? 
                AND deleteStatus = 0 
                AND isSuspended = 0
                AND isActive = 1
                AND (
                    hospitalStaffId LIKE ? OR
                    hospitalStaffName LIKE ? OR
                    hospitalStaffAadhar LIKE ? OR
                    hospitalStaffMobile LIKE ? OR
                    hospitalStaffEmail LIKE ? OR
                    hospitalStaffAddress LIKE ? 
                )
        `;

    const searchParams = [
      hospitalId,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
    ];

    const result = await dbQuery(query, searchParams);

    if (result.length === 0) {
      throw new Error("No hospital staffs found");
    }

    return result;
  } catch (error) {
    console.error("Error searching hospital staff:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL SEND NOTIFICATION TO STAFF
Hospital.sendNotificationToStaff = async (hospitalId, hospitalStaffId, notificationMessage) => {
  try {
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);
    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const checkStaffResult = await dbQuery(checkStaffQuery, [hospitalStaffId, hospitalId]);
    if (checkStaffResult.length === 0) {
      throw new Error("Hospital Staff not found or not active");
    }

    const insertNotificationQuery = "INSERT INTO Notification_To_Hospital_Staffs (hospitalId, hospitalStaffId, message) VALUES (?, ?, ?)";
    const result = await dbQuery(insertNotificationQuery, [hospitalId, hospitalStaffId, notificationMessage]);

    const notificationId = result.insertId;

    const notificationDetails = {
      notificationId: notificationId,
      hospitalId: hospitalId,
      hospitalStaffId: hospitalStaffId,
      message: notificationMessage, // Update field name here
    };

    return notificationDetails;
  } catch (error) {
    console.error("Error sending notification to hospital staff:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL ADD NEWS
Hospital.addNews = async (hospitalId, newHospitalNews) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const checkHospitalRes = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (checkHospitalRes.length === 0) {
      throw new Error("Hospital not found");
    }

    newHospitalNews.hospitalId = hospitalId;
    const insertQuery = "INSERT INTO Hospital_News SET ?";
    const insertRes = await dbQuery(insertQuery, newHospitalNews);

    return insertRes.insertId;
  } catch (error) {
    console.error("Error adding hospital news:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL DELETE NEWS
Hospital.deleteNews = async (hospitalNewsId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkNewsQuery =
      "SELECT * FROM Hospital_News WHERE hospitalNewsId = ? AND hospitalId = ? AND deleteStatus = 0";
    const newsCheckResult = await dbQuery(checkNewsQuery, [
      hospitalNewsId,
      hospitalId,
    ]);

    if (newsCheckResult.length === 0) {
      throw new Error("Hospital news not found");
    }

    const deleteQuery =
      "UPDATE Hospital_News SET deleteStatus = 1 WHERE hospitalNewsId = ? AND hospitalId = ?";
    await dbQuery(deleteQuery, [hospitalNewsId, hospitalId]);
  } catch (error) {
    console.error("Error deleting hospital news:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL UPDATE NEWS
Hospital.updateNews = async (hospitalNewsId, hospitalId, updatedHospitalNews) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const checkHospitalRes = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (checkHospitalRes.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkNewsQuery =
      "SELECT * FROM Hospital_News WHERE hospitalNewsId = ? AND hospitalId = ? AND deleteStatus = 0";
    const checkNewsRes = await dbQuery(checkNewsQuery, [
      hospitalNewsId,
      hospitalId,
    ]);

    if (checkNewsRes.length === 0) {
      throw new Error("Hospital news not found");
    }

    const updateQuery =
      "UPDATE Hospital_News SET ? WHERE hospitalNewsId = ? AND hospitalId = ?";
    await dbQuery(updateQuery, [
      updatedHospitalNews,
      hospitalNewsId,
      hospitalId,
    ]);
  } catch (error) {
    console.error("Error updating hospital news:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ALL NEWS
Hospital.viewAllNews = async (hospitalId) => {
  try {
    const checkHospitalQuery = `
            SELECT hospitalId
            FROM Hospitals
            WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0
        `;
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewAllNewsQuery = `
            SELECT * FROM Hospital_News
            WHERE hospitalId = ? AND deleteStatus = 0
            ORDER BY addedDate DESC

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
// HOSPITAL VIEW ONE NEWS
Hospital.viewOneNews = async (hospitalNewsId, hospitalId) => {
  try {
    const verifyHospitalQuery = `
            SELECT hospitalId
            FROM Hospitals
            WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0
        `;
    const hospitalResult = await dbQuery(verifyHospitalQuery, [hospitalId]);

    if (hospitalResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const query = `
            SELECT * FROM Hospital_News
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
// HOSPITAL VIEW ALL UNAPPROVED INSURANCE PROVIDERS
Hospital.viewAllUnapprovedInsuranceProviders = async (hospitalId) => {
  try {
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewUnapprovedProvidersQuery = `
      SELECT * FROM Insurance_Providers 
      WHERE hospitalId = ? AND isApproved = 0 AND deleteStatus = 0
    `;
    const unapprovedProviders = await dbQuery(viewUnapprovedProvidersQuery, [hospitalId]);

    return unapprovedProviders;
  } catch (error) {
    console.error("Error viewing unapproved insurance providers:", error);
    throw error;
  }
};
//
//
//
//
//
//
// HOSPITAL VIEW ONE UNAPPROVED INSURANCE PROVIDER
Hospital.viewOneUnapprovedInsuranceProvider = async (hospitalId, insuranceProviderId) => {
  try {
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewUnapprovedProviderQuery = `
      SELECT * FROM Insurance_Providers 
      WHERE hospitalId = ? AND insuranceProviderId = ? AND isApproved = 0 AND deleteStatus = 0
    `;
    const unapprovedProviderResult = await dbQuery(viewUnapprovedProviderQuery, [hospitalId, insuranceProviderId]);

    if (unapprovedProviderResult.length === 0) {
      throw new Error("Unapproved insurance provider not found or already approved");
    }

    return unapprovedProviderResult[0];
  } catch (error) {
    console.error("Error viewing unapproved insurance provider:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL APPROVE ONE INSURANCE PROVIDER
Hospital.approveOneInsuranceProvider = async (hospitalId, insuranceProviderId) => {
  try {
    // Validate existence of the hospital
    const hospitalCheckQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckRes = await dbQuery(hospitalCheckQuery, [hospitalId]);
    if (hospitalCheckRes.length === 0) {
      throw new Error("Hospital not found");
    }

    // Validate existence and status of the insurance provider
    const insuranceProviderCheckQuery = "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND hospitalId = ? AND isApproved = 0 AND deleteStatus = 0";
    const insuranceProviderCheckRes = await dbQuery(insuranceProviderCheckQuery, [insuranceProviderId, hospitalId]);
    if (insuranceProviderCheckRes.length === 0) {
      throw new Error("Insurance provider not found or already approved");
    }

    // Approve the insurance provider
    const approveQuery = "UPDATE Insurance_Providers SET isApproved = 1 WHERE insuranceProviderId = ? AND hospitalId = ?";
    await dbQuery(approveQuery, [insuranceProviderId, hospitalId]);

    return insuranceProviderId; // Return the approved insuranceProviderId
  } catch (error) {
    console.error("Error in approveInsuranceProvider model:", error);
    throw error;
  }
};
//
//
//
//
//
// HOSPITAL DELETE ONE INSURANCE PROVIDER
Hospital.deleteOneInsuranceProvider = async (hospitalId, insuranceProviderId) => {
  try {
    // Validate existence of the hospital
    const hospitalCheckQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckRes = await dbQuery(hospitalCheckQuery, [hospitalId]);
    if (hospitalCheckRes.length === 0) {
      throw new Error("Hospital not found");
    }

    // Validate existence and status of the insurance provider
    const insuranceProviderCheckQuery = "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND hospitalId = ? AND deleteStatus = 0";
    const insuranceProviderCheckRes = await dbQuery(insuranceProviderCheckQuery, [insuranceProviderId, hospitalId]);
    if (insuranceProviderCheckRes.length === 0) {
      throw new Error("Insurance provider not found or already deleted");
    }

    // Mark the insurance provider as deleted
    const deleteQuery = "UPDATE Insurance_Providers SET deleteStatus = 1 WHERE insuranceProviderId = ? AND hospitalId = ?";
    await dbQuery(deleteQuery, [insuranceProviderId, hospitalId]);

    return insuranceProviderId; // Return the deleted insuranceProviderId
  } catch (error) {
    console.error("Error deleting insurance provider:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ALL INSURANCE PROVIDERS
Hospital.viewAllInsuranceProviders = async (hospitalId) => {
  try {
    // Check if the hospital exists and is active
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    // Hospital ID is valid
    const validHospitalId = hospitalCheckResult[0].hospitalId;

    // Fetch all insurance providers associated with the hospital
    const viewAllInsuranceProvidersQuery =
      "SELECT * FROM Insurance_Providers WHERE hospitalId = ? AND isActive = 1 AND isSuspended = 0 AND isApproved = 1 AND deleteStatus = 0 ";
    const allInsuranceProviders = await dbQuery(viewAllInsuranceProvidersQuery, [validHospitalId]);

    return allInsuranceProviders;
  } catch (error) {
    console.error("Error viewing all insurance providers:", error);
    throw error;
  }
};
//
//
//
//
//
// HOSPITAL VIEW ONE INSURANCE PROVIDER
Hospital.viewOneInsuranceProvider = async (hospitalId, insuranceProviderId) => {
  try {
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewInsuranceProviderQuery =
      "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND hospitalId = ? AND isActive = 1 AND isSuspended = 0 AND isApproved = 1";
    const insuranceProvider = await dbQuery(viewInsuranceProviderQuery, [insuranceProviderId, hospitalId]);

    if (insuranceProvider.length === 0) {
      throw new Error("Insurance provider not found for this hospital");
    }

    return insuranceProvider[0];
  } catch (error) {
    console.error("Error viewing insurance provider:", error);
    throw error;
  }
};
//
//
//
//
//
// HOSPITAL SEARCH INSURANCE PROVIDERS
Hospital.searchInsuranceProviders = async (hospitalId, searchQuery) => {
  try {
    // First, check if the hospital is active and not deleted
    const checkHospitalQuery = `
      SELECT * FROM Hospitals 
      WHERE hospitalId = ? 
        AND isActive = 1 
        AND deleteStatus = 0
    `;

    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found or not active");
    }

    const query = `
      SELECT 
        insuranceProviderId, 
        hospitalId,
        insuranceProviderName, 
        insuranceProviderEmail, 
        insuranceProviderAadhar, 
        insuranceProviderMobile, 
        insuranceProviderAddress, 
        insuranceProviderProfileImage, 
        insuranceProviderIdProofImage
      FROM Insurance_Providers 
      WHERE hospitalId = ? 
        AND isApproved = 1 
        AND deleteStatus = 0 
        AND isSuspended = 0 
        AND isActive = 1
        AND (
          insuranceProviderId LIKE ? OR
          insuranceProviderName LIKE ? OR
          insuranceProviderAadhar LIKE ? OR
          insuranceProviderMobile LIKE ? OR
          insuranceProviderEmail LIKE ? OR
          insuranceProviderAddress LIKE ?
        )
    `;

    const searchParams = [
      hospitalId,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`
    ];

    const result = await dbQuery(query, searchParams);

    if (result.length === 0) {
      throw new Error("No insurance providers found matching the criteria");
    }

    return result;
  } catch (error) {
    console.error("Error searching insurance providers:", error);
    throw error;
  }
};
//
//
//
//
//
//
// HOPITAL SUSPEND INSURANCE PROVIDER
Hospital.suspendOneInsuranceProvider = async (insuranceProviderId, hospitalId) => {
  try {
    // Validate existence of the hospital
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);
    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    // Validate existence and active status of the insurance provider
    const checkInsuranceProviderQuery = "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 0";
    const insuranceProviderCheckResult = await dbQuery(checkInsuranceProviderQuery, [insuranceProviderId, hospitalId]);
    if (insuranceProviderCheckResult.length === 0) {
      throw new Error("Insurance Provider not found or already suspended");
    }

    // Suspend the insurance provider
    const suspendQuery = "UPDATE Insurance_Providers SET isSuspended = 1, isActive = 0 WHERE insuranceProviderId = ? AND hospitalId = ?";
    await dbQuery(suspendQuery, [insuranceProviderId, hospitalId]);

    return true; // Indicates successful suspension
  } catch (error) {
    console.error("Error suspending insurance provider:", error);
    throw error;
  }
};
//
//
//
//
//
//
// HOPITAL UNSUSPEND INSURANCE PROVIDER
Hospital.unsuspendOneInsuranceProvider = async (insuranceProviderId, hospitalId) => {
  try {
    // Validate existence of the hospital
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);
    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    // Validate existence and suspended status of the insurance provider
    const checkInsuranceProviderQuery = "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 1";
    const insuranceProviderCheckResult = await dbQuery(checkInsuranceProviderQuery, [insuranceProviderId, hospitalId]);
    if (insuranceProviderCheckResult.length === 0) {
      throw new Error("Insurance Provider not found or not suspended");
    }

    // Unsuspend the insurance provider
    const unsuspendQuery = "UPDATE Insurance_Providers SET isSuspended = 0, isActive = 1 WHERE insuranceProviderId = ? AND hospitalId = ?";
    await dbQuery(unsuspendQuery, [insuranceProviderId, hospitalId]);

    return true; // Indicates successful unsuspension
  } catch (error) {
    console.error("Error unsuspending insurance provider:", error);
    throw error;
  }
};
//
//
//
//
//
// HOPITAL VIEW ALL SUSPENDED INSURANCE PROVIDERS
Hospital.viewAllSuspendedInsuranceProviders = async (hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewSuspendedProvidersQuery =
      "SELECT * FROM Insurance_Providers WHERE hospitalId = ? AND isSuspended = 1 AND isActive = 0 AND deleteStatus = 0";
    const suspendedProviders = await dbQuery(viewSuspendedProvidersQuery, [hospitalId]);

    return suspendedProviders;
  } catch (error) {
    console.error("Error viewing all suspended insurance providers:", error);
    throw error;
  }
};
//
//
//
//
//
// HOPITAL VIEW ONE SUSPENDED INSURANCE PROVIDER
Hospital.viewOneSuspendedInsuranceProvider = async (insuranceProviderId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewOneSuspendedProviderQuery =
      "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND hospitalId = ? AND isSuspended = 1 AND isActive = 0 AND deleteStatus = 0";
    const suspendedProviderDetails = await dbQuery(viewOneSuspendedProviderQuery, [
      insuranceProviderId,
      hospitalId,
    ]);

    if (suspendedProviderDetails.length === 0) {
      throw new Error("Suspended insurance provider not found");
    }

    return suspendedProviderDetails[0]; // Returning the suspended insurance provider details directly
  } catch (error) {
    console.error("Error viewing suspended insurance provider:", error);
    throw error;
  }
};
//
//
//
//
//
// HOSPITAL SEND NOTIFICATION TO INSURANCE PROVIDER
Hospital.sendNotificationToInsuranceProvider = async (hospitalId, insuranceProviderId, notificationMessage) => {
  try {
    // Check if the hospital exists and is active
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);
    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    // Check if the insurance provider exists and is active
    const checkInsuranceProviderQuery = "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND isActive = 1 AND deleteStatus = 0";
    const insuranceProviderCheckResult = await dbQuery(checkInsuranceProviderQuery, [insuranceProviderId]);
    if (insuranceProviderCheckResult.length === 0) {
      throw new Error("Insurance Provider not found or not active");
    }

    // Insert the notification into the database
    const insertNotificationQuery = "INSERT INTO Notification_To_Insurance_Providers (hospitalId, insuranceProviderId, message) VALUES (?, ?, ?)";
    const result = await dbQuery(insertNotificationQuery, [hospitalId, insuranceProviderId, notificationMessage]);

    // Retrieve the inserted notification ID
    const notificationId = result.insertId;

    // Construct the notification details object
    const notificationDetails = {
      notificationId: notificationId,
      hospitalId: hospitalId,
      insuranceProviderId: insuranceProviderId,
      message: notificationMessage,
    };

    return notificationDetails;
  } catch (error) {
    console.error("Error sending notification to insurance provider:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL UPDATE PATIENT
Hospital.updatePatient = async (updatedPatient) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const checkHospitalRes = await dbQuery(checkHospitalQuery, [
      updatedPatient.hospitalId,
    ]);

    if (checkHospitalRes.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkPatientQuery =
      "SELECT * FROM Patients WHERE patientId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const checkPatientRes = await dbQuery(checkPatientQuery, [
      updatedPatient.patientId,
      updatedPatient.hospitalId,
    ]);

    if (checkPatientRes.length === 0) {
      throw new Error("Patient not found");
    }

    const checkAadharQuery =
      "SELECT * FROM Patients WHERE patientAadhar = ? AND hospitalId = ? AND patientId != ? AND isActive = 1 AND deleteStatus = 0";
    const aadharRes = await dbQuery(checkAadharQuery, [
      updatedPatient.patientAadhar,
      updatedPatient.hospitalId,
      updatedPatient.patientId,
    ]);

    if (aadharRes.length > 0) {
      throw new Error("Aadhar number already exists");
    }

    const updateQuery = `
            UPDATE Patients 
            SET 
                patientName = ?,
                patientMobile = ?,
                patientAddress = ?,
                patientAadhar = ?,
                updateStatus = 1,
                updatedDate = CURRENT_DATE()
            WHERE patientId = ? AND hospitalId = ? AND deleteStatus = 0
        `;

    const updateValues = [
      updatedPatient.patientName,
      updatedPatient.patientMobile,
      updatedPatient.patientAddress,
      updatedPatient.patientAadhar,
      updatedPatient.patientId,
      updatedPatient.hospitalId,
    ];

    await dbQuery(updateQuery, updateValues);

    const fetchUpdatedDataQuery =
      "SELECT * FROM Patients WHERE patientId = ? AND hospitalId = ?";
    const fetchRes = await dbQuery(fetchUpdatedDataQuery, [
      updatedPatient.patientId,
      updatedPatient.hospitalId,
    ]);

    return {
      message: "Patient updated successfully",
      updatedData: fetchRes[0],
    };
  } catch (error) {
    console.error("Error updating patient:", error);
    throw error;
  }
};

//
//
//
//
// HOSPITAL VIEW ALL PATIENTS
Hospital.viewAllPatients = async (hospitalId) => {
  try {
    const query = `
          SELECT 
              p.patientId, 
              p.hospitalId, 
              p.hospitalStaffId, 
              p.patientName, 
              p.admittedWard,
              p.diagnosisOrDiseaseType,
              p.patientEmail, 
              p.patientAadhar, 
              p.patientMobile, 
              p.patientProfileImage, 
              p.patientIdProofImage, 
              p.patientAddress, 
              p.patientGender, 
              p.patientAge, 
              p.registeredDate,
              hs.hospitalStaffName,
              hs.hospitalStaffProfileImage
          FROM Patients p
          JOIN Hospital_Staffs hs ON p.hospitalStaffId = hs.hospitalStaffId
          WHERE p.hospitalId = ? AND p.isActive = 1
          ORDER BY p.registeredDate DESC;
      `;

    // Execute the query with the provided hospitalId
    const result = await dbQuery(query, [hospitalId]);

    // Check if any patients were found
    if (result.length === 0) {
      throw new Error("No patients found for this hospital.");
    }

    // Return the list of patients
    return result;
  } catch (error) {
    console.error("Error viewing all patients for hospital:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ONE PATIENT
Hospital.viewOnePatient = async (patientId, hospitalId) => {
  try {
    const query = `
      SELECT 
          patientId, 
          hospitalId, 
          hospitalStaffId, 
          patientName, 
          patientEmail, 
          diagnosisOrDiseaseType,
          admittedWard,
          patientAadhar, 
          patientMobile, 
          patientProfileImage, 
          patientIdProofImage, 
          patientAddress, 
          patientGender, 
          patientAge, 
          registeredDate
      FROM Patients
      WHERE patientId = ? AND hospitalId = ? AND isActive = 1;
    `;

    // Execute the query with the provided patientId and hospitalId
    const result = await dbQuery(query, [patientId, hospitalId]);

    // Check if any patient was found
    if (result.length === 0) {
      throw new Error("No patient found for this hospital.");
    }

    // Return the patient data
    return result[0]; // Assuming patientId is unique, so only one result expected
  } catch (error) {
    console.error("Error viewing patient for hospital:", error);
    throw error;
  }
};

//
//
//
//
// HOSPITAL DELETE ONE PATIENT
Hospital.deleteOnePatient = async (hospitalId, patientId) => {
  try {
    const hospitalCheckQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckRes = await dbQuery(hospitalCheckQuery, [hospitalId]);
    if (hospitalCheckRes.length === 0) {
      throw new Error("Hospital not found");
    }

    const patientCheckQuery = "SELECT * FROM Patients WHERE patientId = ? AND hospitalId = ? AND deleteStatus = 0";
    const patientCheckRes = await dbQuery(patientCheckQuery, [patientId, hospitalId]);
    if (patientCheckRes.length === 0) {
      throw new Error("Patient not found or already deleted");
    }

    const deleteQuery = "UPDATE Patients SET deleteStatus = 1 WHERE patientId = ? AND hospitalId = ?";
    await dbQuery(deleteQuery, [patientId, hospitalId]);

    return patientId;
  } catch (error) {
    console.error("Error deleting patient:", error);
    throw error;
  }
};
//
//
//
//
//
// HOSPITAL SEARCH PATIENT 
Hospital.searchPatients = async (hospitalId, searchQuery) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";

    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    // Correctly include conditions for deleteStatus, isActive, and dischargeStatus in the query
    const query = `
      SELECT 
        patientId, 
        hospitalId,
        patientName, 
        patientEmail, 
        patientAadhar, 
        patientMobile, 
        patientAddress, 
        patientProfileImage, 
        patientIdProofImage
      FROM Patients 
      WHERE hospitalId = ? 
        AND deleteStatus = 0 
        AND isActive = 1 
        AND dischargeStatus = 0
        AND (
          patientId LIKE ? OR
          patientName LIKE ? OR
          patientAadhar LIKE ? OR
          patientMobile LIKE ? OR
          patientEmail LIKE ? OR
          patientAddress LIKE ? OR
          admittedWard LIKE ? OR
          diagnosisOrDiseaseType LIKE ? 
        )
    `;

    const searchParams = [
      hospitalId,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
    ];

    const result = await dbQuery(query, searchParams);

    if (result.length === 0) {
      throw new Error("No patients found");
    }

    return result;
  } catch (error) {
    console.error("Error searching patients:", error);
    throw error;
  }
};
//
//
//
//
//
// HOSPITAL SEND NOTIFICATION TO PATIENT 
Hospital.sendNotificationToPatient = async (hospitalId, patientId, notificationMessage) => {
  try {
    // Check if the hospital exists and is active
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);
    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    // Check if the patient exists and is active
    const checkPatientQuery = "SELECT * FROM Patients WHERE patientId = ? AND isActive = 1 AND deleteStatus = 0";
    const patientCheckResult = await dbQuery(checkPatientQuery, [patientId]);
    if (patientCheckResult.length === 0) {
      throw new Error("Patient not found or not active");
    }

    // Insert the notification into the database
    const insertNotificationQuery = "INSERT INTO Notification_To_Patients (hospitalId, patientId, message) VALUES (?, ?, ?)";
    const result = await dbQuery(insertNotificationQuery, [hospitalId, patientId, notificationMessage]);

    // Retrieve the inserted notification ID
    const notificationId = result.insertId;

    // Construct the notification details object
    const notificationDetails = {
      notificationId: notificationId,
      hospitalId: hospitalId,
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
// HOSPITAL VIEW ALL DISCHARGE REQUESTS WITH ADDITIONAL DETAILS
Hospital.viewAllDischargeRequests = async (hospitalId) => {
  try {
    // Check if the hospital exists and is active
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    // Query to select all discharge requests with additional details for the specified hospital
    const viewAllDischargeRequestsQuery = `
      SELECT 
        dr.*, 
        p.patientName, 
        p.patientEmail, 
        p.patientRegisteredDate, 
        hs.hospitalStaffName, 
        hs.hospitalStaffEmail
      FROM Discharge_Requests dr
      JOIN Patients p ON dr.patientId = p.patientId AND p.dischargeStatus = 0 AND p.deleteStatus = 0 AND p.isActive = 1
      JOIN Hospital_Staffs hs ON dr.hospitalStaffId = hs.hospitalStaffId AND hs.isSuspended = 0 AND hs.isActive = 1 AND hs.deleteStatus = 0
      WHERE dr.hospitalId = ? AND dr.deleteStatus = 0
      ORDER BY dr.sendDate DESC;`;

    // Execute the query with the provided hospitalId
    const allDischargeRequests = await dbQuery(viewAllDischargeRequestsQuery, [hospitalId]);

    // Check if discharge requests were found
    if (allDischargeRequests.length === 0) {
      throw new Error("No discharge requests found for this hospital.");
    }

    // Return the list of discharge requests with the requested additional details
    return allDischargeRequests;
  } catch (error) {
    console.error("Error viewing all discharge requests with additional details:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ONE DISCHARGE REQUEST WITH ADDITIONAL DETAILS
Hospital.viewOneDischargeRequest = async (requestId, hospitalId) => {
  try {
    // Validate the hospital's existence and activity status
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found or not active.");
    }

    // Query to select one discharge request with additional details
    const viewOneDischargeRequestQuery = `
      SELECT 
        dr.*, 
        p.patientName, 
        p.patientEmail, 
        p.patientRegisteredDate, 
        hs.hospitalStaffName, 
        hs.hospitalStaffEmail
      FROM Discharge_Requests dr
      JOIN Patients p ON dr.patientId = p.patientId AND p.dischargeStatus = 0 AND p.deleteStatus = 0 AND p.isActive = 1
      JOIN Hospital_Staffs hs ON dr.hospitalStaffId = hs.hospitalStaffId AND hs.isSuspended = 0 AND hs.isActive = 1 AND hs.deleteStatus = 0
      WHERE dr.requestId = ? AND dr.hospitalId = ? AND dr.deleteStatus = 0`;

    // Execute the query with provided requestId and hospitalId
    const dischargeRequestDetails = await dbQuery(viewOneDischargeRequestQuery, [requestId, hospitalId]);

    // Check if the discharge request was found
    if (dischargeRequestDetails.length === 0) {
      throw new Error("Discharge request not found or not available.");
    }

    // Return the discharge request details
    return dischargeRequestDetails[0]; // Assuming requestId is unique, so only one result expected
  } catch (error) {
    console.error("Error viewing discharge request details:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL APPROVE ONE DISCHARGE REQUEST
Hospital.approveOneDischargeRequest = async (hospitalId, requestId) => {
  try {
    // Validate existence of the hospital
    const hospitalCheckQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckRes = await dbQuery(hospitalCheckQuery, [hospitalId]);
    if (hospitalCheckRes.length === 0) {
      throw new Error("Hospital not found");
    }

    // Validate existence and status of the discharge request
    const dischargeRequestCheckQuery = "SELECT * FROM Discharge_Requests WHERE requestId = ? AND hospitalId = ? AND isApproved = 0 AND deleteStatus = 0";
    const dischargeRequestCheckRes = await dbQuery(dischargeRequestCheckQuery, [requestId, hospitalId]);
    if (dischargeRequestCheckRes.length === 0) {
      throw new Error("Discharge request not found or already approved");
    }

    // Approve the discharge request and set the current date and time as the approved date
    const approveDischargeRequestQuery = "UPDATE Discharge_Requests SET isApproved = 1, approvedDate = CURRENT_TIMESTAMP() WHERE requestId = ? AND hospitalId = ?";
    await dbQuery(approveDischargeRequestQuery, [requestId, hospitalId]);

    return requestId; // Return the approved requestId
  } catch (error) {
    console.error("Error in approveOneDischargeRequest model:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL DELETE ONE DISCHARGE REQUEST
Hospital.deleteOneDischargeRequest = async (hospitalId, requestId) => {
  try {
    // Validate existence of the hospital
    const hospitalCheckQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckRes = await dbQuery(hospitalCheckQuery, [hospitalId]);
    if (hospitalCheckRes.length === 0) {
      throw new Error("Hospital not found");
    }

    // Validate existence of the discharge request
    const dischargeRequestCheckQuery = "SELECT * FROM Discharge_Requests WHERE requestId = ? AND hospitalId = ? AND deleteStatus = 0";
    const dischargeRequestCheckRes = await dbQuery(dischargeRequestCheckQuery, [requestId, hospitalId]);
    if (dischargeRequestCheckRes.length === 0) {
      throw new Error("Discharge request not found or already deleted");
    }

    // Mark the discharge request as deleted
    const deleteDischargeRequestQuery = "UPDATE Discharge_Requests SET deleteStatus = 1 WHERE requestId = ? AND hospitalId = ?";
    await dbQuery(deleteDischargeRequestQuery, [requestId, hospitalId]);

    // Just return the requestId
    return requestId;
  } catch (error) {
    console.error("Error in deleteOneDischargeRequest model:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ALL MEDICAL RECORDS OF ALL PATIENTS
Hospital.viewAllMedicalRecords = async (hospitalId) => {
  try {
    // Validate existence of the hospital
    const hospitalCheckQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckRes = await dbQuery(hospitalCheckQuery, [hospitalId]);
    if (hospitalCheckRes.length === 0) {
      throw new Error("Hospital not found or not active.");
    }

    // Query to select all medical records for the specified hospital
    const viewAllMedicalRecordsQuery = `
      SELECT 
        recordId, patientId, hospitalId, hospitalStaffId, patientName, patientEmail, 
        staffReport, medicineAndLabCosts, byStanderName, byStanderMobileNumber, 
        hospitalName, hospitalEmail, hospitalStaffName, hospitalStaffEmail, 
        registeredDate, dateGenerated
      FROM Medical_Records
      WHERE hospitalId = ? AND deleteStatus = 0
      ORDER BY dateGenerated DESC;`;

    // Execute the query with the provided hospitalId
    const allMedicalRecords = await dbQuery(viewAllMedicalRecordsQuery, [hospitalId]);

    // Check if medical records were found
    if (allMedicalRecords.length === 0) {
      throw new Error("No medical records found for this hospital.");
    }

    // Return the list of all medical records
    return allMedicalRecords;
  } catch (error) {
    console.error("Error viewing all medical records:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ONE MEDICAL RECORD OF ONE PATIENT
Hospital.viewOneMedicalRecord = async (hospitalId, recordId) => {
  try {
    // Validate existence of the hospital
    const hospitalCheckQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckRes = await dbQuery(hospitalCheckQuery, [hospitalId]);
    if (hospitalCheckRes.length === 0) {
      throw new Error("Hospital not found or not active.");
    }

    // Query to select one medical record for the specified hospital and recordId
    const viewOneMedicalRecordQuery = `
      SELECT 
        recordId, patientId, hospitalId, hospitalStaffId, patientName, patientEmail, 
        staffReport, medicineAndLabCosts, byStanderName, byStanderMobileNumber, 
        hospitalName, hospitalEmail, hospitalStaffName, hospitalStaffEmail, 
        registeredDate, dateGenerated
      FROM Medical_Records
      WHERE recordId = ? AND hospitalId = ? AND deleteStatus = 0;`;

    // Execute the query with the provided recordId and hospitalId
    const medicalRecord = await dbQuery(viewOneMedicalRecordQuery, [recordId, hospitalId]);

    // Check if the medical record was found
    if (medicalRecord.length === 0) {
      throw new Error("Medical record not found or does not belong to this hospital.");
    }

    // Return the medical record details
    return medicalRecord[0]; // Assuming recordId is unique, so only one result expected
  } catch (error) {
    console.error("Error viewing one medical record:", error);
    throw error;
  }
};
//
//
//
//
// HOSPITAL VIEW ALL MEDICAL RECORDS OF ONE PATIENT
Hospital.viewAllMedicalRecordsOfOnePatient = async (hospitalId, patientId) => {
  try {
    // Validate existence of the hospital
    const hospitalCheckQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckRes = await dbQuery(hospitalCheckQuery, [hospitalId]);
    if (hospitalCheckRes.length === 0) {
      throw new Error("Hospital not found or not active.");
    }

    // Validate existence of the patient
    const patientCheckQuery = "SELECT * FROM Patients WHERE patientId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const patientCheckRes = await dbQuery(patientCheckQuery, [patientId, hospitalId]);
    if (patientCheckRes.length === 0) {
      throw new Error("Patient not found or not active in this hospital.");
    }

    // Query to select all medical records for the specified patient in the hospital
    const viewAllMedicalRecordsOfOnePatientQuery = `
      SELECT 
        recordId, patientId, hospitalId, hospitalStaffId, patientName, patientEmail, 
        staffReport, medicineAndLabCosts, byStanderName, byStanderMobileNumber, 
        hospitalName, hospitalEmail, hospitalStaffName, hospitalStaffEmail, 
        registeredDate, dateGenerated
      FROM Medical_Records
      WHERE patientId = ? AND hospitalId = ? AND deleteStatus = 0
      ORDER BY dateGenerated DESC;`;

    // Execute the query with the provided patientId and hospitalId
    const medicalRecords = await dbQuery(viewAllMedicalRecordsOfOnePatientQuery, [patientId, hospitalId]);

    // Return the list of medical records for the patient
    return medicalRecords;
  } catch (error) {
    console.error("Error viewing all medical records of one patient:", error);
    throw error;
  }
};
//
//
//
//
//

Hospital.viewAllReviews = async (hospitalId) => {
  try {
    // Check if the hospital exists and is active
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    // Query to select all reviews for the specified hospital
    const viewAllReviewsQuery = `
      SELECT * FROM Reviews WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0 ORDER BY sendDate DESC`;

    // Execute the query with the provided hospitalId
    const allReviews = await dbQuery(viewAllReviewsQuery, [hospitalId]);

    // Check if reviews were found
    if (allReviews.length === 0) {
      throw new Error("No reviews found.");
    }

    // Return the list of reviews
    return allReviews;
  } catch (error) {
    console.error("Error viewing all reviews:", error);
    throw error;
  }
};





module.exports = { Hospital, HospitalStaff, HospitalNews, NotificationToHospitalStaffs };
