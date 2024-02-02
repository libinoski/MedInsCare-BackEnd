// hospital.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const dataValidator = require('../../config/data.validate');
const fs = require('fs');
const { HospitalStaff } = require('../../models/HospitalStaffModel/hospitalStaff.model');




// HospitalStaff Login
exports.hospitalStaffLogin = async (req, res) => {
    const { hospitalStaffEmail, hospitalStaffPassword } = req.body;
    const hospitalStaffData = req.body;

    const emailValidation = dataValidator.isValidEmail(hospitalStaffData.hospitalStaffEmail); // Change this line
    if (!emailValidation.isValid) {
        return res.status(400).json({ status: 'Validation failed', details: emailValidation.message });
    }

    const passwordValidation = dataValidator.isValidPassword(hospitalStaffData.hospitalStaffPassword);
    if (!passwordValidation.isValid) {
        return res.status(400).json({ status: 'Validation failed', details: passwordValidation.message });
    }

    try {
        const hospitalStaff = await HospitalStaff.login(hospitalStaffEmail, hospitalStaffPassword);

        const token = jwt.sign(
            { hospitalStaffId: hospitalStaff.hospitalStaffId, hospitalStaffEmail: hospitalStaff.hospitalStaffEmail },
            'micstaff', //secret key
            { expiresIn: '1h' }
        );

        return res.status(200).json({ status: 'Login successful', data: { token, hospitalStaff } });  // Change this line
    } catch (error) {
        if (error.message === "Hospital staff not found" || error.message === "Hospital staff is not active or has been deleted or is in suspension" || error.message === "Invalid password") {
            return res.status(401).json({ status: 'Login failed', data: error.message });
        } else {
            console.error('Error during hospital login:', error);
            return res.status(500).json({ status: 'Internal server error' });
        }
    }
};


// HospitalStaff Change Password Controller
exports.hospitalStaffChangePassword = async (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(401).json({ status: "Token missing" });
    }

    try {
        const decoded = jwt.verify(token, "micstaff");

        const { hospitalStaffId, oldPassword, newPassword } = req.body;

        if (decoded.hospitalStaffId != hospitalStaffId) {
            return res.status(403).json({
                status: "error",
                message: "Unauthorized access to change the staff password",
            });
        }

        const validationResults = validateHospitalStaffChangePassword(req.body);

        if (!validationResults.isValid) {
            return res.status(400).json({ status: "Validation failed", data: validationResults.messages });
        }

        try {
            await HospitalStaff.changePassword(hospitalStaffId, oldPassword, newPassword);

            return res.status(200).json({ status: "success", message: "Password changed successfully" });
        } catch (error) {
            if (error.message === "Staff not found" || error.message === "Invalid old password") {
                return res.status(404).json({ status: "error", message: error.message });
            } else {
                console.error('Error changing staff password:', error);
                return res.status(500).json({ status: "Failed to change password", error: error.message });
            }
        }
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: "Invalid token" });
        } else {
            console.error('Error changing staff password:', error);
            return res.status(500).json({ status: "Failed to change password", error: error.message });
        }
    }
};
// Function to validate the hospital staff change password request
function validateHospitalStaffChangePassword(passwordData) {
    const validationResults = {
        isValid: true,
        messages: [],
    };

    const passwordValidation = dataValidator.isValidPassword(passwordData.oldPassword);
    if (!passwordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'oldPassword', message: passwordValidation.message });
    }

    const newPasswordValidation = dataValidator.isValidPassword(passwordData.newPassword);
    if (!newPasswordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'newPassword', message: newPasswordValidation.message });
    }

    return validationResults;
}


