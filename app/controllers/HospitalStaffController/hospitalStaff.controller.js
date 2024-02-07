// hospital.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const dataValidator = require('../../config/data.validate');
const fs = require('fs');
const { HospitalStaff } = require('../../models/HospitalStaffModel/hospitalStaff.model');



//Hospial Staff Login
exports.hospitalStaffLogin = async (req, res) => {
    const { hospitalStaffEmail, hospitalStaffPassword } = req.body;

    const emailValidation = dataValidator.isValidEmail(hospitalStaffEmail);
    const passwordValidation = dataValidator.isValidPassword(hospitalStaffPassword);

    const validationResults = {
        isValid: true,
        errors: [],
    };

    if (!passwordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors.push({ field: 'hospitalStaffPassword', message: passwordValidation.message });
    }

    if (!emailValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors.push({ field: 'hospitalStaffEmail', message: emailValidation.message });
    }

    if (!validationResults.isValid) {
        return res.status(400).json({status: 'Validation failed',message: 'Invalid input data',details: validationResults.errors});
    }

    try {
        const hospitalStaff = await HospitalStaff.login(hospitalStaffEmail, hospitalStaffPassword);

        const token = jwt.sign(
            { hospitalStaffId: hospitalStaff.hospitalStaffId, hospitalStaffEmail: hospitalStaff.hospitalStaffEmail },
            process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            status: 'Success',message: 'Login successful',data: { token, hospitalStaff }});
    } catch (error) {
        if (error.message === "Hospital staff not found" ||
            error.message === "You are not permitted to login" ||
            error.message === "Invalid password" ||
            error.message === "Hospital staff account is deleted") {
            return res.status(401).json({status: 'Failure',message: 'Authentication failed',details: error.message});
        } else if (error.message === "The associated hospital is not active" ||
            error.message === "The associated hospital is deleted") {
            return res.status(401).json({status: 'Failure',message: 'Authentication failed',details: error.message});
        } else {
            console.error('Error during hospital staff login:', error);
            return res.status(500).json({status: 'Error',message: 'Internal server error',details: 'An internal server error occurred during login'});
        }
    }
};





exports.hospitalStaffChangePassword = async (req, res) => {
    try {
        const token = req.headers.token;
        const { hospitalStaffId, oldPassword, newPassword } = req.body;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF);

            if (!token || !decoded || !hospitalStaffId || (decoded.hospitalStaffId != hospitalStaffId)) {
                return res.status(403).json({ status: 'Failure', message: 'Unauthorized access to change the staff password' });
            }

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

            const validationResults = validateHospitalStaffChangePassword({ oldPassword, newPassword });

            if (!validationResults.isValid) {
                return res.status(400).json({ status: 'Failure', message: 'Validation failed', data: validationResults.messages });
            }

            try {
                await HospitalStaff.changePassword(hospitalStaffId, oldPassword, newPassword);

                return res.status(200).json({ status: 'Success', message: 'Password changed successfully' });
            } catch (error) {
                if (error.message === 'Staff not found' || error.message === 'Invalid old password') {
                    return res.status(404).json({ status: 'Failure', message: error.message });
                } else {
                    console.error('Error changing staff password:', error);
                    return res.status(500).json({ status: 'Error', message: 'Failed to change password', error: error.message });
                }
            }
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ status: 'Failure', message: 'Invalid token', error: 'Token verification failed' });
            } else {
                console.error('Error changing staff password:', error);
                return res.status(500).json({ status: 'Error', message: 'Failed to change password', error: error.message });
            }
        }
    } catch (error) {
        console.error('Error changing staff password:', error);
        return res.status(500).json({ status: 'Error', message: 'Failed to change password', error: error.message });
    }
};





