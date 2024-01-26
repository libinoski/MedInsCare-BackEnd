// hospital.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Hospital, HospitalStaff } = require('../../models/HospitalModels/hospital.model');
const Validator = require('../../config/data.validate');
const bcrypt = require('bcrypt');
const fs = require('fs');



// Hospital Registration
exports.hospitalRegister = async (req, res) => {
  try {
    const hospitalImageStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'Files/HospitalImages');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });

    const hospitalImageUpload = multer({ storage: hospitalImageStorage }).single('hospitalImage');

    hospitalImageUpload(req, res, async function (uploadError) {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No hospital image uploaded',
        });
      }
      if (uploadError) {
        const imagePath = req.file.path;
        fs.unlinkSync(imagePath);

        return res.status(400).json({
          status: 'error',
          message: 'Error uploading hospital image',
          error: uploadError.message,
        });
      }

      const {
        hospitalName,
        hospitalEmail,
        hospitalWebSite,
        hospitalAadhar,
        hospitalMobile,
        hospitalAddress,
        hospitalPassword,
      } = req.body;

      const hospitalNameValidation = Validator.isValidName(hospitalName);
      const hospitalEmailValidation = Validator.isValidEmail(hospitalEmail);
      const hospitalWebSiteValidation = Validator.isValidWebsite(hospitalWebSite);
      const hospitalAadharValidation = Validator.isValidAadharNumber(hospitalAadhar);
      const hospitalMobileValidation = Validator.isValidMobileNumber(hospitalMobile);
      const hospitalAddressValidation = Validator.isValidAddress(hospitalAddress);
      const hospitalImageValidation = Validator.isValidImageWith1MBConstraint(req.file);
      const hospitalPasswordValidation = Validator.isValidPassword(hospitalPassword);

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
        const imagePath = req.file.path;
        fs.unlinkSync(imagePath);

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      try {
        const newHospital = new Hospital({
          hospitalName,
          hospitalEmail,
          hospitalWebSite,
          hospitalAadhar,
          hospitalMobile,
          hospitalAddress,
          hospitalImage: req.file.filename,
          hospitalPassword,
          registeredDate: new Date(),
          isActive: 1,
          deleteStatus: 0,
          updateStatus: 0,
          passwordUpdatedStatus: 0,
          updatedDate: null,
        });

        Hospital.register(newHospital, (error, result) => {
          if (error) {
            const imagePath = req.file.path;
            fs.unlinkSync(imagePath);

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
        const imagePath = req.file.path;
        fs.unlinkSync(imagePath);

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


//Hospital Login
exports.hospitalLogin = (req, res) => {
  const { hospitalEmail, hospitalPassword } = req.body;
  const emailValidation = Validator.isValidEmail(hospitalEmail);
  const passwordValidation = Validator.isValidPassword(hospitalPassword);

  const validationErrors = {};
  if (!emailValidation.isValid) validationErrors.hospitalEmail = emailValidation.message;
  if (!passwordValidation.isValid) validationErrors.hospitalPassword = passwordValidation.message;

  Hospital.login(hospitalEmail, hospitalPassword, (err, hospital) => {
    if (err) {
      return res.status(401).json({ status: 'Login failed', data: err });
    }
    const token = jwt.sign(
      { hospitalId: hospital.hospitalId, hospitalEmail: hospital.hospitalEmail },
      'micadmin', //secret key
      { expiresIn: '1h' }
    );

    return res.status(200).json({ status: 'Login successful', data: { token, hospital } });
  });
};


// Hospital View Profile
exports.getHospitalProfile = (req, res) => {
  const { hospitalId } = req.body;

  if (!hospitalId) {
    return res.status(400).json({
      status: 'error',
      message: 'Hospital ID is required in the request body',
    });
  }

  jwt.verify(req.headers.token, 'micadmin', (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    }

    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to the hospital profile',
      });
    }

    Hospital.getProfile(hospitalId, (error, result) => {
      if (error) {
        return res.status(404).json({
          status: 'error',
          message: error,
        });
      }

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    });
  });
};


