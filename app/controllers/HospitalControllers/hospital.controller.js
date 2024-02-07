// hospital.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Hospital } = require('../../models/HospitalModels/hospital.model');
const dataValidator = require('../../config/data.validate');
const fs = require('fs');





// Hospital Register
exports.hospitalRegister = async (req, res) => {
  try {
    const hospitalImageStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'Files/HospitalImages');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'hospitalImage-' + uniqueSuffix + ext);
      }
    });

    const uploadHospitalImage = multer({ storage: hospitalImageStorage }).single('hospitalImage');

    uploadHospitalImage(req, res, async function (err) {
      try {
        if (err) {
          return res.status(400).json({ error: 'File upload failed', details: err.message });
        }

        const hospitalData = req.body;
        const hospitalImageFile = req.file;

        function validateHospitalRegistration() {
          const validationResults = {
            isValid: true,
            errors: [],
          };

          const nameValidation = dataValidator.isValidName(hospitalData.hospitalName);

          if (!nameValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push({ field: 'hospitalName', message: nameValidation.message });
          }

          const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);

          if (!emailValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push({ field: 'hospitalEmail', message: emailValidation.message });
          }

          const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);

          if (!aadharValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push({ field: 'hospitalAadhar', message: aadharValidation.message });
          }

          const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);

          if (!mobileValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push({ field: 'hospitalMobile', message: mobileValidation.message });
          }

          const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);

          if (!websiteValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push({ field: 'hospitalWebSite', message: websiteValidation.message });
          }

          const addressValidation = dataValidator.isValidAddress(hospitalData.hospitalAddress);

          if (!addressValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push({ field: 'hospitalAddress', message: addressValidation.message });
          }

          const imageValidation = dataValidator.isValidImageWith1MBConstraint(hospitalImageFile);

          if (!imageValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push({ field: 'hospitalImage', message: imageValidation.message });
          }

          const passwordValidation = dataValidator.isValidPassword(hospitalData.hospitalPassword);

          if (!passwordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors.push({ field: 'hospitalPassword', message: passwordValidation.message });
          }

          return validationResults;
        }

        const validationResults = validateHospitalRegistration();

        if (!validationResults.isValid) {
          if (hospitalImageFile) {
            const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(400).json({ status: 'Validation failed', errors: validationResults.errors });
        }

        const newHospital = {
          hospitalName: hospitalData.hospitalName,
          hospitalEmail: hospitalData.hospitalEmail,
          hospitalWebSite: hospitalData.hospitalWebSite,
          hospitalAadhar: hospitalData.hospitalAadhar.replace(/\s/g, ''),
          hospitalMobile: hospitalData.hospitalMobile.replace(/\s/g, ''),
          hospitalAddress: hospitalData.hospitalAddress,
          hospitalImage: hospitalImageFile ? hospitalImageFile.filename : null,
          hospitalPassword: hospitalData.hospitalPassword,
          registeredDate: new Date(),
          isActive: 1,
          deleteStatus: 0,
          updateStatus: 0,
          passwordUpdatedStatus: 0,
        };

        try {
          const registrationResponse = await Hospital.register(newHospital);
          return res.status(201).json({ message: 'Hospital registered successfully', data: registrationResponse });
        } catch (error) {
          if (error.message === 'Email already exists' || error.message === 'Aadhar number already exists') {
            // Clean up image if needed
            if (hospitalImageFile) {
              const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
              fs.unlinkSync(imagePath);
            }
            return res.status(400).json({ error: error.message });
          } else {
            // Clean up image if needed
            if (hospitalImageFile) {
              const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
              fs.unlinkSync(imagePath);
            }
            console.error('Error during hospital registration:', error);
            return res.status(500).json({ error: 'Failed to register hospital' });
          }
        }
      } catch (error) {
        console.error('Error during hospital registration:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error('Error during hospital registration:', error);
    return res.status(500).json({ status: 'Internal server error', message: 'Failed to perform registration' });
  }
};