// Hospital Staff View Profile
exports.hospitalStaffViewProfile = async (req, res) => {
    const token = req.headers.token;
    const { hospitalStaffId } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF);

        if (!token || !hospitalStaffId || !decoded || (decoded.hospitalStaffId != hospitalStaffId)) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized access to the hospital staff profile' });
        }

        try {
            const result = await HospitalStaff.viewProfile(hospitalStaffId);
            return res.status(200).json({ status: 'success', message: 'Hospital staff profile retrieved successfully', data: result });
        } catch (error) {
            if (error.message === "Hospital staff not found") {
                return res.status(404).json({ status: 'error', message: 'Hospital staff not found' });
            } else {
                console.error('Error fetching hospital profile:', error);
                return res.status(500).json({ status: 'error', message: 'Internal server error', details: error.message });
            }
        }
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'error', message: 'Invalid token' });
        } else {
            console.error('Error fetching hospital profile:', error);
            return res.status(500).json({ status: 'error', message: 'Internal server error', details: error.message });
        }
    }
};





// Hospital Staff Update Profile
exports.hospitalStaffUpdateProfile = async (req, res) => {
    const token = req.headers.token;
    const { hospitalStaffId, hospitalStaffName, hospitalStaffMobile, hospitalStaffAddress, hospitalStaffAadhar } = req.body;


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF);


        if (!token || !hospitalStaffId || !decoded || (decoded.hospitalStaffId != hospitalStaffId)) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized access to update hospital staff profile' });
        }

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


            return validationResults;
        }

        const validationResults = validateHospitalStaffUpdateProfile({
            hospitalStaffId,
            hospitalStaffName,
            hospitalStaffMobile,
            hospitalStaffAddress,
            hospitalStaffAadhar,
        });

        if (!validationResults.isValid) {
            return res.status(400).json({ status: "Validation failed", data: validationResults.messages });
        }

        try {
            const data = await HospitalStaff.updateProfile({
                hospitalStaffId,
                hospitalStaffName,
                hospitalStaffMobile,
                hospitalStaffAddress,
                hospitalStaffAadhar,
            });

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
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: "Invalid token" });
        } else {
            console.error('Error during token verification:', error);
            return res.status(500).json({ status: "Failed to verify token", error: error.message });
        }
    }
};






// Hospital staff Register New Patient
exports.patientRegister = async (req, res) => {
    const token = req.headers.token;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF);

        if (!token || !req.body.hospitalStaffId || !decoded || (decoded.hospitalStaffId != req.body.hospitalStaffId)) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized access to update hospital staff profile' });
        }

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

                // Delete uploaded images on validation failure
                if (patientProfileImageFile) {
                    fs.unlinkSync(path.join('Files/PatientImages', patientProfileImageFile.filename));
                }
            }

            const idProofImageValidation = dataValidator.isValidImageWith1MBConstraint(patientIdProofImageFile);
            if (!idProofImageValidation.isValid) {
                validationResults.isValid = false;
                validationResults.messages.push({ field: 'patientIdProofImage', message: idProofImageValidation.message });

                // Delete uploaded images on validation failure
                if (patientIdProofImageFile) {
                    fs.unlinkSync(path.join('Files/PatientImages', patientIdProofImageFile.filename));
                }
            }

            const passwordValidation = dataValidator.isValidPassword(patientData.patientPassword);
            if (!passwordValidation.isValid) {
                validationResults.isValid = false;
                validationResults.messages.push({ field: 'hospitalPassword', message: passwordValidation.message });
            }

            return validationResults;
        }

        const patientImagesStorage = multer.diskStorage({
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

        const uploadPatientImages = multer({ storage: patientImagesStorage }).fields([
            { name: 'patientProfileImage', maxCount: 1 },
            { name: 'patientIdProofImage', maxCount: 1 }
        ]);

        uploadPatientImages(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ status: 'error', message: 'File upload failed', details: err.message });
            }

            const patientProfileImageFile = req.files && req.files['patientProfileImage'] ? req.files['patientProfileImage'][0] : null;
            const patientIdProofImageFile = req.files && req.files['patientIdProofImage'] ? req.files['patientIdProofImage'][0] : null;

            if (!patientProfileImageFile || !patientIdProofImageFile) {
                if (patientProfileImageFile) {
                    fs.unlinkSync(path.join('Files/PatientImages', patientProfileImageFile.filename));
                }
                if (patientIdProofImageFile) {
                    fs.unlinkSync(path.join('Files/PatientImages', patientIdProofImageFile.filename));
                }

                return res.status(400).json({ status: 'error', message: 'Both profile image and ID proof image are required for registration' });
            }

            const patientData = req.body;

            const validationResults = validatePatientRegistration(patientData, patientProfileImageFile, patientIdProofImageFile);
            if (!validationResults.isValid) {
                return res.status(400).json({ status: 'error', message: 'Validation failed', details: validationResults.messages });
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
                // Attempt to register patient
                const registrationResponse = await HospitalStaff.registerPatient(newPatient);

                // Response data
                const responseData = {
                    status: registrationResponse.status,
                    message: registrationResponse.message,
                    data: registrationResponse.data,
                };

                return res.status(201).json(responseData);
            } catch (error) {
                if (patientProfileImageFile) {
                    fs.unlinkSync(path.join('Files/PatientImages', patientProfileImageFile.filename));
                }
                if (patientIdProofImageFile) {
                    fs.unlinkSync(path.join('Files/PatientImages', patientIdProofImageFile.filename));
                }

                if (
                    error.message === 'Hospital staff does not exist' ||
                    error.message === 'Aadhar number already exists' ||
                    error.message === 'Email already exists'
                ) {
                    return res.status(400).json({ status: 'error', message: error.message });
                } else {
                    throw error;
                }
            }
        });
    } catch (error) {
        console.error('Error during hospital patient registration:', error);

        if (req.files) {
            if (req.files['patientProfileImage'] && req.files['patientProfileImage'][0]) {
                fs.unlinkSync(path.join('Files/PatientImages', req.files['patientProfileImage'][0].filename));
            }
            if (req.files['patientIdProofImage'] && req.files['patientIdProofImage'][0]) {
                fs.unlinkSync(path.join('Files/PatientImages', req.files['patientIdProofImage'][0].filename));
            }
        }

        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};