// Hospital update Profile
exports.hospitalUpdateProfile = (req, res) => {
  const updateProfileToken = req.headers.token;

  if (!updateProfileToken) {
    return res.status(401).json({ status: "Token missing" });
  }

  jwt.verify(updateProfileToken, "micadmin", (err, decoded) => {
    if (err) {
      return res.status(401).json({ status: "Invalid token" });
    }

    const {
      hospitalId,
      hospitalName,
      hospitalWebSite,
      hospitalAadhar,
      hospitalMobile,
      hospitalAddress,
    } = req.body;

    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized access to edit the hospital profile",
      });
    }
    const hospitalIdValidation = Validator.isValidId(hospitalId);
    const hospitalNameValidation = Validator.isValidName(hospitalName);
    const hospitalWebSiteValidation = Validator.isValidWebsite(hospitalWebSite);
    const hospitalAadharValidation = Validator.isValidAadharNumber(hospitalAadhar);
    const hospitalMobileValidation = Validator.isValidMobileNumber(hospitalMobile);
    const hospitalAddressValidation = Validator.isValidAddress(hospitalAddress);

    const validationErrors = {};

    if (!hospitalIdValidation.isValid) validationErrors.hospitalId = hospitalIdValidation.message;
    if (!hospitalNameValidation.isValid) validationErrors.hospitalName = hospitalNameValidation.message;
    if (!hospitalWebSiteValidation.isValid) validationErrors.hospitalWebSite = hospitalWebSiteValidation.message;
    if (!hospitalAadharValidation.isValid) validationErrors.hospitalAadhar = hospitalAadharValidation.message;
    if (!hospitalMobileValidation.isValid) validationErrors.hospitalMobile = hospitalMobileValidation.message;
    if (!hospitalAddressValidation.isValid) validationErrors.hospitalAddress = hospitalAddressValidation.message;

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ status: "Validation failed", data: validationErrors });
    }

    const updatedHospital = {
      hospitalId,
      hospitalName,
      hospitalWebSite,
      hospitalAadhar,
      hospitalMobile,
      hospitalAddress,
    };

    Hospital.updateProfile(updatedHospital, (err, data) => {
      if (err) {
        if (err === "Hospital not found" || err === "Aadhar Number Already Exists.") {
          return res.status(404).json({ status: err });
        } else {
          return res.status(500).json({
            status: "Failed to edit hospital profile",
            error: err,
          });
        }
      } else {
        return res.status(200).json({ status: "success",message: "Hospital updated successfully", data });
      }
    });
  });
};