// Hospital Login
exports.hospitalLogin = async (req, res) => {
  const { hospitalEmail, hospitalPassword } = req.body;

  function validateHospitalLogin() {
    const validationResults = {
      isValid: true,
      messages: [],
    };

    const emailValidation = dataValidator.isValidEmail(hospitalEmail);

    if (!emailValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalEmail', message: emailValidation.message });
    }

    const passwordValidation = dataValidator.isValidPassword(hospitalPassword);

    if (!passwordValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalPassword', message: passwordValidation.message });
    }

    return validationResults;
  }

  const validationResults = validateHospitalLogin();

  if (!validationResults.isValid) {
    return res.status(400).json({ status: 'Validation failed', message: validationResults.messages });
  }

  try {
    const hospital = await Hospital.login(hospitalEmail, hospitalPassword);

    const token = jwt.sign(
      { hospitalId: hospital.hospitalId, hospitalEmail: hospital.hospitalEmail },
      process.env.JWT_SECRET_KEY_HOSPITAL,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ status: 'Login successful', message: { token, hospital } });
  } catch (error) {
    console.error('Error during hospital login:', error);

    if (error.message === "Access to the login feature is restricted") {
      return res.status(401).json({status: 'Login failed',message: 'Access to the login is not authorized for you'});
    }

    if (error.message === "Wrong password") {
      return res.status(401).json({
        status: 'Login failed',
        message: 'Wrong password',
      });
    }

    if (error.message === "Hospital not found") {
      return res.status(404).json({ status: 'Login failed', message: 'Hospital not found'});
    }

    return res.status(500).json({ status: 'Internal server error', message: 'Failed to perform login' });
  }
};





//Hospital Change Password
exports.hospitalChangePassword = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, oldPassword, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || decoded.hospitalId != hospitalId) {
      return res.status(401).json({ status: 'error', message: 'Invalid token or unauthorized access' });
    }

    function validateHospitalChangePassword() {
      const validationResults = {
        isValid: true,
        messages: [],
      };

      const passwordValidation = dataValidator.isValidPassword(oldPassword);

      if (!passwordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'oldPassword', message: `Invalid old password: ${passwordValidation.message}` });
      }

      const newPasswordValidation = dataValidator.isValidPassword(newPassword);

      if (!newPasswordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'newPassword', message: `Invalid new password: ${newPasswordValidation.message}` });
      }

      return validationResults;
    }

    const validationResults = validateHospitalChangePassword();

    if (!validationResults.isValid) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', messages: validationResults.messages });
    }

    await Hospital.changePassword(hospitalId, oldPassword, newPassword);

    return res.status(200).json({ status: 'success', message: 'Password changed successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    } else if (error.message === 'Hospital not found' || error.message === 'Invalid old password') {
      return res.status(404).json({ status: 'error', message: error.message });
    } else {
      console.error('Error changing hospital password:', error);
      return res.status(500).json({ status: 'error', message: 'Internal Server Error: Failed to change password' });
    }
  }
};





