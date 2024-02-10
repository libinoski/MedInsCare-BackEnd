// hospitalStaff.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const dataValidator = require('../../config/data.validate');
const fs = require('fs');
const { HospitalStaff } = require('../../models/HospitalStaffModel/hospitalStaff.model');






// Hospital Staff Login
exports.login = async (req, res) => {
    const { hospitalStaffEmail, hospitalStaffPassword } = req.body;

    const emailValidation = dataValidator.isValidEmail(hospitalStaffEmail);
    const passwordValidation = dataValidator.isValidPassword(hospitalStaffPassword);

    const validationResults = {
        isValid: true,
        errors: {},
    };

    if (!passwordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors['hospitalStaffPassword'] = [passwordValidation.message];
    }

    if (!emailValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors['hospitalStaffEmail'] = [emailValidation.message];
    }

    if (!validationResults.isValid) {
        return res.status(400).json({ status: 'Validation failed', message: 'Invalid input data', details: validationResults.errors });
    }

    try {
        const hospitalStaff = await HospitalStaff.login(hospitalStaffEmail, hospitalStaffPassword);

        const token = jwt.sign(
            { hospitalStaffId: hospitalStaff.hospitalStaffId, hospitalStaffEmail: hospitalStaff.hospitalStaffEmail },
            process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            status: 'Success',
            message: 'Login successful',
            data: { token, hospitalStaff }
        });
    } catch (error) {
        if (error.message === "Hospital staff not found" ||
            error.message === "You are not permitted to login" ||
            error.message === "Invalid password" ||
            error.message === "Hospital staff account is deleted") {
            return res.status(401).json({ status: 'Failure', message: 'Authentication failed', details: error.message });
        } else if (error.message === "The associated hospital is not active" ||
            error.message === "The associated hospital is deleted") {
            return res.status(401).json({ status: 'Failure', message: 'Authentication failed', details: error.message });
        } else {
            console.error('Error during hospital staff login:', error);
            return res.status(500).json({ status: 'Error', message: 'Internal server error', details: 'An internal server error occurred during login' });
        }
    }
};





// Hospital Staff Change Password
exports.changePassword = async (req, res) => {
    try {
        const token = req.headers.token;
        const { hospitalStaffId, oldPassword, newPassword } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        // Check if hospitalStaffId is missing
        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'failed', message: 'Invalid token', error: 'Token verification failed' });
                } else {
                    console.error('Error changing staff password:', err);
                    return res.status(500).json({ status: 'error', message: 'Failed to change password', error: err.message });
                }
            }

            // Check if decoded token matches hospitalStaffId from request body
            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
            }

            // Validate the password data
            function validateHospitalStaffChangePassword(passwordData) {
                const validationResults = {
                    isValid: true,
                    errors: {},
                };

                const passwordValidation = dataValidator.isValidPassword(passwordData.oldPassword);
                if (!passwordValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.errors['oldPassword'] = passwordValidation.message;
                }

                const newPasswordValidation = dataValidator.isValidPassword(passwordData.newPassword);
                if (!newPasswordValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.errors['newPassword'] = newPasswordValidation.message;
                }

                return validationResults;
            }

            const validationResults = validateHospitalStaffChangePassword({ oldPassword, newPassword });

            if (!validationResults.isValid) {
                return res.status(400).json({ status: 'failed', message: 'Validation failed', errors: validationResults.errors });
            }

            // Change password
            try {
                await HospitalStaff.changePassword(hospitalStaffId, oldPassword, newPassword);
                return res.status(200).json({ status: 'success', message: 'Password changed successfully' });
            } catch (error) {
                if (error.message === 'Staff not found' || error.message === 'Invalid old password') {
                    return res.status(404).json({ status: 'failed', message: error.message });
                } else {
                    console.error('Error changing staff password:', error);
                    return res.status(500).json({ status: 'error', message: 'Failed to change password', error: error.message });
                }
            }
        });
    } catch (error) {
        console.error('Error changing staff password:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to change password', error: error.message });
    }
};








