// hospitalStaff.model.js
const bcrypt = require('bcrypt');
const db = require('../db');
const { promisify } = require('util');
const dbQuery = promisify(db.query.bind(db));




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
    this.deleteStatus = hospitalStaff.deleteStatus;
    this.isSuspended = hospitalStaff.isSuspended;
    this.updateStatus = hospitalStaff.updateStatus;
    this.passwordUpdateStatus = hospitalStaff.passwordUpdateStatus;
};


// Hospital Login
HospitalStaff.login = async (email, password) => {
    const query = "SELECT * FROM Hospital_Staffs WHERE BINARY hospitalStaffEmail = ?";
    try {
        const result = await dbQuery(query, [email]);

        if (result.length === 0) {
            throw new Error("Hospital staff not found");
        }
        const hospitalStaff = result[0];
        if (hospitalStaff.deleteStatus !== 0 || hospitalStaff.isSuspended !== 0) {
            throw new Error("Hospital staff is not active or has been deleted or is in suspension");
        }

        const isMatch = await promisify(bcrypt.compare)(password, hospitalStaff.hospitalStaffPassword);

        if (!isMatch) {
            throw new Error("Invalid password");
        }

        return hospitalStaff; 
    } catch (error) {
        throw error;
    }
};


// HospitalStaff Change Password
HospitalStaff.changePassword = async (hospitalStaffId, oldPassword, newPassword) => {
    const checkStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0";

    try {
        const selectRes = await dbQuery(checkStaffQuery, [hospitalStaffId]);

        if (selectRes.length === 0) {
            throw new Error("Staff not found");
        }

        const hospitalStaff = selectRes[0];

        const isMatch = await promisify(bcrypt.compare)(oldPassword, hospitalStaff.hospitalStaffPassword);

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

        const updatePasswordValues = [
            hashedNewPassword,
            hospitalStaffId,
        ];

        const updatePasswordRes = await dbQuery(updatePasswordQuery, updatePasswordValues);

        console.log("Staff password updated successfully for hospitalStaffId:", hospitalStaffId);
        return { message: "Password updated successfully" };
    } catch (error) {
        throw error;
    }
};


// Hospital View Profile
HospitalStaff.viewProfile = async (hospitalStaffId) => {
    const query = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended= 0";
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



HospitalStaff.updateProfile = async (updatedHospitalStaff) => {
    const checkHospitalStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND deleteStatus = 0 AND isSuspended = 0";

    try {
        const selectRes = await dbQuery(checkHospitalStaffQuery, [updatedHospitalStaff.hospitalStaffId]);

        if (selectRes.length === 0) {
            throw new Error("Hospital Staff not found");
        }

        // Check if hospitalStaffAadhar already exists for another staff member
        const checkAadharQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar = ? AND hospitalStaffId != ? AND deleteStatus = 0 AND isSuspended = 0";
        const aadharRes = await dbQuery(checkAadharQuery, [updatedHospitalStaff.hospitalStaffAadhar, updatedHospitalStaff.hospitalStaffId]);

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

        const updateRes = await dbQuery(updateQuery, updateValues);

        const responseData = { ...updatedHospitalStaff };
        console.log("Updated hospital staff details:", { id: updatedHospitalStaff.hospitalStaffId, ...updatedHospitalStaff });
        return responseData;
    } catch (error) {
        throw error;
    }
};




module.exports = {HospitalStaff};