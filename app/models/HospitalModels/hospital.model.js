// hospital.model.js
const bcrypt = require('bcrypt');
const db = require('../db');
const { promisify } = require('util');
const dbQuery = promisify(db.query.bind(db));

//Hospital Model 
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


//Hospital Staff Model
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
    this.updateStatus = hospitalStaff.updateStatus;
    this.passwordUpdateStatus = hospitalStaff.passwordUpdateStatus;
};

// Hospital News Model
const HospitalNews = function (hospitalNews) {
    this.hospitalNewsId = hospitalNews.hospitalNewsId;
    this.hospitalId = hospitalNews.hospitalId;
    this.hospitalNewsTitle = hospitalNews.hospitalNewsTitle;
    this.hospitalNewsContent = hospitalNews.hospitalNewsContent;
    this.hospitalNewsImage = hospitalNews.hospitalNewsImage;
    this.addedDate = hospitalNews.addedDate;
    this.updatedDate = hospitalNews.updatedDate;
    this.deleteStatus = hospitalNews.deleteStatus;
    this.isHided  = hospitalNews.isHided;   
};



// Hospital Register
Hospital.register = async (newHospital) => {
    try {
        const checkEmailQuery = "SELECT * FROM Hospitals WHERE hospitalEmail = ? AND deleteStatus=0 AND isActive=1";
        const checkAadharQuery = "SELECT * FROM Hospitals WHERE hospitalAadhar = ? AND deleteStatus=0 AND isActive=1";

        const emailRes = await dbQuery(checkEmailQuery, [newHospital.hospitalEmail]);
        if (emailRes.length > 0) {
            throw new Error("Hospital email already exists");
        }

        const aadharRes = await dbQuery(checkAadharQuery, [newHospital.hospitalAadhar]);
        if (aadharRes.length > 0) {
            throw new Error("Aadhar number already exists");
        }

        const hashedPassword = await promisify(bcrypt.hash)(newHospital.hospitalPassword, 10);
        newHospital.hospitalPassword = hashedPassword;

        const insertQuery = "INSERT INTO Hospitals SET ?";
        const insertRes = await dbQuery(insertQuery, newHospital);

        return { id: insertRes.insertId, ...newHospital };
    } catch (error) {
        throw error;
    }
};


// Hospital Login
Hospital.login = async (email, password) => {
    const query = "SELECT * FROM Hospitals WHERE BINARY hospitalEmail = ?";
    try {
        const result = await dbQuery(query, [email]);

        if (result.length === 0) {
            throw new Error("Hospital not found");
        }

        const hospital = result[0];

        // Check if the hospital is active and not deleted
        if (hospital.isActive !== 1 || hospital.deleteStatus !== 0) {
            throw new Error("Hospital is not active or has been deleted");
        }

        const isMatch = await promisify(bcrypt.compare)(password, hospital.hospitalPassword);

        if (!isMatch) {
            throw new Error("Invalid password");
        }

        return hospital;
    } catch (error) {
        throw error;
    }
};