// Hospital Change Image
exports.hospitalChangeImage = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || decoded.hospitalId != hospitalId) {
      return res.status(401).json({ status: "error", message: "Unauthorized access or invalid token" });
    }

    const hospitalImageStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'Files/HospitalImages');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'hospitalImage-' + uniqueSuffix + ext);
      }
    });

    const uploadHospitalImage = multer({ storage: hospitalImageStorage }).single('hospitalImage');

    uploadHospitalImage(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ status: 'error', message: 'File upload failed', details: err.message });
      }

      function validateHospitalImage(file) {
        const validationResults = {
          isValid: true,
          messages: [],
        };

        if (!file) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalImage', message: 'Hospital image is required' });
        }

        const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);

        if (!imageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalImage', message: imageValidation.message });
        }

        return validationResults;
      }

      const imageValidation = validateHospitalImage(req.file);

      if (!imageValidation.isValid) {
        const imagePath = path.join('Files/HospitalImages', req.file.filename);
        fs.unlinkSync(imagePath); // Cleanup uploaded file
        return res.status(400).json({ status: "error", message: "Validation failed", details: imageValidation.messages });
      }

      try {
        const newImageFilename = req.file.filename;
        await Hospital.changeImage(hospitalId, newImageFilename);
        return res.status(200).json({ status: "success", message: "Image changed successfully" });
      } catch (error) {
        if (error.message === "Hospital not found") {
          const imagePath = path.join('Files/HospitalImages', req.file.filename);
          fs.unlinkSync(imagePath); // Cleanup uploaded file
          return res.status(404).json({ status: "error", message: error.message });
        } else {
          console.error('Error changing hospital image:', error);
          return res.status(500).json({ status: "error", message: "Internal Server Error: Failed to change image" });
        }
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: "error", message: "Invalid token" });
    } else {
      console.error('Error changing hospital image:', error);
      return res.status(500).json({ status: "error", message: "Internal Server Error: Failed to change image" });
    }
  }
};






// Hospital View Profile
exports.hospitalViewProfile = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || decoded.hospitalId != hospitalId) {
      return res.status(401).json({ status: "error", message: "Unauthorized access or invalid token" });
    }

    const result = await Hospital.getProfile(hospitalId);
    return res.status(200).json({ status: "success", data: result });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: "error", message: "Invalid token" });
    } else if (error.message === "Hospital not found") {
      return res.status(404).json({ status: "error", message: "Hospital not found" });
    } else {
      console.error('Error fetching hospital profile:', error);
      return res.status(500).json({ status: "error", message: "Internal server error" });
    }
  }
};