// HospitalStaff Update ID Proof Image
exports.changeIdProofImage = async (req, res) => {
    try {
        const token = req.headers.token;
        const { hospitalStaffId } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        // Check if hospitalStaffId is missing
        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'error', message: 'Invalid token', error: 'Token verification failed' });
                } else {
                    console.error('Error during ID proof image change:', err);
                    return res.status(500).json({ status: 'error', message: 'Internal server error', error: err.message });
                }
            }

            // Check if decoded token matches hospitalStaffId from request body
            if (!decoded || decoded.hospitalStaffId !== hospitalStaffId) {
                return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
            }

            // Set up storage for ID proof image
            const idProofImageStorage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, 'Files/HospitalStaffIdProofImages');
                },
                filename: function (req, file, cb) {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const ext = path.extname(file.originalname);
                    cb(null, `hospitalStaffIdProof-${uniqueSuffix}${ext}`);
                }
            });

            const uploadIdProofImage = multer({ storage: idProofImageStorage }).single('hospitalStaffIdProofImage');

            uploadIdProofImage(req, res, async (err) => {
                if (err || !req.file) {
                    return res.status(400).json({ status: 'error', message: 'File upload failed', details: err ? err.message : "File is required." });
                }

                // Validate ID proof image
                function validateIdProofImage(file) {
                    const validationResults = {
                        isValid: true,
                        errors: {},
                    };

                    const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);
                    if (!imageValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors['hospitalStaffIdProofImage'] = imageValidation.message;
                    }

                    return validationResults;
                }

                const validationResults = validateIdProofImage(req.file);
                if (!validationResults.isValid) {
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({ status: 'error', message: 'Invalid image file', details: validationResults.errors });
                }

                // Change ID proof image
                try {
                    await HospitalStaff.changeIdProofImage(hospitalStaffId, req.file.filename);
                    return res.status(200).json({ status: 'success', message: 'ID proof image updated successfully' });
                } catch (error) {
                    if (error.message === "Hospital staff not found") {
                        return res.status(404).json({ status: 'error', message: error.message });
                    } else {
                        fs.unlinkSync(req.file.path);
                        console.error('Error updating ID proof image:', error);
                        return res.status(500).json({ status: 'error', message: 'Failed to update ID proof image', error: error.message });
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error during ID proof image change:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
    }
};





// HospitalStaff Update Profile Image
exports.changeProfileImage = async (req, res) => {
    try {
        const token = req.headers.token;
        const { hospitalStaffId } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        // Check if hospitalStaffId is missing
        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'failed', message: 'Invalid token', error: 'Token verification failed' });
                } else {
                    console.error('Error during profile image change:', err);
                    return res.status(500).json({ status: 'error', message: 'Internal server error', error: err.message });
                }
            }

            // Check if decoded token matches hospitalStaffId from request body
            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
            }

            // Set up storage for profile image
            const profileImageStorage = multer.diskStorage({
                destination: (req, file, cb) => cb(null, 'Files/HospitalStaffProfileImages'),
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const ext = path.extname(file.originalname);
                    cb(null, `hospitalStaffProfile-${uniqueSuffix}${ext}`);
                }
            });

            const uploadProfileImage = multer({ storage: profileImageStorage }).single('hospitalStaffProfileImage');

            uploadProfileImage(req, res, async (err) => {
                if (err || !req.file) {
                    return res.status(400).json({ status: 'error', message: 'File upload failed', details: err ? err.message : "File is required." });
                }

                // Validate the profile image file
                function validateProfileImage(file) {
                    const validationResults = {
                        isValid: true,
                        errors: {},
                    };

                    const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);
                    if (!imageValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors['hospitalStaffProfileImage'] = imageValidation.message;
                    }

                    return validationResults;
                }

                const validationResults = validateProfileImage(req.file);
                if (!validationResults.isValid) {
                    fs.unlinkSync(req.file.path); // Cleanup uploaded file
                    return res.status(400).json({ status: 'error', message: 'Invalid image file', details: validationResults.errors });
                }

                // Change profile image
                try {
                    await HospitalStaff.changeProfileImage(hospitalStaffId, req.file.filename);
                    return res.status(200).json({ status: 'success', message: 'Profile image updated successfully' });
                } catch (error) {
                    if (error.message === "Failed to update profile image or staff not found.") { // Check for specific error message
                        return res.status(404).json({ status: 'error', message: error.message });
                    } else {
                        fs.unlinkSync(req.file.path); // Cleanup on error
                        console.error('Error updating profile image:', error);
                        return res.status(500).json({ status: 'error', message: 'Failed to update profile image', error: error.message });
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error during profile image change:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
    }
};






// Hospital Staff View Profile
exports.viewProfile = async (req, res) => {
    try {
        const token = req.headers.token;
        const { hospitalStaffId } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        // Check if hospitalStaffId is missing
        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'error', message: 'Invalid token' });
                } else {
                    console.error('Error fetching hospital profile:', err);
                    return res.status(500).json({ status: 'error', message: 'Internal server error', details: err.message });
                }
            }

            // Check if decoded token matches hospitalStaffId from request body
            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
            }

            // Fetch staff profile data
            try {
                const staffProfileData = await HospitalStaff.viewProfile(hospitalStaffId);
                return res.status(200).json({ status: 'success', message: 'Hospital staff profile retrieved successfully', data: staffProfileData });
            } catch (error) {
                if (error.message === "Hospital staff not found") {
                    return res.status(404).json({ status: 'error', message: 'Hospital staff not found' });
                } else {
                    console.error('Error fetching hospital profile:', error);
                    return res.status(500).json({ status: 'error', message: 'Internal server error', details: error.message });
                }
            }
        });
    } catch (error) {
        console.error('Error fetching hospital profile:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error', details: error.message });
    }
};






