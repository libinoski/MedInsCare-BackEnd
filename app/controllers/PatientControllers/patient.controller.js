// patient.controller.js
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const dataValidator = require("../../config/data.validate");
const fs = require("fs");
const { Patient } = require("../../models/PatientModels/patient.model");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
//
//
//
//
//
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
//
//
//
//
// PATIENT LOGIN
exports.login = async (req, res) => {
    const { patientEmail, patientPassword } = req.body;

    function validatePatientLogin() {
        const validationResults = {
            isValid: true,
            errors: {},
        };

        // Validate email
        const emailValidation = dataValidator.isValidEmail(patientEmail);
        if (!emailValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["patientEmail"] = [emailValidation.message];
        }

        // Validate password
        const passwordValidation = dataValidator.isValidPassword(patientPassword);
        if (!passwordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["patientPassword"] = [passwordValidation.message];
        }

        return validationResults;
    }

    const validationResults = validatePatientLogin();
    if (!validationResults.isValid) {
        return res.status(400).json({
            status: "failed",
            message: "Validation failed",
            results: validationResults.errors
        });
    }

    try {
        const patient = await Patient.login(patientEmail, patientPassword);

        const token = jwt.sign(
            {
                patientId: patient.patientId,
                patientEmail: patient.patientEmail,
            },
            process.env.JWT_SECRET_KEY_PATIENT,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: { token, patient },
        });
    } catch (error) {
        console.error("Error during patient login:", error);

        if (error.message === "Patient not found" || error.message === "Wrong password") {
            return res.status(422).json({
                status: "failed",
                message: "Login failed",
                error: error.message
            });
        }

        return res.status(500).json({
            status: "failed",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
// PATIENT CHANGE PASSWORD
// PATIENT CHANGE PASSWORD
exports.changePassword = async (req, res) => {
    const token = req.headers.token;
    const { patientId, oldPassword, newPassword } = req.body;

    // Check if token is missing
    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    // Check if patientId is missing
    if (!patientId) {
        return res.status(401).json({
            status: "failed",
            message: "Patient ID is missing"
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET_KEY_PATIENT,
        async (err, decoded) => {
            if (err) {
                if (err.name === "JsonWebTokenError") {
                    return res.status(403).json({
                        status: "failed",
                        message: "Invalid token"
                    });
                } else if (err.name === "TokenExpiredError") {
                    return res.status(403).json({
                        status: "failed",
                        message: "Token has expired"
                    });
                }
                return res.status(403).json({
                    status: "failed",
                    message: "Unauthorized access"
                });
            }

            if (decoded.patientId != patientId) {
                return res.status(403).json({
                    status: "failed",
                    message: "Unauthorized access"
                });
            }

            try {
                function validatePatientChangePassword() {
                    const validationResults = {
                        isValid: true,
                        errors: {},
                    };

                    // Validate old password
                    const passwordValidation = dataValidator.isValidPassword(oldPassword);
                    if (!passwordValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors["oldPassword"] = [passwordValidation.message];
                    }

                    // Validate new password
                    const newPasswordValidation = dataValidator.isValidPassword(newPassword);
                    if (!newPasswordValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors["newPassword"] = [newPasswordValidation.message];
                    }

                    return validationResults;
                }

                const validationResults = validatePatientChangePassword();
                if (!validationResults.isValid) {
                    return res.status(400).json({
                        status: "failed",
                        message: "Validation failed",
                        results: validationResults.errors
                    });
                }

                await Patient.changePassword(patientId, oldPassword, newPassword);
                return res.status(200).json({
                    status: "success",
                    message: "Password changed successfully"
                });
            } catch (error) {
                if (
                    error.message === "Patient not found" ||
                    error.message === "Incorrect old password"
                ) {
                    return res.status(422).json({
                        status: "failed",
                        message: "Password change failed",
                        error: error.message
                    });
                } else {
                    console.error("Error changing patient password:", error);
                    return res.status(500).json({
                        status: "failed",
                        message: "Internal server error",
                        error: error.message
                    });
                }
            }
        }
    );
};


//
//
//
//
//
// PATIENT CHANGE ID PROOF IMAGE
exports.changeIdProofImage = async (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET_KEY_PATIENT,
        async (err, decoded) => {
            if (err) {
                if (err.name === "JsonWebTokenError") {
                    return res.status(403).json({
                        status: "failed",
                        message: "Invalid token"
                    });
                } else if (err.name === "TokenExpiredError") {
                    return res.status(403).json({
                        status: "failed",
                        message: "Token has expired"
                    });
                }
                return res.status(403).json({
                    status: "failed",
                    message: "Unauthorized access"
                });
            }

            const uploadIdProofImage = multer({
                storage: multer.memoryStorage(),
            }).single("patientIdProofImage");

            uploadIdProofImage(req, res, async (err) => {
                if (err || !req.file) {
                    return res.status(400).json({
                        status: "error",
                        message: "File upload failed",
                        results: err ? err.message : "File is required.",
                    });
                }

                const { patientId } = req.body;

                if (!patientId) {
                    // Delete the uploaded file
                    fs.unlinkSync(req.file.path);
                    return res.status(401).json({
                        status: "failed",
                        message: "Patient ID is missing",
                    });
                }

                if (decoded.patientId != patientId) {
                    // Delete the uploaded file
                    fs.unlinkSync(req.file.path);
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                function validateIdProofImage(file) {
                    const validationResults = {
                        isValid: true,
                        errors: {},
                    };

                    const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);
                    if (!imageValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors["patientIdProofImage"] = [imageValidation.message];
                    }

                    return validationResults;
                }

                const validationResults = validateIdProofImage(req.file);
                if (!validationResults.isValid) {
                    // Delete the uploaded file
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({
                        status: "error",
                        message: "Invalid image file",
                        results: validationResults.errors,
                    });
                }

                async function uploadFileToS3(file) {
                    const fileName = `patientIdProof-${Date.now()}${path.extname(file.originalname)}`;
                    const uploadParams = {
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: `patientImages/${fileName}`,
                        Body: file.buffer,
                        ACL: "public-read",
                        ContentType: file.mimetype,
                    };

                    const command = new PutObjectCommand(uploadParams);
                    const result = await s3Client.send(command);
                    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
                }

                try {
                    const idProofFileLocation = await uploadFileToS3(req.file);

                    await Patient.changeIdProofImage(
                        patientId,
                        idProofFileLocation
                    );
                    return res.status(200).json({
                        status: "success",
                        message: "ID proof image updated successfully",
                    });
                } catch (error) {
                    // Delete the uploaded image from S3
                    const key = idProofFileLocation.split('/').pop(); // Extracting the filename from the URL
                    const params = {
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: `patientImages/${key}` // Constructing the full key
                    };
                    await s3Client.send(new DeleteObjectCommand(params));

                    // Delete the uploaded file
                    fs.unlinkSync(req.file.path);

                    if (error.message === "Patient not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    } else {
                        console.error("Error updating ID proof image:", error);
                        return res.status(500).json({
                            status: "error",
                            message: "Failed to update ID proof image",
                            error: error.message,
                        });
                    }
                }
            });
        }
    );
};
//
//
//
//
//
// PATIENT CHANGE PROFILE IMAGE
exports.changeProfileImage = async (req, res) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET_KEY_PATIENT,
        async (err, decoded) => {
            if (err) {
                if (err.name === "JsonWebTokenError") {
                    return res.status(403).json({
                        status: "failed",
                        message: "Invalid token"
                    });
                } else if (err.name === "TokenExpiredError") {
                    return res.status(403).json({
                        status: "failed",
                        message: "Token has expired"
                    });
                }
                return res.status(403).json({
                    status: "failed",
                    message: "Unauthorized access"
                });
            }

            const uploadProfileImage = multer({
                storage: multer.memoryStorage(),
            }).single("patientProfileImage");

            uploadProfileImage(req, res, async (err) => {
                if (err || !req.file) {
                    return res.status(400).json({
                        status: "error",
                        message: "File upload failed",
                        results: err ? err.message : "File is required.",
                    });
                }

                const { patientId } = req.body;

                // Check if patientId is missing
                if (!patientId) {
                    return res.status(401).json({
                        status: "failed",
                        message: "Patient ID is missing"
                    });
                }

                if (decoded.patientId != patientId) {
                    // Delete the uploaded file
                    fs.unlinkSync(req.file.path);
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                function validateProfileImage(file) {
                    const validationResults = {
                        isValid: true,
                        errors: {},
                    };

                    const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);
                    if (!imageValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors["patientProfileImage"] = [imageValidation.message];
                    }

                    return validationResults;
                }

                const validationResults = validateProfileImage(req.file);
                if (!validationResults.isValid) {
                    // Delete the uploaded file
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({
                        status: "error",
                        message: "Invalid image file",
                        results: validationResults.errors,
                    });
                }

                async function uploadFileToS3(file) {
                    const fileName = `patientProfile-${Date.now()}${path.extname(file.originalname)}`;
                    const uploadParams = {
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: `patientImages/${fileName}`,
                        Body: file.buffer,
                        ACL: "public-read",
                        ContentType: file.mimetype,
                    };

                    const command = new PutObjectCommand(uploadParams);
                    const result = await s3Client.send(command);
                    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
                }

                try {
                    const profileFileLocation = await uploadFileToS3(req.file);

                    await Patient.changeProfileImage(
                        patientId,
                        profileFileLocation
                    );
                    return res.status(200).json({
                        status: "success",
                        message: "Profile image updated successfully",
                    });
                } catch (error) {
                    // Delete the uploaded image from S3
                    const key = profileFileLocation.split('/').pop(); // Extracting the filename from the URL
                    const params = {
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: `patientImages/${key}` // Constructing the full key
                    };
                    await s3Client.send(new DeleteObjectCommand(params));

                    // Delete the uploaded file
                    fs.unlinkSync(req.file.path);

                    if (error.message === "Patient not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    } else {
                        console.error("Error updating profile image:", error);
                        return res.status(500).json({
                            status: "error",
                            message: "Failed to update profile image",
                            error: error.message,
                        });
                    }
                }
            });
        }
    );
};
//
//
//
//
//
// PATIENT VIEW PROFILE
exports.viewProfile = async (req, res) => {
    try {
        const token = req.headers.token;
        const { patientId } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(403).json({
                status: "failed",
                message: "Token is missing"
            });
        }

        // Check if patientId is missing
        if (!patientId) {
            return res.status(401).json({
                status: "failed",
                message: "Patient ID is missing"
            });
        }

        // Verify the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(401).json({
                            status: "error",
                            message: "Invalid token",
                            error: "Token verification failed"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(401).json({
                            status: "error",
                            message: "Token has expired"
                        });
                    } else {
                        console.error("Error during profile image change:", err);
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Fetch patient profile data
                try {
                    const patientProfileData = await Patient.viewProfile(
                        patientId
                    );
                    return res.status(200).json({
                        status: "success",
                        message: "Patient profile retrieved successfully",
                        data: patientProfileData
                    });
                } catch (error) {
                    if (error.message === "Patient not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    } else {
                        console.error("Error fetching patient profile:", error);
                        return res.status(500).json({
                            status: "error",
                            message: "Internal server error",
                            details: error.message
                        });
                    }
                }
            }
        );
    } catch (error) {
        console.error("Error fetching patient profile:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            details: error.message
        });
    }
};
//
//
//
// PATIENT VIEW HOSPITAL PROFILE
exports.viewHospitalProfile = async (req, res) => {
    try {
        const token = req.headers.token;
        const { patientId } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(403).json({
                status: "failed",
                message: "Token is missing"
            });
        }

        // Check if patientId is missing
        if (!patientId) {
            return res.status(401).json({
                status: "failed",
                message: "Patient ID is missing"
            });
        }

        // Verify the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "error",
                            message: "Invalid token",
                            error: "Token verification failed"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "error",
                            message: "Token has expired"
                        });
                    } else {
                        console.error("Error during profile image change:", err);
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Fetch hospital profile data
                try {
                    const hospitalProfileData = await Patient.viewHospitalProfile(
                        patientId
                    );
                    return res.status(200).json({
                        status: "success",
                        message: "Hospital profile retrieved successfully",
                        data: hospitalProfileData
                    });
                } catch (error) {
                    if (error.message === "Patient not found" || error.message === "Hospital not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }
                    console.error("Error fetching hospital profile:", error);
                    return res.status(500).json({
                        status: "error",
                        message: "Internal server error",
                        details: error.message
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error fetching hospital profile:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            details: error.message
        });
    }
};
//
//
//
//
// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const token = req.headers.token;
        const {
            patientId,
            patientName,
            patientMobile,
            patientAddress,
            patientAadhar,
        } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(401).json({
                status: "failed",
                message: "Token is missing"
            });
        }

        // Check if patientId is missing
        if (!patientId) {
            return res.status(401).json({
                status: "failed",
                message: "Patient ID is missing"
            });
        }

        // Verify the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(401).json({
                            status: "error",
                            message: "Invalid token",
                            error: "Token verification failed"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(401).json({
                            status: "error",
                            message: "Token has expired"
                        });
                    } else {
                        console.error("Error during profile image change:", err);
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Clean Aadhar and mobile data
                const cleanedAadhar = patientAadhar.replace(/\s/g, '');
                const cleanedMobile = patientMobile.replace(/\s/g, '');

                // Validate patient profile update data
                function validatePatientUpdateProfile() {
                    const validationResults = {
                        isValid: true,
                        errors: {}
                    };

                    const nameValidation = dataValidator.isValidName(patientName);
                    if (!nameValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors["patientName"] =
                            [nameValidation.message];
                    }

                    const aadharValidation = dataValidator.isValidAadharNumber(cleanedAadhar);
                    if (!aadharValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors["patientAadhar"] =
                            [aadharValidation.message];
                    }

                    const mobileValidation = dataValidator.isValidMobileNumber(cleanedMobile);
                    if (!mobileValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors["patientMobile"] =
                            [mobileValidation.message];
                    }

                    const addressValidation = dataValidator.isValidAddress(
                        patientAddress
                    );
                    if (!addressValidation.isValid) {
                        validationResults.isValid = false;
                        validationResults.errors["patientAddress"] =
                            [addressValidation.message];
                    }

                    return validationResults;
                }

                const validationResults = validatePatientUpdateProfile();

                if (!validationResults.isValid) {
                    return res.status(400).json({
                        status: "failed",
                        message: "Validation failed",
                        results: validationResults.errors,
                    });
                }

                // Update patient profile
                try {
                    const updatedPatient = {
                        patientId,
                        patientName,
                        patientMobile: cleanedMobile,
                        patientAddress,
                        patientAadhar: cleanedAadhar,
                    };
                    const data = await Patient.updateProfile(updatedPatient);

                    return res.status(200).json({
                        status: "success",
                        message: "Patient profile updated successfully",
                        data,
                    });
                } catch (error) {
                    if (error.message === "Patient not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message,
                        });
                    } else if (error.message === "Aadhar Number Already Exists.") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message,
                        });
                    } else {
                        console.error("Error updating patient profile:", error);
                        return res.status(500).json({
                            status: "error",
                            message: "Internal server error",
                            error: error.message,
                        });
                    }
                }
            }
        );
    } catch (error) {
        console.error("Error during token verification:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
//
// PATIENT VIEW ALL NEWS
exports.viewAllNews = async (req, res) => {
    try {
        const token = req.headers.token;
        const { patientId } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(403).json({
                status: "failed",
                message: "Token is missing"
            });
        }

        // Check if patientId is missing
        if (!patientId) {
            return res.status(401).json({
                status: "failed",
                message: "Patient ID is missing"
            });
        }

        // Verifying the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_HOSPITAL,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "error",
                            message: "Invalid token"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "error",
                            message: "Token has expired"
                        });
                    } else {
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                try {
                    // Check if decoded token matches patientId from request body
                    if (decoded.patientId != patientId) {
                        return res.status(403).json({
                            status: "error",
                            message: "Unauthorized access"
                        });
                    }

                    const allNewsData = await Patient.viewAllNews(patientId); // Using the viewAllNews method from the model
                    return res.status(200).json({
                        status: "success",
                        message: "All hospital news retrieved successfully",
                        data: allNewsData,
                    });
                } catch (error) {
                    console.error("Error viewing all hospital news:", error);

                    if (error.message === "Patient not found" || error.message === "Hospital not found or inactive") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }

                    return res.status(500).json({
                        status: "error",
                        message: "Internal server error",
                        error: error.message,
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error during viewAllHospitalNews:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
// PATIENT VIEW ONE NEWS
exports.viewOneNews = async (req, res) => {
    try {
        const token = req.headers.token;
        const { patientId, hospitalNewsId } = req.body;

        // Check if token is missing
        if (!token) {
            return res.status(403).json({
                status: "failed",
                message: "Token is missing"
            });
        }

        // Check if patientId is missing
        if (!patientId) {
            return res.status(401).json({
                status: "failed",
                message: "Patient ID is missing"
            });
        }

        // Check if hospitalNewsId is missing
        if (!hospitalNewsId) {
            return res.status(401).json({
                status: "failed",
                message: "Hospital News ID is missing"
            });
        }

        // Verifying the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_HOSPITAL,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "error",
                            message: "Invalid token"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "error",
                            message: "Token has expired"
                        });
                    } else {
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                try {
                    // Check if decoded token matches patientId from request body
                    if (decoded.patientId != patientId) {
                        return res.status(403).json({
                            status: "error",
                            message: "Unauthorized access"
                        });
                    }

                    const newsItemData = await Patient.viewOneNews(
                        hospitalNewsId,
                        patientId
                    );
                    return res.status(200).json({
                        status: "success",
                        message: "Hospital news retrieved successfully",
                        data: newsItemData,
                    });
                } catch (error) {
                    console.error("Error viewing one hospital news:", error);
                    if (
                        error.message === "Hospital news not found" ||
                        error.message === "Hospital not found" ||
                        error.message === "Patient not found"
                    ) {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    } else {
                        return res.status(500).json({
                            status: "error",
                            message: "Internal server error",
                            error: error.message,
                        });
                    }
                }
            }
        );
    } catch (error) {
        console.error("Error during viewOneHospitalNews:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
// PATIENT VIEW ALL INSURANCE PROVIDERS
exports.viewAllInsuranceProviders = async (req, res) => {
    const token = req.headers.token;
    const { patientId } = req.body;

    // Check if token is missing
    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    // Check if patientId is missing
    if (!patientId) {
        return res.status(401).json({
            status: "failed",
            message: "Patient ID is missing"
        });
    }

    try {
        // Verifying the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Invalid token"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Token has expired"
                        });
                    } else {
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Token is valid, proceed to fetch all insurance providers
                try {
                    const allInsuranceProviders = await Patient.viewAllInsuranceProviders(patientId);
                    return res.status(200).json({
                        status: "success",
                        message: "All Insurance Providers retrieved successfully",
                        data: allInsuranceProviders,
                    });
                } catch (error) {
                    console.error("Error viewing all insurance providers:", error);
                    if (error.message === "Patient not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }
                    return res.status(500).json({
                        status: "error",
                        message: "Internal server error",
                        error: error.message,
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
//
// PATIENT VIEW ONE INSURANCE PROVIDER
exports.viewOneInsuranceProvider = async (req, res) => {
    const token = req.headers.token;
    const { patientId, insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    // Check if patientId is missing
    if (!patientId) {
        return res.status(401).json({
            status: "failed",
            message: "Patient ID is missing"
        });
    }

    // Check if insuranceProviderId is missing
    if (!insuranceProviderId) {
        return res.status(401).json({
            status: "failed",
            message: "Insurance Provider ID is missing"
        });
    }

    try {
        // Verifying the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Invalid token"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Token has expired"
                        });
                    } else {
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Token is valid, proceed to view insurance provider
                try {
                    const insuranceProvider = await Patient.viewOneInsuranceProvider(patientId, insuranceProviderId); // Pass insuranceProviderId to the model method
                    return res.status(200).json({
                        status: "success",
                        message: "Insurance Provider retrieved successfully",
                        data: insuranceProvider,
                    });
                } catch (error) {
                    console.error("Error viewing insurance provider:", error);
                    if (error.message === "Insurance provider not found for this patient") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }
                    if (error.message === "Patient not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }
                    return res.status(500).json({
                        status: "error",
                        message: "Internal server error",
                        error: error.message,
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
//
// PATIENT VIEW ALL INSURANCE PACKAGES
exports.viewAllInsurancePackages = async (req, res) => {
    const token = req.headers.token;
    const { patientId } = req.body;

    // Check if token is missing
    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    // Check if patientId is missing
    if (!patientId) {
        return res.status(401).json({
            status: "failed",
            message: "Patient ID is missing"
        });
    }

    try {
        // Verifying the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Invalid token"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Token has expired"
                        });
                    } else {
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Token is valid, proceed to fetch all insurance packages
                try {
                    const allInsurancePackages = await Patient.viewAllInsurancePackages(patientId);
                    return res.status(200).json({
                        status: "success",
                        message: "All Insurance Packages retrieved successfully",
                        data: allInsurancePackages,
                    });
                } catch (error) {
                    console.error("Error viewing all insurance packages:", error);
                    if (error.message === "Patient not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }
                    return res.status(500).json({
                        status: "error",
                        message: "Internal server error",
                        error: error.message,
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
// PATIENT VIEW ALL INSURACE PACKAGES OF ONE PROVIDER
exports.viewAllInsurancePackagesOfOneProvider = async (req, res) => {
    const token = req.headers.token;
    const { patientId, insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    // Check if patientId is missing
    if (!patientId) {
        return res.status(401).json({
            status: "failed",
            message: "Patient ID is missing"
        });
    }

    // Check if insuranceProviderId is missing
    if (!insuranceProviderId) {
        return res.status(401).json({
            status: "failed",
            message: "Insurance Provider ID is missing"
        });
    }

    try {
        // Verifying the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Invalid token"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Token has expired"
                        });
                    } else {
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Token is valid, proceed to fetch all insurance packages for the provider
                try {
                    const allInsurancePackages = await Patient.viewAllInsurancePackagesOfOneProvider(patientId, insuranceProviderId);
                    return res.status(200).json({
                        status: "success",
                        message: "All Insurance Packages of Provider retrieved successfully",
                        data: allInsurancePackages,
                    });
                } catch (error) {
                    console.error("Error viewing all insurance packages of provider:", error);
                    if (error.message === "Patient not found" || error.message === "Insurance provider not found or not approved in this hospital") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }
                    return res.status(500).json({
                        status: "error",
                        message: "Internal server error",
                        error: error.message,
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
// PATIENT VIEW ONE INSURANCE PACKAGE OF ONE PROVIDER
exports.viewOneInsurancePackage = async (req, res) => {
    const token = req.headers.token;
    const { patientId, insurancePackageId } = req.body;

    // Check if token is missing
    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    // Check if patientId is missing
    if (!patientId) {
        return res.status(401).json({
            status: "failed",
            message: "Patient ID is missing"
        });
    }

    // Check if insurancePackageId is missing
    if (!insurancePackageId) {
        return res.status(401).json({
            status: "failed",
            message: "Insurance Package ID is missing"
        });
    }

    try {
        // Verifying the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Invalid token"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Token has expired"
                        });
                    } else {
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Token is valid, proceed to fetch the insurance package
                try {
                    const insurancePackage = await Patient.viewOneInsurancePackage(patientId, insurancePackageId);
                    return res.status(200).json({
                        status: "success",
                        message: "Insurance Package retrieved successfully",
                        data: insurancePackage,
                    });
                } catch (error) {
                    console.error("Error viewing insurance package:", error);
                    if (error.message === "Patient not found" || error.message === "Insurance package not found") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }
                    return res.status(500).json({
                        status: "error",
                        message: "Internal server error",
                        error: error.message,
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
// PATIENT CHOOSE ONE INSURANCE PACKAGE
exports.chooseOneInsurancePackage = async (req, res) => {
    const token = req.headers.token;
    const { patientId, packageId } = req.body;

    // Check if token is missing
    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    // Check if patientId is missing
    if (!patientId) {
        return res.status(401).json({
            status: "failed",
            message: "Patient ID is missing"
        });
    }

    // Check if packageId is missing
    if (!packageId) {
        return res.status(401).json({
            status: "failed",
            message: "Package ID is missing"
        });
    }

    try {
        // Verifying the token
        jwt.verify(
            token,
            process.env.JWT_SECRET_KEY_PATIENT,
            async (err, decoded) => {
                if (err) {
                    if (err.name === "JsonWebTokenError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Invalid token"
                        });
                    } else if (err.name === "TokenExpiredError") {
                        return res.status(403).json({
                            status: "failed",
                            message: "Token has expired"
                        });
                    } else {
                        return res.status(403).json({
                            status: "failed",
                            message: "Unauthorized access"
                        });
                    }
                }

                // Check if decoded token matches patientId from request body
                if (decoded.patientId != patientId) {
                    return res.status(403).json({
                        status: "failed",
                        message: "Unauthorized access"
                    });
                }

                // Token is valid, proceed to choose insurance package
                try {
                    const clientDetails = await Patient.chooseOneInsurancePackage(patientId, packageId);
                    return res.status(200).json({
                        status: "success",
                        message: "Insurance Package chosen successfully",
                        data: clientDetails,
                    });
                } catch (error) {
                    console.error("Error choosing insurance package:", error);
                    if (error.message === "Patient not found" || error.message === "Insurance package not found for this hospital") {
                        return res.status(422).json({
                            status: "error",
                            error: error.message
                        });
                    }
                    return res.status(500).json({
                        status: "error",
                        message: "Internal server error",
                        error: error.message,
                    });
                }
            }
        );
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
        });
    }
};
//
//
//
//
// PATIENT SEARCH INSURANCE PROVIDERS
exports.searchInsuranceProviders = async (req, res) => {
    const token = req.headers.token;
    const { patientId, searchQuery } = req.body;

    // Check if token is missing
    if (!token) {
        return res.status(403).json({
            status: "failed",
            message: "Token is missing"
        });
    }

    // Check if patientId is missing
    if (!patientId) {
        return res.status(401).json({
            status: "failed",
            message: "Patient ID is missing"
        });
    }

    // Check if searchQuery is missing or empty
    if (!searchQuery || searchQuery.trim() === "") {
        return res.status(400).json({
            status: "error",
            message: "Search query cannot be empty"
        });
    }

    // Verifying the token
    jwt.verify(token, process.env.JWT_SECRET_KEY_PATIENT, async (err, decoded) => {
        if (err) {
            if (err.name === "JsonWebTokenError") {
                return res.status(403).json({
                    status: "error",
                    message: "Invalid or missing token"
                });
            } else if (err.name === "TokenExpiredError") {
                return res.status(403).json({
                    status: "error",
                    message: "Token has expired"
                });
            } else {
                return res.status(403).json({
                    status: "failed",
                    message: "Unauthorized access"
                });
            }
        }

        if (decoded.patientId != patientId) {
            return res.status(403).json({
                status: "failed",
                message: "Unauthorized access"
            });
        }

        // Token is valid, proceed to search insurance providers
        try {
            const searchResult = await Patient.searchInsuranceProviders(patientId, searchQuery);

            return res.status(200).json({
                status: "success",
                message: "Insurance Providers found successfully",
                data: searchResult,
            });
        } catch (error) {
            console.error("Error searching insurance providers:", error);

            if (error.message === "Patient not found or not active") {
                return res.status(422).json({
                    status: "error",
                    error: error.message
                });
            } else if (error.message === "No insurance providers found matching the criteria") {
                return res.status(404).json({
                    status: "failed",
                    message: error.message
                });
            }

            return res.status(500).json({
                status: "error",
                message: "Internal server error",
                error: error.message,
            });
        }
    });
};
//
//
//
//
// PATIENT REVIEW ONE INSURANCE PROVIDER
exports.reviewOneInsuranceProvider = async (req, res) => {
    try {
        const token = req.headers.token;
        const { hospitalId, patientId, insuranceProviderId, reviewContent } = req.body;

        // Check if token is provided
        if (!token) {
            return res.status(403).json({
                status: "error",
                message: "Token is missing"
            });
        }

        // Check if hospitalId is provided
        if (!hospitalId) {
            return res.status(401).json({
                status: "error",
                message: "Hospital ID is missing"
            });
        }

        // Check if patientId is provided
        if (!patientId) {
            return res.status(401).json({
                status: "error",
                message: "Patient ID is missing"
            });
        }

        // Check if insuranceProviderId is provided
        if (!insuranceProviderId) {
            return res.status(401).json({
                status: "error",
                message: "Insurance Provider ID is missing"
            });
        }

        // Token verification
        jwt.verify(token, process.env.JWT_SECRET_KEY_PATIENT, async (err, decoded) => {
            if (err) {
                if (err.name === "JsonWebTokenError") {
                    return res.status(403).json({
                        status: "error",
                        message: "Invalid or missing token"
                    });
                } else if (err.name === "TokenExpiredError") {
                    return res.status(403).json({
                        status: "error",
                        message: "Token has expired"
                    });
                } else {
                    return res.status(403).json({
                        status: "error",
                        message: "Unauthorized access"
                    });
                }
            }

            // Check if the decoded hospitalId matches the provided hospitalId
            if (decoded.hospitalId != hospitalId) {
                return res.status(403).json({
                    status: "error",
                    message: "Unauthorized access"
                });
            }

            // Function to validate review content
            function validateReviewContent(reviewContent) {
                const validationResults = {
                    isValid: true,
                    errors: {},
                };

                // Your validation logic here
                const reviewValidation = dataValidator.isValidText(reviewContent);
                if (!reviewValidation.isValid) {
                    validationResults.isValid = false;
                    validationResults.errors["reviewContent"] = [reviewValidation.message];
                }

                return validationResults;
            }

            // Validate review content
            const validationResults = validateReviewContent(reviewContent);

            // If validation fails, return error response
            if (!validationResults.isValid) {
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: validationResults.errors
                });
            }

            try {
                // Call the reviewOneInsuranceProvider method from the Patient model
                const reviewDetails = await Patient.reviewOneInsuranceProvider(hospitalId, insuranceProviderId, patientId, reviewContent);

                // Return success response
                return res.status(200).json({
                    status: "success",
                    message: "Review submitted successfully",
                    data: reviewDetails
                });
            } catch (error) {
                // Handle errors
                console.error("Error submitting review by patient:", error);

                // Return appropriate error response
                if (error.message === "Hospital not found" || error.message === "Insurance Provider not found or not active in this hospital" || error.message === "Patient not found or not active in this hospital") {
                    return res.status(422).json({
                        status: "error",
                        error: error.message
                    });
                }

                return res.status(500).json({
                    status: "error",
                    message: "Internal server error",
                    error: error.message
                });
            }
        });
    } catch (error) {
        // Handle unexpected errors
        console.error("Error in reviewOneInsuranceProvider controller:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message
        });
    }
};
//
//
//
//
//