// Add Hospital Staff
exports.addHospitalStaff = (req, res) => {
  const updateProfileToken = req.headers.token;

  if (!updateProfileToken) {
    return res.status(401).json({ "status": "Token missing" });
  }

  jwt.verify(updateProfileToken, "micadmin", (err, decoded) => {
    if (err) {
      return res.status(401).json({ "status": "Invalid token" });
    }

    const hospitalStaffImageStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'Files/HospitalStaffImages');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });

    const hospitalStaffImageUpload = multer({ storage: hospitalStaffImageStorage }).fields([
      { name: 'hospitalStaffProfileImage', maxCount: 1 },
      { name: 'hospitalStaffIdProofImage', maxCount: 1 },
    ]);

    hospitalStaffImageUpload(req, res, async function (uploadError) {
      if (uploadError) {
        return res.status(500).json({ "status": "File upload error", "message": uploadError.message });
      }

      const {
        hospitalId,
        hospitalStaffName,
        hospitalStaffMobile,
        hospitalStaffEmail,
        hospitalStaffAddress,
        hospitalStaffAadhar,
        hospitalStaffPassword,
      } = req.body;

      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized access to add hospital staff',
        });
      }

      const validationErrors = {};

      const hospitalIdValidation = Validator.isValidId(hospitalId);
      const hospitalStaffNameValidation = Validator.isValidName(hospitalStaffName);
      const hospitalStaffMobileValidation = Validator.isValidMobileNumber(hospitalStaffMobile);
      const hospitalStaffEmailValidation = Validator.isValidEmail(hospitalStaffEmail);
      const hospitalStaffAadharValidation = Validator.isValidAadharNumber(hospitalStaffAadhar);
      const hospitalStaffPasswordValidation = Validator.isValidPassword(hospitalStaffPassword);

      // Check if files are present before validating
      if (!req.files || !req.files['hospitalStaffProfileImage'] || req.files['hospitalStaffProfileImage'].length === 0) {
        return res.status(400).json({ "status": "hospitalStaffProfileImage missing", "message": "Hospital staff profile image is required" });
      }

      if (!req.files || !req.files['hospitalStaffIdProofImage'] || req.files['hospitalStaffIdProofImage'].length === 0) {
        return res.status(400).json({ "status": "hospitalStaffIdProofImage missing", "message": "Hospital staff ID proof image is required" });
      }

      const hospitalStaffImageValidation = Validator.isValidImageWith1MBConstraint(req.files['hospitalStaffProfileImage'][0]);
      const hospitalStaffIdProofImageValidation = Validator.isValidImageWith1MBConstraint(req.files['hospitalStaffIdProofImage'][0]);

      if (!hospitalIdValidation.isValid) validationErrors.hospitalId = hospitalIdValidation.message;
      if (!hospitalStaffNameValidation.isValid) validationErrors.hospitalStaffName = hospitalStaffNameValidation.message;
      if (!hospitalStaffMobileValidation.isValid) validationErrors.hospitalStaffMobile = hospitalStaffMobileValidation.message;
      if (!hospitalStaffEmailValidation.isValid) validationErrors.hospitalStaffEmail = hospitalStaffEmailValidation.message;
      if (!hospitalStaffAadharValidation.isValid) validationErrors.hospitalStaffAadhar = hospitalStaffAadharValidation.message;
      if (!hospitalStaffPasswordValidation.isValid) validationErrors.hospitalStaffPassword = hospitalStaffPasswordValidation.message;

      if (!hospitalStaffImageValidation.isValid) {
        return res.status(400).json({
          status: 'error',
          message: hospitalStaffImageValidation.message,
        });
      }

      if (!hospitalStaffIdProofImageValidation.isValid) {
        return res.status(400).json({
          status: 'error',
          message: hospitalStaffIdProofImageValidation.message,
        });
      }

      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({ "status": "Validation failed", "data": validationErrors });
      }

      const hospitalStaffProfileImage = req.files['hospitalStaffProfileImage'][0].filename;
      const hospitalStaffIdProofImage = req.files['hospitalStaffIdProofImage'][0].filename;

      try {
        const newHospitalStaff = new HospitalStaff({
          hospitalId: hospitalId,
          hospitalStaffName: hospitalStaffName,
          hospitalStaffMobile: hospitalStaffMobile,
          hospitalStaffEmail: hospitalStaffEmail,
          hospitalStaffAddress: hospitalStaffAddress,
          hospitalStaffAadhar: hospitalStaffAadhar,
          hospitalStaffPassword: hospitalStaffPassword,
          hospitalStaffProfileImage: hospitalStaffProfileImage,
          hospitalStaffIdProofImage: hospitalStaffIdProofImage,
          addedDate: new Date(),
          updatedDate: null,
          isActive: 1,
          deleteStatus: 0,
          updateStatus: 0,
          passwordUpdateStatus: 0,
        });

        HospitalStaff.addNewOne(newHospitalStaff, (error, result) => {
          if (error) {
            // Handle error and possibly delete uploaded files
            return res.status(500).json({
              status: 'error',
              message: error.message,
            });
          }

          return res.status(200).json({
            status: 'success',
            message: 'Hospital Staff added successfully',
            data: result,
          });
        });
      } catch (error) {
        // Handle error and possibly delete uploaded files
        return res.status(500).json({
          status: 'error',
          message: error.message,
        });
      }
    });
  });
};