// Hospital Register New Staff
exports.hospitalStaffRegister = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !hospitalId || !decoded || decoded.hospitalId != hospitalId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to hospital data' });
    }

    const hospitalStaffData = req.body;

    const staffImagesStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'Files/HospitalStaffImages');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);

        if (file.fieldname === 'hospitalStaffProfileImage') {
          const fileName = 'hospitalStaffProfileImage-' + uniqueSuffix + ext;
          cb(null, fileName);
          req.hospitalStaffProfileImageFileName = fileName;
        } else if (file.fieldname === 'hospitalStaffIdProofImage') {
          const fileName = 'hospitalStaffIdProofImage-' + uniqueSuffix + ext;
          cb(null, fileName);
          req.hospitalStaffIdProofImageFileName = fileName;
        }
      }
    });

    const uploadStaffImages = multer({ storage: staffImagesStorage }).fields([
      { name: 'hospitalStaffProfileImage', maxCount: 1 },
      { name: 'hospitalStaffIdProofImage', maxCount: 1 }
    ]);

    uploadStaffImages(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ status: 'error', message: 'File upload failed', details: err.message });
      }

      const staffProfileImageFile = req.files['hospitalStaffProfileImage'] ? req.files['hospitalStaffProfileImage'][0] : null;
      const staffIdProofImageFile = req.files['hospitalStaffIdProofImage'] ? req.files['hospitalStaffIdProofImage'][0] : null;

      function validateHospitalStaffRegistration() {
        const validationResults = {
          isValid: true,
          messages: [],
        };

        const nameValidation = dataValidator.isValidName(hospitalStaffData.hospitalStaffName);

        if (!nameValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalStaffName', message: nameValidation.message });
        }

        const emailValidation = dataValidator.isValidEmail(hospitalStaffData.hospitalStaffEmail);

        if (!emailValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalStaffEmail', message: emailValidation.message });
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

        const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(staffProfileImageFile);

        if (!profileImageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalStaffProfileImage', message: profileImageValidation.message });
        }

        const idProofImageValidation = dataValidator.isValidImageWith1MBConstraint(staffIdProofImageFile);

        if (!idProofImageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalStaffIdProofImage', message: idProofImageValidation.message });
        }

        const passwordValidation = dataValidator.isValidPassword(hospitalStaffData.hospitalStaffPassword);

        if (!passwordValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalPassword', message: passwordValidation.message });
        }

        return validationResults;
      }

      const validationResults = validateHospitalStaffRegistration();

      if (!validationResults.isValid) {
        if (staffProfileImageFile) {
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
        }

        if (staffIdProofImageFile) {
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));
        }

        return res.status(400).json({ status: 'error', message: 'Validation failed', details: validationResults.messages });
      }

      const hospitalIdFromToken = decoded.hospitalId;

      if (hospitalStaffData.hospitalId != hospitalIdFromToken) {
        if (staffProfileImageFile) {
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
        }
        if (staffIdProofImageFile) {
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));
        }

        return res.status(401).json({ status: 'error', message: 'Unauthorized access to hospital data' });
      }

      const newHospitalStaff = {
        hospitalId: hospitalStaffData.hospitalId,
        hospitalStaffName: hospitalStaffData.hospitalStaffName,
        hospitalStaffProfileImage: req.hospitalStaffProfileImageFileName,
        hospitalStaffIdProofImage: req.hospitalStaffIdProofImageFileName,
        hospitalStaffMobile: hospitalStaffData.hospitalStaffMobile,
        hospitalStaffEmail: hospitalStaffData.hospitalStaffEmail,
        hospitalStaffAddress: hospitalStaffData.hospitalStaffAddress,
        hospitalStaffAadhar: hospitalStaffData.hospitalStaffAadhar,
        hospitalStaffPassword: hospitalStaffData.hospitalStaffPassword,
        addedDate: new Date(),
        updatedDate: null,
        deleteStatus: 0,
        isSuspended: 0,
        updateStatus: 0,
        passwordUpdateStatus: 0,
      };

      try {
        const registrationResponse = await Hospital.registerStaff(newHospitalStaff);
        return res.status(201).json({ status: 'success', message: 'Hospital Staff registered successfully', data: registrationResponse.data });
      } catch (error) {
        if (staffProfileImageFile) {
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
        }

        if (staffIdProofImageFile) {
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));
        }

        if (
          error.message === 'Hospital ID does not exist' ||
          error.message === 'Aadhar number already exists' ||
          error.message === 'Email already exists'
        ) {
          return res.status(400).json({ status: 'error', error: error.message, message: 'Failed to register staff' });
        } else {
          throw error;
        }
      }
    });

  } catch (error) {
    if (req.files) {
      if (req.files['hospitalStaffProfileImage'] && req.files['hospitalStaffProfileImage'][0]) {
        fs.unlinkSync(path.join('Files/HospitalStaffImages', req.files['hospitalStaffProfileImage'][0].filename));
      }

      if (req.files['hospitalStaffIdProofImage'] && req.files['hospitalStaffIdProofImage'][0]) {
        fs.unlinkSync(path.join('Files/HospitalStaffImages', req.files['hospitalStaffIdProofImage'][0].filename));
      }
    }

    return res.status(500).json({ status: 'error', error: 'Internal server error', message: 'Failed to register staff' });
  }
};