// Hospital View Profile
Hospital.getProfile = async (hospitalId) => {
    const query = "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";
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


// Hospital Update Profile
Hospital.updateProfile = async (updatedHospital) => {
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";

    try {
        const selectRes = await dbQuery(checkHospitalQuery, [updatedHospital.hospitalId]);

        if (selectRes.length === 0) {
            throw new Error("Hospital not found");
        }

        const checkAadharQuery = "SELECT * FROM Hospitals WHERE hospitalAadhar = ? AND hospitalId != ? AND deleteStatus = 0 AND isActive = 1";
        const aadharRes = await dbQuery(checkAadharQuery, [updatedHospital.hospitalAadhar, updatedHospital.hospitalId]);

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

        const updateValues = [
            updatedHospital.hospitalName,
            updatedHospital.hospitalWebSite,
            updatedHospital.hospitalAadhar,
            updatedHospital.hospitalMobile,
            updatedHospital.hospitalAddress,
            updatedHospital.hospitalId,
        ];

        const updateRes = await dbQuery(updateQuery, updateValues);

        const responseData = { ...updatedHospital };
        console.log("Updated hospital details:", { id: updatedHospital.hospitalId, ...updatedHospital });
        return responseData;
    } catch (error) {
        throw error;
    }
};


// Hospital Register New Staff
Hospital.registerStaff = async (newHospitalStaff) => {
    try {
        const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus=0 AND isActive=1";
        const checkAadharQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar=? AND deleteStatus=0 AND isActive=1";
        const checkEmailQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffEmail=? AND deleteStatus=0 AND isActive=1";

        const hospitalResult = await dbQuery(checkHospitalQuery, [newHospitalStaff.hospitalId]);

        if (hospitalResult.length === 0) {
            throw new Error("Hospital ID does not exist");
        }

        const aadharRes = await dbQuery(checkAadharQuery, [newHospitalStaff.hospitalStaffAadhar]);
        if (aadharRes.length > 0) {
            throw new Error("Aadhar number already exists");
        }

        const emailRes = await dbQuery(checkEmailQuery, [newHospitalStaff.hospitalStaffEmail]);
        if (emailRes.length > 0) {
            throw new Error("Email already exists");
        }

        const hashedPassword = await promisify(bcrypt.hash)(newHospitalStaff.hospitalStaffPassword, 10);
        newHospitalStaff.hospitalStaffPassword = hashedPassword;

        const insertQuery = "INSERT INTO Hospital_Staffs SET ?";
        const insertRes = await dbQuery(insertQuery, newHospitalStaff);

        // Directly return the data without additional wrapping
        return { status: "Success", message: 'Hospital Staff added successfully', data: { hospitalStaffId: insertRes.insertId, ...newHospitalStaff } };
    } catch (error) {
        throw error;
    }
};


// Delete Hospital Staff
Hospital.deleteStaff = async (hospitalStaffId, hospitalId) => {
    try {
        const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
        const checkHospitalRes = await dbQuery(checkHospitalQuery, [hospitalId]);

        if (checkHospitalRes.length === 0) {
            throw new Error("Hospital not found, is not active, or has been deleted");
        }

        const checkStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
        const checkStaffRes = await dbQuery(checkStaffQuery, [hospitalStaffId, hospitalId]);

        if (checkStaffRes.length === 0) {
            throw new Error("Hospital Staff not found, is not active, or has been deleted");
        }

        const deleteQuery = "UPDATE Hospital_Staffs SET deleteStatus = 1, isActive = 0 WHERE hospitalStaffId = ? AND hospitalId = ?";
        const deleteRes = await dbQuery(deleteQuery, [hospitalStaffId, hospitalId]);

        return "Hospital Staff deleted successfully";
    } catch (error) {
        throw error;
    }
};


// Update Hospital Staff
Hospital.updateStaff = async (updatedHospitalStaff) => {
    try {
        const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
        const checkHospitalRes = await dbQuery(checkHospitalQuery, [updatedHospitalStaff.hospitalId]);

        if (checkHospitalRes.length === 0) {
            throw new Error("Hospital not found, is not active, or has been deleted");
        }

        const checkStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
        const checkStaffRes = await dbQuery(checkStaffQuery, [updatedHospitalStaff.hospitalStaffId, updatedHospitalStaff.hospitalId]);

        if (checkStaffRes.length === 0) {
            throw new Error("Hospital Staff not found, is not active, or has been deleted");
        }

        const checkAadharQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar = ? AND hospitalId = ? AND hospitalStaffId != ? AND deleteStatus = 0 AND isActive = 1";
        const aadharRes = await dbQuery(checkAadharQuery, [updatedHospitalStaff.hospitalStaffAadhar, updatedHospitalStaff.hospitalId, updatedHospitalStaff.hospitalStaffId]);

        if (aadharRes.length > 0) {
            throw new Error("Aadhar Number Already Exists.");
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
                isActive = 1
            WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0 AND isActive = 1
        `;

        const updateValues = [
            updatedHospitalStaff.hospitalStaffName,
            updatedHospitalStaff.hospitalStaffMobile,
            updatedHospitalStaff.hospitalStaffAddress,
            updatedHospitalStaff.hospitalStaffAadhar,
            updatedHospitalStaff.hospitalStaffId,
            updatedHospitalStaff.hospitalId
        ];

        await dbQuery(updateQuery, updateValues);

        const fetchUpdatedDataQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ?";
        const fetchRes = await dbQuery(fetchUpdatedDataQuery, [updatedHospitalStaff.hospitalStaffId, updatedHospitalStaff.hospitalId]);

        return { message: "Hospital Staff updated successfully", updatedData: fetchRes[0] };
    } catch (error) {
        throw error;
    }
};


// Hospital View All Staffs
Hospital.getHospitalStaffs = async (hospitalId) => {
    const query = "SELECT * FROM Hospital_Staffs WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";
    try {
        const result = await dbQuery(query, [hospitalId]);

        return result;
    } catch (error) {
        throw error;
    }
};



// View One Hospital Staff by Hospital
Hospital.viewOneStaff = async (hospitalId, hospitalStaffId) => {
    try {
        const query = `
            SELECT * 
            FROM Hospital_Staffs 
            WHERE hospitalId = ? 
                AND hospitalStaffId = ? 
                AND deleteStatus = 0 
                AND isActive = 1
        `;

        const result = await dbQuery(query, [hospitalId, hospitalStaffId]);

        if (result.length === 0) {
            throw new Error("Hospital Staff not found or has been deleted");
        }

        return result[0];
    } catch (error) {
        throw error;
    }
};


// Hospital Search Staff
Hospital.searchStaff = async (hospitalId, searchQuery) => {
    const query = `
        SELECT * 
        FROM Hospital_Staffs 
        WHERE hospitalId = ? 
            AND deleteStatus = 0 
            AND isActive = 1
            AND (
                hospitalStaffId LIKE ? OR
                hospitalStaffName LIKE ? OR
                hospitalStaffAadhar LIKE ? OR
                hospitalStaffMobile LIKE ? OR
                hospitalStaffEmail LIKE ? OR
                addedDate LIKE ? OR

                hospitalStaffAddress LIKE ?
            )
    `;

    try {
        const result = await dbQuery(query, [hospitalId, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]);

        return result;
    } catch (error) {
        throw error;
    }
};


// Hospital Add News
Hospital.addNews = async (hospitalId, newHospitalNews) => {
    try {
        // Check if the hospital exists and is active
        const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
        const checkHospitalRes = await dbQuery(checkHospitalQuery, [hospitalId]);

        if (checkHospitalRes.length === 0) {
            throw new Error("Hospital not found, is not active, or has been deleted");
        }

        // Add hospitalId to the news object
        newHospitalNews.hospitalId = hospitalId;

        // Insert the news into the HospitalNews table
        const insertQuery = "INSERT INTO Hospital_News SET ?";
        const insertRes = await dbQuery(insertQuery, newHospitalNews);

        return { id: insertRes.insertId, ...newHospitalNews };
    } catch (error) {
        throw error;
    }
};



// Hospital Delete News
Hospital.deleteNews = async (hospitalNewsId, hospitalId) => {
    try {
        // Check if the hospital exists and is active
        const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isHided = 0 AND deleteStatus = 0";
        const checkHospitalRes = await dbQuery(checkHospitalQuery, [hospitalId]);

        if (checkHospitalRes.length === 0) {
            throw new Error("Hospital not found, is not active, or has been deleted");
        }

        // Check if the news exists for the specified hospital
        const checkNewsQuery = "SELECT * FROM Hospital_News WHERE hospitalNewsId = ? AND hospitalId = ? AND isHided = 0 AND deleteStatus = 0 ";
        const checkNewsRes = await dbQuery(checkNewsQuery, [hospitalNewsId, hospitalId]);

        if (checkNewsRes.length === 0) {
            throw new Error("Hospital News not found or has been deleted or currently hided");
        }

        // Delete the news and set deleteStatus to 1
        const deleteQuery = "UPDATE Hospital_News SET deleteStatus = 1, isHided = 0  WHERE hospitalNewsId = ? AND hospitalId = ?";
        const deleteRes = await dbQuery(deleteQuery, [hospitalNewsId, hospitalId]);

        return { message: "Hospital News deleted successfully" };
    } catch (error) {
        throw error; 
    }
};






module.exports = { Hospital, HospitalStaff, HospitalNews };