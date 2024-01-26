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
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No hospital image uploaded',
        });
      }

      // Delete the uploaded file if an error occurs
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
        // Delete the uploaded file if validation fails
        const imagePath = req.file.path;
        fs.unlinkSync(imagePath);

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      try {
        // Registration logic
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
            // Handle registration errors
            // (Delete the uploaded file if necessary)
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
        // Handle internal server error
        // (Delete the uploaded file if necessary)
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
    // Handle unexpected errors
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


// Hospital edit profile
exports.hospitalEditProfile = (req, res) => {
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
      hospitalAadhar,
      hospitalMobile,
      hospitalAddress,
      hospitalWebSite
    } = req.body;

    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to edit the hospital profile',
      });
    }

    const validationErrors = {};

    const hospitalNameValidation = Validator.isValidName(hospitalName);
    const hospitalAadharValidation = Validator.isValidAadharNumber(hospitalAadhar);
    const hospitalMobileValidation = Validator.isValidMobileNumber(hospitalMobile);
    const hospitalAddressValidation = Validator.isValidAddress(hospitalAddress);
    const hospitalWebSiteValidation = Validator.isValidWebsite(hospitalWebSite);

    if (!hospitalNameValidation.isValid) validationErrors.hospitalName = hospitalNameValidation.message;
    if (!hospitalAadharValidation.isValid) validationErrors.hospitalAadhar = hospitalAadharValidation.message;
    if (!hospitalMobileValidation.isValid) validationErrors.hospitalMobile = hospitalMobileValidation.message;
    if (!hospitalAddressValidation.isValid) validationErrors.hospitalAddress = hospitalAddressValidation.message;
    if (!hospitalWebSiteValidation.isValid) validationErrors.hospitalWebSite = hospitalWebSiteValidation.message;

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ status: "Validation failed", data: validationErrors });
    }

    const updatedHospital = {
      hospitalId,
      hospitalName,
      hospitalAadhar,
      hospitalMobile,
      hospitalAddress,
      hospitalWebSite,
    };

    Hospital.editProfile(updatedHospital, (err, data) => {
      if (err) {
        if (err === "Hospital Not Found" || err === "Aadhar Number Already Exists.") {
          return res.status(404).json({ status: err });
        } else {
          return res.status(500).json({ status: 'Failed to edit hospital profile', error: err });
        }
      } else {
        return res.status(200).json({ status: "success", data });
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
        if (req.files) {
          const profileImagePath = req.files['hospitalStaffProfileImage'] ? req.files['hospitalStaffProfileImage'][0].path : null;
          const idProofImagePath = req.files['hospitalStaffIdProofImage'] ? req.files['hospitalStaffIdProofImage'][0].path : null;

          if (profileImagePath) {
            fs.unlinkSync(profileImagePath);
          }

          if (idProofImagePath) {
            fs.unlinkSync(idProofImagePath);
          }
        }

        return res.status(500).json({ "status": uploadError.message });
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
        if (req.files) {
          const profileImagePath = req.files['hospitalStaffProfileImage'] ? req.files['hospitalStaffProfileImage'][0].path : null;
          const idProofImagePath = req.files['hospitalStaffIdProofImage'] ? req.files['hospitalStaffIdProofImage'][0].path : null;

          if (profileImagePath) {
            fs.unlinkSync(profileImagePath);
          }

          if (idProofImagePath) {
            fs.unlinkSync(idProofImagePath);
          }
        }

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

      if (!hospitalIdValidation.isValid) validationErrors.hospitalId = hospitalIdValidation.message;
      if (!hospitalStaffNameValidation.isValid) validationErrors.hospitalStaffName = hospitalStaffNameValidation.message;
      if (!hospitalStaffMobileValidation.isValid) validationErrors.hospitalStaffMobile = hospitalStaffMobileValidation.message;
      if (!hospitalStaffEmailValidation.isValid) validationErrors.hospitalStaffEmail = hospitalStaffEmailValidation.message;
      if (!hospitalStaffAadharValidation.isValid) validationErrors.hospitalStaffAadhar = hospitalStaffAadharValidation.message;
      if (!hospitalStaffPasswordValidation.isValid) validationErrors.hospitalStaffPassword = hospitalStaffPasswordValidation.message;

      if (Object.keys(validationErrors).length > 0) {
        if (req.files) {
          const profileImagePath = req.files['hospitalStaffProfileImage'] ? req.files['hospitalStaffProfileImage'][0].path : null;
          const idProofImagePath = req.files['hospitalStaffIdProofImage'] ? req.files['hospitalStaffIdProofImage'][0].path : null;

          if (profileImagePath) {
            fs.unlinkSync(profileImagePath);
          }

          if (idProofImagePath) {
            fs.unlinkSync(idProofImagePath);
          }
        }

        return res.status(400).json({ "status": "Validation failed", "data": validationErrors });
      }

      if (!req.files || !req.files['hospitalStaffProfileImage'] || req.files['hospitalStaffProfileImage'].length === 0 ||
          !req.files['hospitalStaffIdProofImage'] || req.files['hospitalStaffIdProofImage'].length === 0) {
        if (req.files) {
          const profileImagePath = req.files['hospitalStaffProfileImage'] ? req.files['hospitalStaffProfileImage'][0].path : null;
          const idProofImagePath = req.files['hospitalStaffIdProofImage'] ? req.files['hospitalStaffIdProofImage'][0].path : null;

          if (profileImagePath) {
            fs.unlinkSync(profileImagePath);
          }

          if (idProofImagePath) {
            fs.unlinkSync(idProofImagePath);
          }
        }

        return res.status(400).json({ "status": "Image files missing" });
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
            if (req.files) {
              const profileImagePath = req.files['hospitalStaffProfileImage'] ? req.files['hospitalStaffProfileImage'][0].path : null;
              const idProofImagePath = req.files['hospitalStaffIdProofImage'] ? req.files['hospitalStaffIdProofImage'][0].path : null;

              if (profileImagePath) {
                fs.unlinkSync(profileImagePath);
              }

              if (idProofImagePath) {
                fs.unlinkSync(idProofImagePath);
              }
            }

            if (error === "Hospital ID does not exist" || error === "Aadhar already exists" || error === "Email already exists") {
              return res.status(400).json({
                status: 'Hospital staff registration failed',
                message: error,
              });
            }

            return res.status(500).json({
              status: 'error',
              message: 'Hospital staff registration failed',
              error: error.message,
            });
          }

          return res.status(201).json({
            status: 'success',
            data: result,
          });
        });
      } catch (error) {
        if (req.files) {
          const profileImagePath = req.files['hospitalStaffProfileImage'] ? req.files['hospitalStaffProfileImage'][0].path : null;
          const idProofImagePath = req.files['hospitalStaffIdProofImage'] ? req.files['hospitalStaffIdProofImage'][0].path : null;

          if (profileImagePath) {
            fs.unlinkSync(profileImagePath);
          }

          if (idProofImagePath) {
            fs.unlinkSync(idProofImagePath);
          }
        }

        return res.status(500).json({
          status: 'error',
          message: 'Hospital staff registration failed',
          error: error.message,
        });
      }
    });
  });
};


// Delete Hospital Staff 
exports.deleteHospitalStaff = (req, res) => {
  const updateProfileToken = req.headers.token;

  if (!updateProfileToken) {
    return res.status(401).json({ "status": "Token missing" });
  }

  jwt.verify(updateProfileToken, "micadmin", (err, decoded) => {
    if (err) {
      return res.status(401).json({ "status": "Invalid token" });
    }

    const { hospitalId, hospitalStaffId } = req.body;

    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to delete hospital staff',
      });
    }

    const validationErrors = {};

    const hospitalIdValidation = Validator.isValidId(hospitalId);
    const hospitalStaffIdValidation = Validator.isValidId(hospitalStaffId);

    if (!hospitalIdValidation.isValid) validationErrors.hospitalId = hospitalIdValidation.message;
    if (!hospitalStaffIdValidation.isValid) validationErrors.hospitalStaffId = hospitalStaffIdValidation.message;

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ "status": "Validation failed", "data": validationErrors });
    }

    Hospital.deleteStaff(hospitalId, hospitalStaffId, (err, result) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to delete hospital staff',
          error: err.message,
        });
      }

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    });
  });
};