// Hospital Staff Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const token = req.headers.token;
        const { hospitalStaffId, hospitalStaffName, hospitalStaffMobile, hospitalStaffAddress, hospitalStaffAadhar } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        // Check if hospitalStaffId is missing
        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'failed', message: 'Invalid token' });
                } else {
                    console.error('Error during token verification:', err);
                    return res.status(500).json({ status: 'error', message: 'Internal server error', error: err.message });
                }
            }

            // Check if decoded token matches hospitalStaffId from request body
            if (!decoded || decoded.hospitalStaffId !== hospitalStaffId) {
                return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
            }

            // Validate hospital staff profile update data
            function validateHospitalStaffUpdateProfile(hospitalStaffData) {
                const validationResults = {
                    isValid: true,
                    errors: {},
                };

                const idValidation = dataValidator.isValidId(hospitalStaffData.hospitalStaffId);
                if (!idValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.errors['hospitalStaffId'] = idValidation.message;
                }

                const nameValidation = dataValidator.isValidName(hospitalStaffData.hospitalStaffName);
                if (!nameValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.errors['hospitalStaffName'] = nameValidation.message;
                }

                const aadharValidation = dataValidator.isValidAadharNumber(hospitalStaffData.hospitalStaffAadhar);
                if (!aadharValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.errors['hospitalStaffAadhar'] = aadharValidation.message;
                }

                const mobileValidation = dataValidator.isValidMobileNumber(hospitalStaffData.hospitalStaffMobile);
                if (!mobileValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.errors['hospitalStaffMobile'] = mobileValidation.message;
                }

                const addressValidation = dataValidator.isValidAddress(hospitalStaffData.hospitalStaffAddress);
                if (!addressValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.errors['hospitalStaffAddress'] = addressValidation.message;
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
                return res.status(400).json({ status: 'Validation failed', message: 'One or more fields failed validation', errors: validationResults.errors });
            }

            // Update hospital staff profile
            try {
                const data = await HospitalStaff.updateProfile({
                    hospitalStaffId,
                    hospitalStaffName,
                    hospitalStaffMobile,
                    hospitalStaffAddress,
                    hospitalStaffAadhar,
                });

                return res.status(200).json({ status: 'success', message: 'Hospital staff updated successfully', data });
            } catch (error) {
                if (error.message === 'Hospital Staff not found') {
                    return res.status(404).json({ status: error.message, message: 'Hospital staff not found' });
                } else if (error.message === 'Aadhar Number Already Exists.') {
                    return res.status(409).json({ status: 'error', message: error.message });
                } else {
                    console.error('Error updating hospital staff profile:', error);
                    return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
                }
            }
        });
    } catch (error) {
        console.error('Error during token verification:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
    }
};