// Hospital Update Profile
exports.hospitalUpdateProfile = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !hospitalId ||!decoded || (decoded.hospitalId != hospitalId)) {
      return res.status(403).json({status: "error",message: "Unauthorized access to edit the hospital profile"});
    }

    const {
      hospitalName,
      hospitalWebSite,
      hospitalAadhar,
      hospitalMobile,
      hospitalAddress,
    } = req.body;

    const updatedHospital = {
      hospitalId,
      hospitalName,
      hospitalWebSite,
      hospitalAadhar,
      hospitalMobile,
      hospitalAddress,
    };

    function validateHospitalUpdateProfile() {
      const validationResults = {
        isValid: true,
        messages: [],
      };

      const nameValidation = dataValidator.isValidName(hospitalName);

      if (!nameValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalName', message: nameValidation.message });
      }

      const websiteValidation = dataValidator.isValidWebsite(hospitalWebSite);

      if (!websiteValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalWebSite', message: websiteValidation.message });
      }

      const aadharValidation = dataValidator.isValidAadharNumber(hospitalAadhar);

      if (!aadharValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalAadhar', message: aadharValidation.message });
      }

      const mobileValidation = dataValidator.isValidMobileNumber(hospitalMobile);

      if (!mobileValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalMobile', message: mobileValidation.message });
      }

      const addressValidation = dataValidator.isValidAddress(hospitalAddress);

      if (!addressValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalAddress', message: addressValidation.message });
      }

      return validationResults;
    }

    const validationResults = validateHospitalUpdateProfile();

    if (!validationResults.isValid) {
      return res.status(400).json({ status: "error", message: "Validation failed", data: validationResults.messages });
    }

    try {
      const data = await Hospital.updateProfile(updatedHospital);
      return res.status(200).json({ status: "success", message: "Hospital updated successfully", data });
    } catch (error) {
      if (error.message === "Hospital not found" || error.message === "Aadhar Number Already Exists.") {
        return res.status(404).json({ status: "error", message: error.message });
      } else {
        console.error('Error updating hospital profile:', error);
        return res.status(500).json({ status: "error", message: "Failed to edit hospital profile", error: error.message });
      }
    }

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: "error", message: "Invalid token" });
    } else {
      console.error('Error during token verification:', error);
      return res.status(500).json({ status: "error", message: "Failed to verify token", error: error.message });
    }
  }
};





// Hospital Delete Hospital Staff
exports.deleteHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded|| !hospitalId || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to delete hospital staff' });
    }

    try {
      await Hospital.deleteStaff(hospitalStaffId);
      return res.status(200).json({status: 'success', message: 'Hospital Staff deleted successfully',data: { hospitalStaffId }});
    } catch (error) {
      if (error.message === 'Hospital Staff not found or already deleted') {
        return res.status(404).json({status: 'error',message: error.message});
      } else {
        console.error('Error deleting hospital staff:', error);
        return res.status(500).json({status: 'error',message: 'Internal server error'});
      }
    }
  } catch (error) {
    console.error('Error during deleteHospitalStaff:', error);
    return res.status(500).json({status: 'error', message: 'Internal server error'});
  }
};






// Hospital Suspend Hospital Staff
exports.suspendHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to suspend hospital staff' });
    }

    try {
      await Hospital.suspendStaff(hospitalStaffId);
      return res.status(200).json({status: 'success',message: 'Hospital Staff suspended successfully', data: { hospitalStaffId }});
    } catch (error) {
      if (error.message === 'Hospital Staff not found, already deleted, or already suspended') {
        return res.status(404).json({status: 'error',message: error.message});
      } else {
        console.error('Error suspending hospital staff:', error);
        return res.status(500).json({status: 'error',message: 'Internal server error'});
      }
    }
  } catch (error) {
    console.error('Error during suspendHospitalStaff:', error);
    return res.status(500).json({status: 'error', message: 'Internal server error'});
  }
};