// Delete Hospital Staff
exports.deleteHospitalStaff = (req, res) => {
  const { hospitalStaffId, hospitalId } = req.body;

  if (!hospitalStaffId || !hospitalId) {
      return res.status(400).json({
          status: 'error',
          message: 'Both hospitalStaffId and hospitalId are required in the request body',
      });
  }

  const deleteStaffToken = req.headers.token;

  if (!deleteStaffToken) {
      return res.status(401).json({
          status: 'error',
          message: 'Token missing',
      });
  }

  jwt.verify(deleteStaffToken, 'micadmin', (err, decoded) => {
      if (err) {
          return res.status(401).json({
              status: 'error',
              message: 'Invalid token',
          });
      }


      if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
              status: 'error',
              message: 'Unauthorized access to delete hospital staff',
          });
      }

      Hospital.deleteStaff(hospitalStaffId, hospitalId, (deleteErr, deleteRes) => {
          if (deleteErr) {
              return res.status(500).json({
                  status: 'error',
                  message: 'Failed to delete hospital staff',
                  error: deleteErr,
              });
          }

          return res.status(200).json({
              status: 'success',
              message: 'Hospital Staff deleted successfully',
              data: deleteRes,
          });
      });
  });
};



// Update Hospital Staff
exports.updateHospitalStaff = (req, res) => {
  const updateProfileToken = req.headers.token;

  if (!updateProfileToken) {
    return res.status(401).json({ "status": "Token missing" });
  }

  jwt.verify(updateProfileToken, "micadmin", (err, decoded) => {
    if (err) {
      return res.status(401).json({ "status": "Invalid token" });
    }

    const {
      hospitalId,
      hospitalStaffId,
      hospitalStaffName,
      hospitalStaffMobile,
      hospitalStaffAddress,
      hospitalStaffAadhar,
    } = req.body;

    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to update hospital staff',
      });
    }

    const hospitalIdValidation = Validator.isValidId(hospitalId);
    const hospitalStaffIdValidation = Validator.isValidId(hospitalStaffId);
    const hospitalStaffNameValidation = Validator.isValidName(hospitalStaffName);
    const hospitalStaffMobileValidation = Validator.isValidMobileNumber(hospitalStaffMobile);
    const hospitalStaffAddressValidation = Validator.isValidAddress(hospitalStaffAddress);
    const hospitalStaffAadharValidation = Validator.isValidAadharNumber(hospitalStaffAadhar);

    const validationErrors = {};
    if (!hospitalIdValidation.isValid) validationErrors.hospitalId = hospitalIdValidation.message;
    if (!hospitalStaffIdValidation.isValid) validationErrors.hospitalStaffId = hospitalStaffIdValidation.message;
    if (!hospitalStaffNameValidation.isValid) validationErrors.hospitalStaffName = hospitalStaffNameValidation.message;
    if (!hospitalStaffMobileValidation.isValid) validationErrors.hospitalStaffMobile = hospitalStaffMobileValidation.message;
    if (!hospitalStaffAddressValidation.isValid) validationErrors.hospitalStaffAddress = hospitalStaffAddressValidation.message;
    if (!hospitalStaffAadharValidation.isValid) validationErrors.hospitalStaffAadhar = hospitalStaffAadharValidation.message;

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ "status": "Validation failed", "data": validationErrors });
    }

    const updatedHospitalStaff = {
      hospitalId,
      hospitalStaffId,
      hospitalStaffName,
      hospitalStaffMobile,
      hospitalStaffAddress,
      hospitalStaffAadhar,
    };

    Hospital.updateStaff(updatedHospitalStaff, (err, updateResult) => {
      if (err) {
        if (err === "Hospital not found, is not active, or has been deleted" || err === "Hospital Staff not found, is not active, or has been deleted") {
          return res.status(404).json({ status: err });
        } else {
          return res.status(500).json({ status: 'Failed to update hospital staff', error: err });
        }
      } else {
        return res.status(200).json({ status: "success", message: updateResult.message, data: updateResult.updatedData });
      }
    });
  });
};