// Hospital staff Register New Patient
exports.registerPatient = async (req, res) => {
    try {
        const token = req.headers.token;
        const hospitalStaffId = req.body.hospitalStaffId;

        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'error', message: 'Invalid token' });
                } else {
                    return res.status(500).json({ status: 'error', message: 'Failed to authenticate token' });
                }
            }

            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
            }

            function validatePatientRegistration(patientData, patientProfileImageFile, patientIdProofImageFile) {
                const validationResults = {
                    isValid: true,
                    messages: {},
                };

                // Validate hospitalStaffId
                const staffIdValidation = dataValidator.isValidHospitalStaffId(patientData.hospitalStaffId);
                if (!staffIdValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['hospitalStaffId'] = staffIdValidation.message;
                }

                // Validate patientName
                const nameValidation = dataValidator.isValidName(patientData.patientName);
                if (!nameValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientName'] = nameValidation.message;
                }

                // Validate patientEmail
                const emailValidation = dataValidator.isValidEmail(patientData.patientEmail);
                if (!emailValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientEmail'] = emailValidation.message;
                }

                // Validate patientAge
                const ageValidation = dataValidator.isValidAge(patientData.patientAge);
                if (!ageValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientAge'] = ageValidation.message;
                }

                // Validate patientGender
                const genderValidation = dataValidator.isValidGender(patientData.patientGender);
                if (!genderValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientGender'] = genderValidation.message;
                }

                // Validate patientAadhar
                const aadharValidation = dataValidator.isValidAadharNumber(patientData.patientAadhar);
                if (!aadharValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientAadhar'] = aadharValidation.message;
                }

                // Validate patientMobile
                const mobileValidation = dataValidator.isValidMobileNumber(patientData.patientMobile);
                if (!mobileValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientMobile'] = mobileValidation.message;
                }

                // Validate patientAddress
                const addressValidation = dataValidator.isValidAddress(patientData.patientAddress);
                if (!addressValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientAddress'] = addressValidation.message;
                }

                // Validate patientProfileImage
                const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(patientProfileImageFile);
                if (!profileImageValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientProfileImage'] = profileImageValidation.message;
                }

                // Validate patientIdProofImage
                const idProofImageValidation = dataValidator.isValidImageWith1MBConstraint(patientIdProofImageFile);
                if (!idProofImageValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientIdProofImage'] = idProofImageValidation.message;
                }

                // Validate patientPassword
                const passwordValidation = dataValidator.isValidPassword(patientData.patientPassword);
                if (!passwordValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.messages['patientPassword'] = passwordValidation.message;
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

                const hashedPassword = await bcrypt.hash(patientData.patientPassword, 10);

                const newPatient = {
                    hospitalStaffId: patientData.hospitalStaffId,
                    patientName: patientData.patientName,
                    patientProfileImage: req.patientProfileImageFileName,
                    patientIdProofImage: req.patientIdProofImageFileName,
                    patientMobile: patientData.patientMobile,
                    patientEmail: patientData.patientEmail,
                    patientGender: patientData.patientGender,
                    patientAge: patientData.patientAge,
                    patientAddress: patientData.patientAddress,
                    patientAadhar: patientData.patientAadhar,
                    patientPassword: hashedPassword,
                    patientRegisteredDate: new Date(),
                    patientDischargedDate: patientData.patientDischargedDate,
                    updatedDate: null,
                    dischargeStatus: 0,
                    updateStatus: 0,
                    passwordUpdateStatus: 0,
                };

                try {
                    const registrationResponse = await HospitalStaff.registerPatient(newPatient);
                    return res.status(201).json({ status: 'success', message: 'Patient registered successfully', data: registrationResponse });
                } catch (error) {
                    if (patientProfileImageFile) {
                        fs.unlinkSync(path.join('Files/PatientImages', patientProfileImageFile.filename));
                    }
                    if (patientIdProofImageFile) {
                        fs.unlinkSync(path.join('Files/PatientImages', patientIdProofImageFile.filename));
                    }

                    if (error.name === 'ValidationError') {
                        return res.status(400).json({ status: 'error', message: 'Validation failed', details: error.errors });
                    } else {
                        throw error;
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error during hospital patient registration:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};







exports.viewAllPatients = async (req, res) => {
    try {
        const token = req.headers.token;
        const hospitalStaffId = req.body.hospitalStaffId;

        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'error', message: 'Invalid token' });
                } else {
                    return res.status(500).json({ status: 'error', message: 'Failed to authenticate token' });
                }
            }

            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
            }

            try {
                const allPatientsData = await HospitalStaff.viewAllPatients(hospitalStaffId);
                return res.status(200).json({ status: 'success', message: 'All patients are retrieved successfully', data: allPatientsData });
            } catch (error) {
                console.error('Error viewing all patients:', error);
                return res.status(500).json({ status: 'error', message: 'Internal server error' });
            }
        });
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

        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        if (!patientId) {
            return res.status(400).json({ status: 'failed', message: 'Patient ID is missing' });
        }


        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'error', message: 'Invalid token' });
                } else {
                    return res.status(500).json({ status: 'error', message: 'Failed to authenticate token' });
                }
            }

            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
            }

            try {
                const patientData = await HospitalStaff.viewOnePatient(hospitalStaffId, patientId);
                return res.status(200).json({ status: 'success', message: 'Patient retrieved successfully', data: patientData });
            } catch (error) {
                if (error.message === "Patient not found") {
                    return res.status(404).json({ status: 'error', message: error.message });
                }
                console.error('Error viewing one patient:', error);
                return res.status(500).json({ status: 'error', message: 'Internal server error' });
            }
        });
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

        if (!token) {
            return res.status(401).json({ status: 'failed', message: 'Token is missing' });
        }

        if (!hospitalStaffId) {
            return res.status(400).json({ status: 'failed', message: 'Hospital Staff ID is missing' });
        }

        if (!searchQuery && searchQuery !== '') {
            return res.status(400).json({ status: 'failed', message: 'Search query is required' });
        }

        jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ status: 'error', message: 'Invalid token' });
                } else {
                    return res.status(500).json({ status: 'error', message: 'Failed to authenticate token' });
                }
            }

            if (decoded.hospitalStaffId != hospitalStaffId) {
                return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
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
        });
    } catch (error) {
        console.error('Error during searchPatients:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};