// Hospital Staff View Profile
exports.hospitalStaffViewProfile = async (req, res) => {
    const { hospitalStaffId } = req.body;
    const token = req.headers.token;

    if (!hospitalStaffId) {
        return res.status(400).json({
            status: 'error',
            message: 'Hospital ID is required in the request body',
        });
    }

    try {
        jwt.verify(token, 'micstaff', async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token',
                });
            }

            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to the hospital staff profile',
                });
            }

            const result = await HospitalStaff.viewProfile(hospitalStaffId);

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token',
            });
        } else if (error.message === "Hospital staff not found") {
            return res.status(404).json({
                status: 'error',
                message: 'Hospital staff not found',
            });
        } else {
            console.error('Error fetching hospital profile:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    }
};


// Hospital Staff Update Profile
exports.hospitalStaffUpdateProfile = async (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(401).json({ status: "Token missing" });
    }

    try {
        jwt.verify(token, "micstaff", async (err, decoded) => {
            if (err) {
                return res.status(401).json({ status: "Invalid token" });
            }

            const {
                hospitalStaffId,
                hospitalStaffName,
                hospitalStaffMobile,
                hospitalStaffAddress,
                hospitalStaffAadhar,
            } = req.body;

            const updatedHospitalStaff = {
                hospitalStaffId,
                hospitalStaffName,
                hospitalStaffMobile,
                hospitalStaffAddress,
                hospitalStaffAadhar,
            };

            const validationResults = validateHospitalStaffUpdateProfile(updatedHospitalStaff);

            if (!validationResults.isValid) {
                return res.status(400).json({ status: "Validation failed", data: validationResults.messages });
            }

            try {
                if (decoded.hospitalStaffId != hospitalStaffId) {
                    return res.status(403).json({
                        status: "error",
                        message: "Unauthorized access to edit the hospital staff profile",
                    });
                }

                const data = await HospitalStaff.updateProfile(updatedHospitalStaff);
                return res.status(200).json({ status: "success", message: "Hospital staff updated successfully", data });
            } catch (error) {
                if (error.message === "Hospital Staff not found") {
                    return res.status(404).json({ status: error.message });
                } else if (error.message === "Aadhar Number Already Exists.") {
                    return res.status(409).json({ status: error.message });
                } else {
                    console.error('Error updating hospital staff profile:', error);
                    return res.status(500).json({ status: "Failed to edit hospital staff profile", error: error.message });
                }
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: "Invalid token" });
        } else {
            console.error('Error during token verification:', error);
            return res.status(500).json({ status: "Failed to verify token", error: error.message });
        }
    }
};
// Function to validate the hospital staff update profile request
function validateHospitalStaffUpdateProfile(hospitalStaffData) {
    const validationResults = {
        isValid: true,
        messages: [],
    };

    const idValidation = dataValidator.isValidId(hospitalStaffData.hospitalStaffId);
    if (!idValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffId', message: idValidation.message });
    }

    const nameValidation = dataValidator.isValidName(hospitalStaffData.hospitalStaffName);
    if (!nameValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffName', message: nameValidation.message });
    }

    const aadharValidation = dataValidator.isValidAadharNumber(hospitalStaffData.hospitalStaffAadhar);
    if (!aadharValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffAadhar', message: aadharValidation.message });
    }

    const mobileValidation = dataValidator.isValidMobileNumber(hospitalStaffData.hospitalStaffMobile);
    if (!mobileValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffMobile', message: mobileValidation.message });
    }

    const addressValidation = dataValidator.isValidAddress(hospitalStaffData.hospitalStaffAddress);
    if (!addressValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffAddress', message: addressValidation.message });
    }

    // Add additional validations as needed

    return validationResults;
}