// Hospital Unsuspend Hospital Staff
exports.unSuspendHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !hospitalId ||  !decoded || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to unsuspend hospital staff' });
    }

    try {
      await Hospital.unSuspendStaff(hospitalStaffId);
      return res.status(200).json({ status: 'success', message: 'Hospital Staff unsuspended successfully', data: { hospitalStaffId } });
    } catch (error) {
      if (error.message === 'Hospital Staff not found, already deleted, or not suspended') {
        return res.status(404).json({ status: 'error', message: error.message });
      } else {
        console.error('Error unsuspending hospital staff:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
      }
    }
  } catch (error) {
    console.error('Error during unSuspendHospitalStaff:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};






// Hospital Update Hospital Staff
exports.updateHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId, hospitalId, hospitalStaffName, hospitalStaffMobile, hospitalStaffAddress, hospitalStaffAadhar } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !hospitalId || !decoded || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to update hospital staff' });
    }

    const updatedHospitalStaff = {
      hospitalStaffId,
      hospitalId,
      hospitalStaffName,
      hospitalStaffMobile,
      hospitalStaffAddress,
      hospitalStaffAadhar,
    };

    function validateHospitalStaffUpdate() {
      const validationResults = {
        isValid: true,
        messages: [],
      };

      const nameValidation = dataValidator.isValidName(updatedHospitalStaff.hospitalStaffName);

      if (!nameValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffName', message: nameValidation.message });
      }

      const mobileValidation = dataValidator.isValidMobileNumber(updatedHospitalStaff.hospitalStaffMobile);

      if (!mobileValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffMobile', message: mobileValidation.message });
      }

      const addressValidation = dataValidator.isValidAddress(updatedHospitalStaff.hospitalStaffAddress);

      if (!addressValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffAddress', message: addressValidation.message });
      }

      const aadharValidation = dataValidator.isValidAadharNumber(updatedHospitalStaff.hospitalStaffAadhar);

      if (!aadharValidation.isValid) {
        validationResults.isValid = false;
        validationResults.messages.push({ field: 'hospitalStaffAadhar', message: aadharValidation.message });
      }

      return validationResults;
    }

    const validationResults = validateHospitalStaffUpdate();

    if (!validationResults.isValid) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', data: validationResults.messages });
    }

    try {
      const updateResponse = await Hospital.updateStaff(updatedHospitalStaff);
      return res.status(200).json({ status: 'success', message: 'Hospital Staff updated successfully', data: updateResponse.updatedData });
    } catch (error) {
      if (error.message === 'Hospital not found' || error.message === 'Hospital staff not found' || error.message === 'Aadhar number already exists') {
        return res.status(404).json({ status: 'error', message: error.message });
      } else {
        return res.status(500).json({ status: 'error', message: 'Failed to update hospital staff', error: error.message });
      }
    }
  } catch (error) {
    console.error('Error during update hospital staff:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};







// Hospital View All Hospital Staffs
exports.viewAllHospitalStaffs = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !hospitalId || !decoded || (decoded.hospitalId != hospitalId)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to view hospital staff details' });
    }
    try {
      const allStaffs = await Hospital.viewAllStaffs(hospitalId);
      return res.status(200).json({ status: 'success', message: 'All Hospital Staffs retrieved successfully', data: allStaffs.data });
    } catch (error) {
      console.error('Error viewing all hospital staffs:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  } catch (error) {
    console.error('Error during viewAllHospitalStaffs:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};







// Hospital View One Hospital Staff
exports.viewOneHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !hospitalId || !decoded || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to view hospital staff details' });
    }

    try {
      const staffDetails = await Hospital.viewOneStaff(hospitalStaffId);
      return res.status(200).json({ status: 'success', message: 'Hospital Staff details retrieved successfully', data: staffDetails.data });
    } catch (error) {
      if (error.message === 'Hospital Staff not found or already deleted') {
        return res.status(404).json({ status: 'error', message: error.message });
      } else {
        console.error('Error viewing hospital staff details:', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
      }
    }
  } catch (error) {
    console.error('Error during viewOneHospitalStaff:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};






exports.searchHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, searchQuery } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !hospitalId || !decoded || (decoded.hospitalId != hospitalId)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to search hospital staff' });
    }

    if (searchQuery === undefined || searchQuery === null || searchQuery.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Search query cannot be empty' });
    }

    try {
      const searchResult = await Hospital.searchStaff(hospitalId, searchQuery);
      if (searchResult.length === 0) {
        return res.status(404).json({ status: 'failed', message: 'No hospital staffs found' });
      }

      return res.status(200).json({ status: 'success', message: 'Hospital Staffs found successfully', data: searchResult });
    } catch (error) {
      console.error('Error searching hospital staff:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  } catch (error) {
    console.error('Error during searchHospitalStaff:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};









// Add Hospital News
exports.addHospitalNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!token || !decoded || !hospitalId || (decoded.hospitalId != hospitalId)) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized access to add news' });
      }

      const newsImageStorage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, 'Files/HospitalImages/HospitalNewsImages');
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          cb(null, 'hospitalNewsImage-' + uniqueSuffix + ext);
        }
      });

      const uploadNewsImage = multer({ storage: newsImageStorage }).single('hospitalNewsImage');

      uploadNewsImage(req, res, async function (err) {
        if (err) {
          return res.status(400).json({ status: 'error', message: 'File upload failed', details: err.message });
        }

        const newsData = req.body;
        const newsImageFile = req.file;

        function validateNewsData(newsData, newsImageFile) {
          const validationResults = {
            isValid: true,
            messages: [],
          };

          if (!dataValidator.isValidTitle(newsData.hospitalNewsTitle)) {
            validationResults.isValid = false;
            validationResults.messages.push({ field: 'hospitalNewsTitle', message: 'Invalid title' });
          }

          if (!dataValidator.isValidContent(newsData.hospitalNewsContent)) {
            validationResults.isValid = false;
            validationResults.messages.push({ field: 'hospitalNewsContent', message: 'Invalid content' });
          }

          if (!dataValidator.isValidNewsImage(newsImageFile)) {
            validationResults.isValid = false;
            validationResults.messages.push({ field: 'hospitalNewsImage', message: 'Invalid news image' });
          }

          return validationResults;
        }

        const validationResults = validateNewsData(newsData, newsImageFile);

        if (!validationResults.isValid) {
          if (newsImageFile) {
            const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(400).json({ status: 'error', message: 'Validation failed', details: validationResults.messages });
        }

        if (newsData.hospitalId !== decoded.hospitalId) {
          if (newsImageFile) {
            const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(401).json({ status: 'error', message: 'Unauthorized to add hospital news' });
        }

        const newHospitalNews = {
          hospitalId: newsData.hospitalId,
          hospitalNewsTitle: newsData.hospitalNewsTitle,
          hospitalNewsContent: newsData.hospitalNewsContent,
          hospitalNewsImage: newsImageFile ? newsImageFile.filename : null,
          addedDate: new Date(),
          updatedDate: null,
          deleteStatus: 0,
          updateStatus: 0,
          isHided: 0,
        };

        try {
          const addedNews = await Hospital.addNews(newsData.hospitalId, newHospitalNews);
          return res.status(201).json({ status: 'success', message: 'Hospital news added successfully', data: addedNews });
        } catch (error) {
          if (error.message === 'Hospital not found') {
            if (newsImageFile) {
              const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
              fs.unlinkSync(imagePath);
            }
            return res.status(404).json({ status: 'error', message: 'Hospital not found' });
          } else {
            if (newsImageFile) {
              const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
              fs.unlinkSync(imagePath);
            }

            throw error;
          }
        }
      });
    } catch (error) {
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error during adding hospital news:', error);
    if (req.file) {
      const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', req.file.filename);
      fs.unlinkSync(imagePath);
    }
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};






//Delete Hospital News
exports.deleteHospitalNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalNewsId, hospitalId } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!token || !decoded || !hospitalId || !hospitalNewsId || (decoded.hospitalId != hospitalId)) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized access to delete hospital news' });
      }
    } catch (error) {
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }

    try {
      const deletionResult = await Hospital.deleteNews(hospitalNewsId, hospitalId);

      if (deletionResult.status === 'success') {
        return res.status(200).json({ status: 'success', message: 'Hospital News deleted successfully' });
      } else {
        return res.status(404).json({ status: 'error', message: deletionResult.message });
      }
    } catch (error) {
      console.error('Error deleting hospital news:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  } catch (error) {
    console.error('Error during deleteHospitalNews:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};






//Update Hospital News
exports.updateHospitalNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalNewsId, hospitalNewsTitle, hospitalNewsContent } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || !hospitalNewsId || (decoded.hospitalId != hospitalId)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to update hospital news' });
    }

    const newsImageStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'Files/HospitalImages/HospitalNewsImages');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'hospitalNewsImage-' + uniqueSuffix + ext);
      }
    });

    const uploadNewsImage = multer({ storage: newsImageStorage }).single('hospitalNewsImage');
    
    uploadNewsImage(req, res, async function (err) {
      if (err) {
        fs.unlinkSync(req.file.path);  // Delete uploaded file on error
        return res.status(400).json({ status: 'error', message: 'File upload failed', details: err.message });
      }

      const newsImageFile = req.file;

      function validateUpdatedNewsData(newsData, newsImageFile) {
        const validationResults = {
          isValid: true,
          messages: [],
        };

        const titleValidation = dataValidator.isValidTitle(newsData.hospitalNewsTitle);

        if (!titleValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalNewsTitle', message: titleValidation.message });
        }

        const contentValidation = dataValidator.isValidContent(newsData.hospitalNewsContent);

        if (!contentValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalNewsContent', message: contentValidation.message });
        }

        const imageValidation = dataValidator.isValidNewsImage(newsImageFile);

        if (!imageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.messages.push({ field: 'hospitalNewsImage', message: imageValidation.message });
        }

        return validationResults;
      }

      const validationResults = validateUpdatedNewsData({ hospitalNewsTitle, hospitalNewsContent, hospitalId }, newsImageFile);

      if (!validationResults.isValid) {
        fs.unlinkSync(req.file.path);  // Delete uploaded file on validation failure
        return res.status(400).json({ status: 'error', message: 'Validation failed', details: validationResults.messages });
      }

      const updatedHospitalNews = {
        hospitalNewsTitle,
        hospitalNewsContent,
        hospitalNewsImage: newsImageFile ? newsImageFile.filename : null,
        updatedDate: new Date()
      };

      try {
        await Hospital.updateNews(hospitalNewsId, hospitalId, updatedHospitalNews);
        return res.status(200).json({ status: 'success', message: 'Hospital news updated successfully' });
      } catch (error) {
        fs.unlinkSync(req.file.path);  // Delete uploaded file on error
        if (error.message === 'Hospital not found' || error.message === 'Hospital news not found' || error.message === 'Unauthorized access') {
          return res.status(403).json({ status: 'error', message: error.message });
        } else {
          console.error('Error updating hospital news:', error);
          return res.status(500).json({ status: 'error', message: 'Failed to update hospital news', error: error.message });
        }
      }
    });
  } catch (error) {
    console.error('Error during updateHospitalNews:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};






// Hospital View All Hospital News
exports.viewAllNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || (decoded.hospitalId != hospitalId)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized access to view hospital news' });
    }

    try {
      const allNews = await Hospital.viewAllNews(hospitalId);
      return res.status(200).json({ status: 'success', message: 'All hospital news retrieved successfully', data: allNews.data });
    } catch (error) {
      console.error('Error viewing all hospital news:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  } catch (error) {
    console.error('Error during viewAllNews:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};






// Hospital One Hospital News
exports.viewOneHospitalNews = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, hospitalNewsId } = req.body; 

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!token || !decoded || !hospitalId || !hospitalNewsId || (decoded.hospitalId != hospitalId)) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized access to view hospital news' });
      }

      try {
          const newsItem = await Hospital.viewOneNews(hospitalNewsId, hospitalId);
          return res.status(200).json({ status: 'success', message: 'Hospital news retrieved successfully', data: newsItem });
      } catch (error) {
          if (error.message === 'Hospital news not found or already deleted') {
              return res.status(404).json({ status: 'error', message: error.message });
          } else {
              console.error('Error viewing one hospital news:', error);
              return res.status(500).json({ status: 'error', message: 'Internal server error' });
          }
      }
  } catch (error) {
      console.error('Error during viewOneHospitalNews:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
