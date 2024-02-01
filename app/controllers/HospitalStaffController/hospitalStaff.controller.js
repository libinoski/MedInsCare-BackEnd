// hospital.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const dataValidator = require('../../config/data.validate');
const bcrypt = require('bcrypt');
const fs = require('fs');
const nodemailer = require('nodemailer');
const emailConfig = require('../../config/emailConfig');
const { HospitalStaff } = require('../../models/HospitalStaffModel/hospitalStaff.model');


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



// View Hospital staff Profile
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
  
  

// Update Hospital Staff Profile
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


  


  
  
  