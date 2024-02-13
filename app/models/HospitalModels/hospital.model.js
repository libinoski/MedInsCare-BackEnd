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
// REGISTER
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
      errors["email"] = "Email already exists";
    }

    const aadharRes = await dbQuery(checkAadharQuery, [
      newHospital.hospitalAadhar,
    ]);
    if (aadharRes.length > 0) {
      errors["aadhar"] = "Aadhar number already exists";
    }

    if (Object.keys(errors).length > 0) {
      throw { name: "ValidationError", errors: errors };
    }

    const hashedPassword = await promisify(bcrypt.hash)(
      newHospital.hospitalPassword,
      10
    );
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
// LOGIN
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
// CHANGE PASSWORD
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
      throw new Error("Invalid old password");
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
                passwordUpdatedStatus = 1
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
// UPDATE IMAGE
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
// VIEW PROFILE
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
// Hospital Update Profile
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
// REGISTER STAFF
Hospital.registerStaff = async (newHospitalStaff) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus=0 AND isActive=1";
    const checkAadharQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar=? AND deleteStatus=0 AND isSuspended = 0";
    const checkEmailQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffEmail=? AND deleteStatus=0 AND isSuspended = 0";
    const hospitalResult = await dbQuery(checkHospitalQuery, [
      newHospitalStaff.hospitalId,
    ]);

    if (hospitalResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const errors = {};

    const aadharRes = await dbQuery(checkAadharQuery, [
      newHospitalStaff.hospitalStaffAadhar,
    ]);
    if (aadharRes.length > 0) {
      errors["aadhar"] = "Aadhar number already exists";
    }

    const emailRes = await dbQuery(checkEmailQuery, [
      newHospitalStaff.hospitalStaffEmail,
    ]);
    if (emailRes.length > 0) {
      errors["email"] = "Email already exists";
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

    return insertRes.insertId;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
// DELETE STAFF
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
      "UPDATE Hospital_Staffs SET deleteStatus = 1 WHERE hospitalStaffId = ? AND hospitalId = ?";
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
// SUSPEND STAFF
Hospital.suspendStaff = async (hospitalStaffId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0 AND isSuspended = 0";
    const checkStaffResult = await dbQuery(checkStaffQuery, [
      hospitalStaffId,
      hospitalId,
    ]);

    if (checkStaffResult.length === 0) {
      throw new Error("Hospital Staff not found");
    }

    const suspendQuery =
      "UPDATE Hospital_Staffs SET isSuspended = 1 WHERE hospitalStaffId = ? AND hospitalId = ?";
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
// UNSUSPEND STAFF
Hospital.unSuspendStaff = async (hospitalStaffId, hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const checkStaffQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0 AND isSuspended = 1";
    const checkStaffResult = await dbQuery(checkStaffQuery, [
      hospitalStaffId,
      hospitalId,
    ]);

    if (checkStaffResult.length === 0) {
      throw new Error("Hospital Staff not found");
    }

    const unsuspendQuery =
      "UPDATE Hospital_Staffs SET isSuspended = 0 WHERE hospitalStaffId = ? AND hospitalId = ?";
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
// UPDATE STAFF
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
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0 AND isSuspended = 0";
    const checkStaffRes = await dbQuery(checkStaffQuery, [
      updatedHospitalStaff.hospitalStaffId,
      updatedHospitalStaff.hospitalId,
    ]);

    if (checkStaffRes.length === 0) {
      throw new Error("Hospital staff not found");
    }

    const checkAadharQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar = ? AND hospitalId = ? AND hospitalStaffId != ? AND deleteStatus = 0 AND isSuspended = 0";
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
// VIEW ALL STAFFS
Hospital.viewAllStaffs = async (hospitalId) => {
  try {
    const checkHospitalQuery =
      "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    const hospitalCheckResult = await dbQuery(checkHospitalQuery, [hospitalId]);

    if (hospitalCheckResult.length === 0) {
      throw new Error("Hospital not found");
    }

    const viewAllStaffsQuery =
      "SELECT * FROM Hospital_Staffs WHERE hospitalId = ? AND deleteStatus = 0";
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
// VIEW ONE STAFF
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

    return staffDetails[0]; // Returning the staff details directly
  } catch (error) {
    console.error("Error viewing hospital staff:", error);
    throw error;
  }
};
//
//
//
//
// SEARCH STAFF
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
// ADD NEWS
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
// DELETE NEWS
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
// UPDATE NEWS
Hospital.updateNews = async (hospitalNewsId,hospitalId,updatedHospitalNews) => {
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
// VIEW ALL NEWS
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
// VIEW ONE NEWS
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
module.exports = { Hospital, HospitalStaff, HospitalNews };