// Hospital staff view all Patients
exports.viewAllPatients = async (req, res) => {
    try {
        const { hospitalStaffId } = req.body;
        const token = req.headers.token;

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF);

        if (!token || !hospitalStaffId || !decoded || (decoded.hospitalStaffId != hospitalStaffId)) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized access to view patient details' });
        }

        try {
            const allPatients = await HospitalStaff.viewAllPatients(hospitalStaffId);

            return res.status(200).json({ status: 'success', message: 'All patients are retrieved successfully', data: allPatients.data });
        } catch (error) {
            console.error('Error viewing all patients:', error);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error during viewAllPatients:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};





// Hospital staff view one Patient
exports.viewOnePatient = async (req, res) => {
    try {
        const { hospitalStaffId, patientId } = req.body;
        const token = req.headers.token;

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF);

        if (!token || decoded.hospitalStaffId !== hospitalStaffId) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized access to view patient details' });
        }

        try {
            const patientData = await HospitalStaff.viewOnePatient(hospitalStaffId, patientId);

            return res.status(200).json({ status: 'success', message: 'Patient retrieved successfully', data: patientData.data });
        } catch (error) {
            if (error.message === "Patient not found") {
                return res.status(404).json({ status: 'error', message: 'Patient not found' });
            }
            console.error('Error viewing one patient:', error);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error during viewOnePatient:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};





// Hospital Staff Search Patients
exports.searchPatients = async (req, res) => {
    try {
        const { hospitalStaffId, searchQuery } = req.body;
        const token = req.headers.token;

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF);

        if (!token || !decoded || (decoded.hospitalStaffId != hospitalStaffId)) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized access to search patient details' });
        }

        if (searchQuery === undefined || searchQuery === null || searchQuery.trim() === '') {
            return res.status(400).json({ status: 'error', message: 'Search query is required' });
        }

        try {
            const patientData = await HospitalStaff.searchPatients(hospitalStaffId, searchQuery);

            if (patientData.length === 0) {
                return res.status(200).json({ status: 'failed', message: 'No patients found' });
            }

            return res.status(200).json({ status: 'success', message: 'Patients retrieved successfully', data: patientData });
        } catch (error) {
            console.error('Error searching patients:', error);
            return res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error during searchPatients:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