// Hospital staff Register New Patient
exports.patientRegister = async (req, res) => {
    try {
        const token = req.headers.token;
        jwt.verify(token, 'micstaff', async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            const PatientImagesStorage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, 'Files/PatientImages');
                },
                filename: function (req, file, cb) {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const ext = path.extname(file.originalname);

                    if (file.fieldname === 'patientProfileImage') {
                        const fileName = 'patientProfileImage-' + uniqueSuffix + ext;
                        cb(null, fileName);
                        req.patientProfileImageFileName = fileName;
                    } else if (file.fieldname === 'patientIdProofImage') {
                        const fileName = 'patientIdProofImage-' + uniqueSuffix + ext;
                        cb(null, fileName);
                        req.patientIdProofImageFileName = fileName;
                    }
                }
            });

            const uploadpatientImages = multer({ storage: PatientImagesStorage }).fields([
                { name: 'patientProfileImage', maxCount: 1 },
                { name: 'patientIdProofImage', maxCount: 1 }
            ]);

            uploadpatientImages(req, res, async function (err) {
                if (err) {
                    return res.status(400).json({ error: 'File upload failed', details: err.message });
                }

                const patientProfileImageFile = req.files && req.files['patientProfileImage'] ? req.files['patientProfileImage'][0] : null;
                const patientIdProofImageFile = req.files && req.files['patientIdProofImage'] ? req.files['patientIdProofImage'][0] : null;

                if (!patientProfileImageFile || !patientIdProofImageFile) {
                    if (patientProfileImageFile) {
                        fs.unlinkSync(path.join('Files/patientImages', patientProfileImageFile.filename));
                    }
                    if (patientIdProofImageFile) {
                        fs.unlinkSync(path.join('Files/patientImages', patientIdProofImageFile.filename));
                    }

                    return res.status(400).json({ error: 'Both profile image and ID proof image are required for registration' });
                }

                const patientData = req.body;

                const validationResults = validatePatientRegistration(patientData, patientProfileImageFile, patientIdProofImageFile);
                if (!validationResults.isValid) {
                    if (patientProfileImageFile) {
                        fs.unlinkSync(path.join('Files/patientImages', patientProfileImageFile.filename));
                    }
                    if (patientIdProofImageFile) {
                        fs.unlinkSync(path.join('Files/patientImages', patientIdProofImageFile.filename));
                    }

                    return res.status(400).json({ error: 'Validation failed', details: validationResults.messages });
                }

                const hospitalStaffIdFromToken = decoded.hospitalStaffId;

                if (patientData.hospitalStaffId != hospitalStaffIdFromToken) {
                    if (patientProfileImageFile) {
                        fs.unlinkSync(path.join('Files/patientImages', patientProfileImageFile.filename));
                    }
                    if (patientIdProofImageFile) {
                        fs.unlinkSync(path.join('Files/patientImages', patientIdProofImageFile.filename));
                    }

                    return res.status(401).json({ error: 'Unauthorized access to hospital data' });
                }

                const newPatient = {
                    hospitalStaffId: patientData.hospitalStaffId,
                    hospitalId: patientData.hospitalId,
                    patientName: patientData.patientName,
                    patientProfileImage: req.patientProfileImageFileName,
                    patientIdProofImage: req.patientIdProofImageFileName,
                    patientMobile: patientData.patientMobile,
                    patientEmail: patientData.patientEmail,
                    patientGender: patientData.patientGender,
                    patientAge: patientData.patientAge,
                    patientAddress: patientData.patientAddress,
                    patientAadhar: patientData.patientAadhar,
                    patientPassword: patientData.patientPassword,
                    patientRegisteredDate: new Date(),
                    patientDischargedDate: patientData.patientDischargedDate,
                    updatedDate: null,
                    dischargeStatus: 0,
                    updateStatus: 0,
                    passwordUpdateStatus: 0,
                };

                try {
                    const registrationResponse = await HospitalStaff.registerPatient(newPatient);

                    const responseData = {
                        status: registrationResponse.status,
                        message: registrationResponse.message,
                        data: registrationResponse.data,
                    };

                    return res.status(201).json(responseData);

                } catch (error) {
                    if (patientProfileImageFile) {
                        fs.unlinkSync(path.join('Files/patientImages', patientProfileImageFile.filename));
                    }
                    if (patientIdProofImageFile) {
                        fs.unlinkSync(path.join('Files/patientImages', patientIdProofImageFile.filename));
                    }

                    if (
                        error.message === "Hospital staff does not exist" ||
                        error.message === "Aadhar number already exists" ||
                        error.message === "Email already exists"
                    ) {
                        return res.status(400).json({ error: error.message });
                    } else {
                        throw error;
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error during hospital patient registration:', error);
        if (req.files) {
            if (req.files['patientProfileImage'] && req.files['patientProfileImage'][0]) {
                fs.unlinkSync(path.join('Files/patientImages', req.files['patientProfileImage'][0].filename));
            }
            if (req.files['patientIdProofImage'] && req.files['patientIdProofImage'][0]) {
                fs.unlinkSync(path.join('Files/patientImages', req.files['patientIdProofImage'][0].filename));
            }
        }

        return res.status(500).json({ error: 'Internal server error' });
    }
};
// Function to validate the hospital staff patient registration request
function validatePatientRegistration(patientData, patientProfileImageFile, patientIdProofImageFile) {
    const validationResults = {
        isValid: true,
        messages: [],
    };

    const idValidation = dataValidator.isValidId(patientData.hospitalStaffId);
    if (!idValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffId', message: idValidation.message });
    }

    const nameValidation = dataValidator.isValidName(patientData.patientName);
    if (!nameValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientName', message: nameValidation.message });
    }

    const emailValidation = dataValidator.isValidEmail(patientData.patientEmail);
    if (!emailValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientEmail', message: emailValidation.message });
    }

    const ageValidation = dataValidator.isValidAge(patientData.patientAge);
    if (!ageValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientAge', message: ageValidation.message });
    }

    const genderValidation = dataValidator.isValidGender(patientData.patientGender);
    if (!genderValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientGender', message: genderValidation.message });
    }

    const aadharValidation = dataValidator.isValidAadharNumber(patientData.patientAadhar);
    if (!aadharValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientAadhar', message: aadharValidation.message });
    }

    const mobileValidation = dataValidator.isValidMobileNumber(patientData.patientMobile);
    if (!mobileValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientMobile', message: mobileValidation.message });
    }
    const addressValidation = dataValidator.isValidAddress(patientData.patientAddress);
    if (!addressValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientAddress', message: addressValidation.message });
    }
    const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(patientProfileImageFile);
    if (!profileImageValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientProfileImage', message: profileImageValidation.message });
    }

    const idProofImageValidation = dataValidator.isValidImageWith1MBConstraint(patientIdProofImageFile);
    if (!idProofImageValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'patientIdProofImage', message: idProofImageValidation.message });
    }

    const passwordValidation = dataValidator.isValidPassword(patientData.patientPassword);
    if (!passwordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalPassword', message: passwordValidation.message });
    }

    return validationResults;
}


