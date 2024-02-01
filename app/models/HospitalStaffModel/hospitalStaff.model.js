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


// patients.model.js
const Patients = function (patient) {
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
    this.patientDischargedDate = patient.patientDischargedDate
    this.passwordUpdateStatus = patient.passwordUpdateStatus;
    this.dischargeStatus = patient.dischargeStatus;
    this.updateStatus = patient.updateStatus;
};



// Hospital staff Login
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


// Hospitalstaff update Profile
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


// Hospitalstaff update Profile
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


// Hospital staff Register New Staff
HospitalStaff.registerPatient = async (newPatient) => {
    try {
        const checkHospitalStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND deleteStatus=0 AND isSuspended=0";
        const checkAadharQuery = "SELECT * FROM Patients WHERE patientAadhar=? AND dischargeStatus = 0";
        const checkEmailQuery = "SELECT * FROM Patients WHERE patientEmail=? AND dischargeStatus = 0";

        const hospitalStaffResult = await dbQuery(checkHospitalStaffQuery, [newPatient.hospitalStaffId]);

        if (hospitalStaffResult.length === 0) {
            throw new Error("Hospital staff does not exist");
        }

        const aadharRes = await dbQuery(checkAadharQuery, [newPatient.patientAadhar]);
        if (aadharRes.length > 0) {
            throw new Error("Aadhar number already exists");
        }

        const emailRes = await dbQuery(checkEmailQuery, [newPatient.patientEmail]);
        if (emailRes.length > 0) {
            throw new Error("Email already exists");
        }

        const hospitalId = hospitalStaffResult[0].hospitalId;

        newPatient.hospitalId = hospitalId;

        const hashedPassword = await promisify(bcrypt.hash)(newPatient.patientPassword, 10);
        newPatient.patientPassword = hashedPassword;

        const insertQuery = "INSERT INTO Patients SET ?";
        const insertRes = await dbQuery(insertQuery, newPatient);

        return { status: "Success", message: 'Patient added successfully', data: { patientId: insertRes.insertId, ...newPatient } };
    } catch (error) {
        throw error;
    }
};


// View All patients
HospitalStaff.viewAllPatients = async (hospitalStaffId) => {
    try {
        const viewAllPatientsQuery = `
            SELECT P.*
            FROM Patients P
            WHERE P.hospitalId = (SELECT hospitalId FROM Hospital_Staffs WHERE hospitalStaffId = ?) AND P.dischargeStatus = 0
        `;
        const allPatients = await dbQuery(viewAllPatientsQuery, [hospitalStaffId]);

        return { status: "Success", message: 'All patients are retrieved successfully', data: allPatients };
    } catch (error) {
        throw error;
    }
};


// View One patient
HospitalStaff.viewOnePatient = async (hospitalStaffId, patientId) => {
    try {
        const viewOnePatientQuery = `
            SELECT P.*
            FROM Patients P
            WHERE P.hospitalId = (SELECT hospitalId FROM Hospital_Staffs WHERE hospitalStaffId = ?)
            AND P.patientId = ?
            AND P.dischargeStatus = 0
        `;
        const patient = await dbQuery(viewOnePatientQuery, [hospitalStaffId, patientId]);

        if (patient.length === 0) {
            throw new Error("Patient not found");
        }

        return { status: "Success", message: 'Patient retrieved successfully', data: patient[0] };
    } catch (error) {
        throw error;
    }
};




// Hospital Search Patients
HospitalStaff.searchPatients = async (hospitalStaffId, searchQuery) => {
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

    try {
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
            `%${searchQuery}%`
        ]);

        return result;
    } catch (error) {
        throw error;
    }
};







module.exports = {HospitalStaff, Patients};