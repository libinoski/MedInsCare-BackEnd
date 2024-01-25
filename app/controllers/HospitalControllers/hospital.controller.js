// hospital.controller.js

const multer = require('multer');
const path = require('path');
const Hospital = require('../../models/HospitalModels/hospital.model');
const Validator = require('../../config/data.validate');
const bcrypt = require('bcrypt');


// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Files/HospitalImages');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });
const uploadMiddleware = upload.single('hospitalImage');


// Hospital Registration
exports.hospitalRegister = async (req, res) => {
    try {
        uploadMiddleware(req, res, async function (uploadError) {
            if (uploadError) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Error uploading hospital image',
                    error: uploadError.message,
                });
            }

            const hospitalNameValidation = Validator.isValidName(req.body.hospitalName);
            const hospitalEmailValidation = Validator.isValidEmail(req.body.hospitalEmail);
            const hospitalWebSiteValidation = Validator.isValidWebsite(req.body.hospitalWebSite);
            const hospitalAadharValidation = Validator.isValidAadharNumber(req.body.hospitalAadhar);
            const hospitalMobileValidation = Validator.isValidMobileNumber(req.body.hospitalMobile);
            const hospitalAddressValidation = Validator.isValidAddress(req.body.hospitalAddress);
            const hospitalImageValidation = Validator.isValidImageWith1MBConstraint(req.file);
            const hospitalPasswordValidation = Validator.isValidPassword(req.body.hospitalPassword);

            const validationErrors = {};

            if (!hospitalNameValidation.isValid) validationErrors.hospitalName = hospitalNameValidation.message;
            if (!hospitalEmailValidation.isValid) validationErrors.hospitalEmail = hospitalEmailValidation.message;
            if (!hospitalWebSiteValidation.isValid) validationErrors.hospitalWebSite = hospitalWebSiteValidation.message;
            if (!hospitalAadharValidation.isValid) validationErrors.hospitalAadhar = hospitalAadharValidation.message;
            if (!hospitalMobileValidation.isValid) validationErrors.hospitalMobile = hospitalMobileValidation.message;
            if (!hospitalAddressValidation.isValid) validationErrors.hospitalAddress = hospitalAddressValidation.message;
            if (!hospitalImageValidation.isValid) validationErrors.hospitalImage = hospitalImageValidation.message;
            if (!hospitalPasswordValidation.isValid) validationErrors.hospitalPassword = hospitalPasswordValidation.message;

            if (Object.keys(validationErrors).length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation failed',
                    errors: validationErrors,
                });
            }

            try {
                const hashedPassword = await bcrypt.hash(req.body.hospitalPassword, 10);

                const newHospital = new Hospital({
                    hospitalName: req.body.hospitalName,
                    hospitalEmail: req.body.hospitalEmail,
                    hospitalWebSite: req.body.hospitalWebSite,
                    hospitalAadhar: req.body.hospitalAadhar,
                    hospitalMobile: req.body.hospitalMobile,
                    hospitalAddress: req.body.hospitalAddress,
                    hospitalImage: req.file.filename,
                    hospitalPassword: hashedPassword,
                    registeredDate: new Date(),
                    isActive: 1,
                    deleteStatus: 0,
                    updateStatus: 0,
                    passwordUpdatedStatus: 0,
                    updatedDate: null,
                });

                Hospital.register(newHospital, (error, result) => {
                    if (error) {
                        if (error === "Hospital email already exists" || error === "Aadhar number already exists") {
                            return res.status(400).json({
                                status: 'Hospital registration failed',
                                message: error,
                            });
                        }

                        return res.status(500).json({
                            status: 'error',
                            message: 'Hospital registration failed',
                            error: error.message,
                        });
                    }

                    return res.status(201).json({
                        status: 'success',
                        data: result,
                    });
                });
            } catch (error) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Internal server error',
                    error: error.message,
                });
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message,
        });
    }
};