// Hospital Staff View All Patients
exports.viewAllPatients = async (req, res) => {
    try {
        const { hospitalStaffId } = req.body;

        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Token missing',
            });
        }

        jwt.verify(token, 'micstaff', async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token',
                });
            }

            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to view patient details',
                });
            }

            try {
                const allPatients = await HospitalStaff.viewAllPatients(hospitalStaffId);

                return res.status(200).json({
                    status: 'success',
                    message: 'All patients are retrieved successfully',
                    data: allPatients.data,
                });
            } catch (error) {
                console.error('Error viewing all patients:', error);
                return res.status(500).json({
                    status: 'error',
                    message: 'Internal server error',
                });
            }
        });
    } catch (error) {
        console.error('Error during viewAllPatients:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};


// Hospital Staff View One Patient
exports.viewOnePatient = async (req, res) => {
    try {
        const { hospitalStaffId, patientId } = req.body;

        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Token missing',
            });
        }

        jwt.verify(token, 'micstaff', async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token',
                });
            }

            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to view patient details',
                });
            }

            try {
                const patientData = await HospitalStaff.viewOnePatient(hospitalStaffId, patientId);

                return res.status(200).json({
                    status: 'success',
                    message: 'Patient retrieved successfully',
                    data: patientData.data,
                });
            } catch (error) {
                if (error.message === "Patient not found") {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Patient not found',
                    });
                }
                console.error('Error viewing one patient:', error);
                return res.status(500).json({
                    status: 'error',
                    message: 'Internal server error',
                });
            }
        });
    } catch (error) {
        console.error('Error during viewOnePatient:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};


// Hospital Staff Search Patients
exports.searchPatients = async (req, res) => {
    try {
        const { hospitalStaffId, searchQuery } = req.body;
        if (!searchQuery) {
            return res.status(400).json({
                status: 'error',
                message: 'Search query is required',
            });
        }
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Token missing',
            });
        }

        jwt.verify(token, 'micstaff', async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token',
                });
            }

            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Unauthorized access to search patient details',
                });
            }

            try {
                const patientData = await HospitalStaff.searchPatients(hospitalStaffId, searchQuery);

                if (patientData.length === 0) {
                    // No patients found
                    return res.status(200).json({
                        status: 'failed',
                        message: 'No patients found'
                    });
                }

                return res.status(200).json({
                    status: 'success',
                    message: 'Patients retrieved successfully',
                    data: patientData,
                });
            } catch (error) {
                console.error('Error searching patients:', error);
                return res.status(500).json({
                    status: 'error',
                    message: 'Internal server error',
                });
            }
        });
    } catch (error) {
        console.error('Error during searchPatients:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
};

