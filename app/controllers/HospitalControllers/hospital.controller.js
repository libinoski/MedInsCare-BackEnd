// hospital.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Hospital } = require('../../models/HospitalModels/hospital.model');
const dataValidator = require('../../config/data.validate');
const fs = require('fs');








// Hospital Registration
exports.register = async (req, res) => {
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
          return res.status(400).json({ status: 'validation failed', errors: { file: 'File upload failed', details: err.message } });
        }

        const hospitalData = req.body;
        const hospitalImageFile = req.file;

        function validateHospitalRegistration() {
          const validationResults = {
            isValid: true,
            errors: {},
          };

          const nameValidation = dataValidator.isValidName(hospitalData.hospitalName);
          if (!nameValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalName'] = nameValidation.message;
          }

          const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);
          if (!emailValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalEmail'] = emailValidation.message;
          }

          const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);
          if (!aadharValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalAadhar'] = aadharValidation.message;
          }

          const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);
          if (!mobileValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalMobile'] = mobileValidation.message;
          }

          const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);
          if (!websiteValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalWebSite'] = websiteValidation.message;
          }

          const addressValidation = dataValidator.isValidAddress(hospitalData.hospitalAddress);
          if (!addressValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalAddress'] = addressValidation.message;
          }

          const imageValidation = dataValidator.isValidImageWith1MBConstraint(hospitalImageFile);
          if (!imageValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalImage'] = imageValidation.message;
          }

          const passwordValidation = dataValidator.isValidPassword(hospitalData.hospitalPassword);
          if (!passwordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalPassword'] = passwordValidation.message;
          }

          return validationResults;
        }

        const validationResults = validateHospitalRegistration();

        if (!validationResults.isValid) {
          if (hospitalImageFile) {
            const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(400).json({ status: 'validation failed', errors: validationResults.errors });
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
          return res.status(201).json({ status: 'success', message: 'Hospital registered successfully', data: registrationResponse });
        } catch (error) {
          if (error.message === 'Email already exists' || error.message === 'Aadhar number already exists') {
            if (hospitalImageFile) {
              const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
              fs.unlinkSync(imagePath);
            }
            return res.status(400).json({ status: 'failed', message: error.message });
          } else {
            if (hospitalImageFile) {
              const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
              fs.unlinkSync(imagePath);     
            }
            console.error('Error during hospital registration:', error);
            return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
          }
        }
      } catch (error) {
        console.error('Error during hospital registration:', error);
        return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
      }
    });
  } catch (error) {
    console.error('Error during hospital registration:', error);
    return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
};






// Hospital Login
exports.login = async (req, res) => {
  const { hospitalEmail, hospitalPassword } = req.body;

  function validateHospitalLogin() {
    const validationResults = {
      isValid: true,
      errors: {}, 
    };

    // Validate email
    const emailValidation = dataValidator.isValidEmail(hospitalEmail);
    if (!emailValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors['hospitalEmail'] = emailValidation.message;
    }

    // Validate password
    const passwordValidation = dataValidator.isValidPassword(hospitalPassword);
    if (!passwordValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors['hospitalPassword'] = passwordValidation.message;
    }

    return validationResults;
  }

  const validationResults = validateHospitalLogin();
  if (!validationResults.isValid) {
    return res.status(400).json({ status: 'validation failed', errors: validationResults.errors });
  }

  try {
    const hospital = await Hospital.login(hospitalEmail, hospitalPassword);

    const token = jwt.sign(
      { hospitalId: hospital.hospitalId, hospitalEmail: hospital.hospitalEmail },
      process.env.JWT_SECRET_KEY_HOSPITAL,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ status: 'success', message: 'Login successful', data: { token, hospital } });
  } catch (error) {
    console.error('Error during hospital login:', error);

    if (error.message === "Hospital not found") {
      return res.status(401).json({ status: 'error', error: error.message });
    }

    if (error.message === "Wrong password") {
      return res.status(401).json({ status: 'error', error: error.message });
    }

    return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
};







// Hospital  Password Changing
exports.changePassword = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, oldPassword, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || decoded.hospitalId != hospitalId) {
      return res.status(401).json({ status: 'failed', message: 'Unauthorized access' });
    }

    function validateHospitalChangePassword() {
      const validationResults = {
        isValid: true,
        errors: {}, 
      };

      // Validate old password
      const passwordValidation = dataValidator.isValidPassword(oldPassword);
      if (!passwordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors['oldPassword'] = passwordValidation.message;
      }

      // Validate new password
      const newPasswordValidation = dataValidator.isValidPassword(newPassword);
      if (!newPasswordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors['newPassword'] = newPasswordValidation.message;
      }

      return validationResults;
    }

    const validationResults = validateHospitalChangePassword();
    if (!validationResults.isValid) {
      return res.status(400).json({ status: 'failed', message: 'Validation failed', errors: validationResults.errors });
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
      return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
    }
  }
};






// Hospital Image Changing
exports.changeImage = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || decoded.hospitalId != hospitalId) {
      return res.status(401).json({ status: "failed", message: "Unauthorized access" });
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
        return res.status(400).json({ status: 'failed', message: 'File upload failed', errors: { file: err.message } });
      }

      function validateHospitalImage(file) {
        const validationResults = {
          isValid: true,
          errors: {},
        };

        if (!file) {
          validationResults.isValid = false;
          validationResults.errors['hospitalImage'] = 'Hospital image is required';
        }

        const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);

        if (!imageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors['hospitalImage'] = imageValidation.message;
        }

        return validationResults;
      }

      const imageValidation = validateHospitalImage(req.file);

      if (!imageValidation.isValid) {
        const imagePath = path.join('Files/HospitalImages', req.file.filename);
        fs.unlinkSync(imagePath); // Cleanup uploaded file
        return res.status(400).json({ status: 'failed', message: 'Validation failed', errors: imageValidation.errors });
      }

      try {
        const newImageFilename = req.file.filename;
        await Hospital.changeImage(hospitalId, newImageFilename);
        return res.status(200).json({ status: 'success', message: 'Image changed successfully' });
      } catch (error) {
        if (error.message === "Hospital not found") {
          const imagePath = path.join('Files/HospitalImages', req.file.filename);
          fs.unlinkSync(imagePath); // Cleanup uploaded file
          return res.status(404).json({ status: 'error', message: error.message });
        } else if (error.message === "Failed to update hospital image") {
          const imagePath = path.join('Files/HospitalImages', req.file.filename);
          fs.unlinkSync(imagePath); // Cleanup uploaded file
          return res.status(500).json({ status: 'error', message: error.message });
        } else {
          console.error('Error changing hospital image:', error);
          return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
        }
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'failed', message: 'Invalid token' });
    } else {
      console.error('Error changing hospital image:', error);
      return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
    }
  }
};







// Hospital Profile View
exports.viewProfile = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

    if (!token || !decoded || !hospitalId || decoded.hospitalId != hospitalId) {
      return res.status(401).json({ status: "failed", message: "Unauthorized access" });
    }

    const result = await Hospital.getProfile(hospitalId);
    return res.status(200).json({ status: "success", data: result });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: "error", message: "Invalid token" });
    } else if (error.message === "Hospital not found") {
      return res.status(404).json({ status: "error", error: error.message });
    } else {
      console.error('Error fetching hospital profile:', error);
      return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
    }
  }
};






// Hospital Profile Update
exports.updateProfile = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!token || !hospitalId || !decoded || decoded.hospitalId != hospitalId) {
          return res.status(403).json({ status: "failed", message: "Unauthorized access" });
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
              errors: {},
          };

          const nameValidation = dataValidator.isValidName(hospitalName);

          if (!nameValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalName'] = [nameValidation.message];
          }

          const websiteValidation = dataValidator.isValidWebsite(hospitalWebSite);

          if (!websiteValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalWebSite'] = [websiteValidation.message];
          }

          const aadharValidation = dataValidator.isValidAadharNumber(hospitalAadhar);

          if (!aadharValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalAadhar'] = [aadharValidation.message];
          }

          const mobileValidation = dataValidator.isValidMobileNumber(hospitalMobile);

          if (!mobileValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalMobile'] = [mobileValidation.message];
          }

          const addressValidation = dataValidator.isValidAddress(hospitalAddress);

          if (!addressValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalAddress'] = [addressValidation.message];
          }

          return validationResults;
      }

      const validationResults = validateHospitalUpdateProfile();

      if (!validationResults.isValid) {
          return res.status(400).json({ status: "failed", message: "Validation failed", errors: validationResults.errors });
      }

      try {
          const updatedData = await Hospital.updateProfile(updatedHospital);
          return res.status(200).json({ status: "success", message: "Hospital updated successfully", data: updatedData });
      } catch (error) {
          console.error('Error updating hospital profile:', error);
          if (error.message === "Hospital not found" || error.message === "Aadhar Number Already Exists.") {
              return res.status(404).json({ status: "error", error: error.message });
          } else if (error.message === "Error fetching updated hospital details.") {
              return res.status(500).json({ status: "failed", message: error.message });
          } else if (error.name === 'JsonWebTokenError') {
              return res.status(401).json({ status: "error", message: "Invalid token" });
          } else {
              return res.status(500).json({ status: "failed", message: "Internal server error", error: error.message });
          }
      }

  } catch (error) {
      console.error('Error during token verification:', error);
      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ status: "error", message: "Invalid token" });
      } else {
          return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
      }
  }
};







// Staff Registration
exports.staffRegister = async (req, res) => {
  try {
      const token = req.headers.token;
      const { hospitalId } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!token || !hospitalId || !decoded || decoded.hospitalId != hospitalId) {
          return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
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
                  errors: {},
              };

              const nameValidation = dataValidator.isValidName(hospitalStaffData.hospitalStaffName);
              if (!nameValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalStaffName'] = [nameValidation.message];
              }

              const emailValidation = dataValidator.isValidEmail(hospitalStaffData.hospitalStaffEmail);
              if (!emailValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalStaffEmail'] = [emailValidation.message];
              }

              const aadharValidation = dataValidator.isValidAadharNumber(hospitalStaffData.hospitalStaffAadhar);
              if (!aadharValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalStaffAadhar'] = [aadharValidation.message];
              }

              const mobileValidation = dataValidator.isValidMobileNumber(hospitalStaffData.hospitalStaffMobile);
              if (!mobileValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalStaffMobile'] = [mobileValidation.message];
              }

              const addressValidation = dataValidator.isValidAddress(hospitalStaffData.hospitalStaffAddress);
              if (!addressValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalStaffAddress'] = [addressValidation.message];
              }

              const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(staffProfileImageFile);
              if (!profileImageValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalStaffProfileImage'] = [profileImageValidation.message];
              }

              const idProofImageValidation = dataValidator.isValidImageWith1MBConstraint(staffIdProofImageFile);
              if (!idProofImageValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalStaffIdProofImage'] = [idProofImageValidation.message];
              }

              const passwordValidation = dataValidator.isValidPassword(hospitalStaffData.hospitalStaffPassword);
              if (!passwordValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalStaffPassword'] = [passwordValidation.message];
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

              return res.status(400).json({ status: 'failed', message: 'Validation failed', errors: validationResults.errors });
          }

          const hospitalIdFromToken = decoded.hospitalId;

          if (hospitalStaffData.hospitalId != hospitalIdFromToken) {
              if (staffProfileImageFile) {
                  fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
              }

              if (staffIdProofImageFile) {
                  fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));
              }

              return res.status(401).json({ status: 'failed', message: 'Unauthorized access' });
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
              return res.status(201).json({ status: 'success', message: 'Hospital Staff registered successfully', data: { hospitalStaffId: registrationResponse, ...newHospitalStaff } });
          } catch (error) {
              if (staffProfileImageFile) {
                  fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
              }

              if (staffIdProofImageFile) {
                  fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));
              }

              if (
                  error.message === 'Hospital not found' ||
                  error.message === 'Aadhar number already exists' ||
                  error.message === 'Email already exists'
              ) {
                  return res.status(400).json({ status: 'error', error: error.message });
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

      return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};







// Staff Removal
exports.deleteStaff = async (req, res) => {
  try {
      const token = req.headers.token;
      const { hospitalId, hospitalStaffId } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!token || !decoded || !hospitalId || !hospitalStaffId || (decoded.hospitalId != hospitalId)) {
          return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
      }

      const deletionStatus = await Hospital.deleteStaff(hospitalStaffId, hospitalId);

      if (deletionStatus) {
          return res.status(200).json({ status: 'success', message: 'Hospital Staff deleted successfully', data: { hospitalStaffId } });
      } else {
          throw new Error("Error deleting hospital staff");
      }
  } catch (error) {
      console.error('Error deleting hospital staff:', error);

      if (error.message === 'Hospital Staff not found' || error.message === "Hospital not found") {
          return res.status(404).json({ status: 'error', error: error.message });
      }

      return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};






// Suspend Staff
exports.suspendStaff = async (req, res) => {
  try {
      const token = req.headers.token;
      const { hospitalId, hospitalStaffId } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || !decoded || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
          return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
      }

      const suspensionStatus = await Hospital.suspendStaff(hospitalStaffId, hospitalId);

      if (suspensionStatus) {
          return res.status(200).json({ status: 'success', message: 'Hospital Staff suspended successfully', data: { hospitalStaffId } });
      } else {
          throw new Error("Error suspending hospital staff");
      }
  } catch (error) {
      console.error('Error suspending hospital staff:', error);

      if (error.message === 'Hospital Staff not found' || error.message === "Hospital not found") {
          return res.status(404).json({ status: 'error', error: error.message });
      }

      return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};






// Unsuspend Staff
exports.unsuspendStaff = async (req, res) => {
  try {
      const token = req.headers.token;
      const { hospitalId, hospitalStaffId } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || !decoded || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
          return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
      }

      const unsuspensionStatus = await Hospital.unSuspendStaff(hospitalStaffId, hospitalId);

      if (unsuspensionStatus) {
          return res.status(200).json({ status: 'success', message: 'Hospital Staff unsuspended successfully', data: { hospitalStaffId } });
      } else {
          throw new Error("Error unsuspending hospital staff");
      }
  } catch (error) {
      console.error('Error unsuspending hospital staff:', error);

      if (error.message === 'Hospital Staff not found' || error.message === "Hospital not found") {
          return res.status(404).json({ status: 'error', error: error.message });
      }

      return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};






// Update Staff
exports.updateStaff = async (req, res) => {
  try {
      const token = req.headers.token;
      const { hospitalStaffId, hospitalId, hospitalStaffName, hospitalStaffMobile, hospitalStaffAddress, hospitalStaffAadhar } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || !decoded || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
          return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
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
              errors: {},
          };

          const nameValidation = dataValidator.isValidName(updatedHospitalStaff.hospitalStaffName);

          if (!nameValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalStaffName'] = [nameValidation.message];
          }

          const mobileValidation = dataValidator.isValidMobileNumber(updatedHospitalStaff.hospitalStaffMobile);

          if (!mobileValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalStaffMobile'] = [mobileValidation.message];
          }

          const addressValidation = dataValidator.isValidAddress(updatedHospitalStaff.hospitalStaffAddress);

          if (!addressValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalStaffAddress'] = [addressValidation.message];
          }

          const aadharValidation = dataValidator.isValidAadharNumber(updatedHospitalStaff.hospitalStaffAadhar);

          if (!aadharValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors['hospitalStaffAadhar'] = [aadharValidation.message];
          }

          return validationResults;
      }

      const validationResults = validateHospitalStaffUpdate();

      if (!validationResults.isValid) {
          return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validationResults.errors });
      }

      try {
          const updateResponse = await Hospital.updateStaff(updatedHospitalStaff);
          return res.status(200).json({ status: 'success', message: 'Hospital Staff updated successfully', data: updateResponse.updatedData });
      } catch (error) {
          if (error.message === 'Hospital not found' || error.message === 'Hospital staff not found' || error.message === 'Aadhar number already exists') {
              return res.status(404).json({ status: 'error', error: error.message });
          } else {
              return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
          }
      }
  } catch (error) {
      console.error('Error during update hospital staff:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
  }
};







// View All Staffs
exports.viewAllStaffs = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || !decoded || (decoded.hospitalId != hospitalId)) {
          return res.status(403).json({ status: 'failed', message: 'Unauthorized access' });
      }

      const allStaffs = await Hospital.viewAllStaffs(hospitalId);
      return res.status(200).json({ status: 'success', message: 'All Hospital Staffs retrieved successfully', data: allStaffs });
  } catch (error) {
      console.error('Error viewing all hospital staffs:', error);

      if (error.message === "Hospital not found") {
          return res.status(404).json({ status: 'error',  error: error.message });
      }

      return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
};







// View One Hospital Staff
exports.viewOneStaff = async (req, res) => {
  try {
      const token = req.headers.token;
      const { hospitalId, hospitalStaffId } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || !decoded || (decoded.hospitalId != hospitalId) || !hospitalStaffId) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
      }

      const staffDetails = await Hospital.viewOneStaff(hospitalStaffId, hospitalId);
      return res.status(200).json({ status: 'success', message: 'Hospital Staff details', data: staffDetails });
  } catch (error) {
      if (error.message === 'Hospital Staff not found') {
          return res.status(404).json({ status: 'error', error: error.message });
      } else if (error.message === "Hospital not found") {
          return res.status(404).json({ status: 'error', error: error.message});
      } else {
          console.error('Error viewing hospital staff details:', error);
          return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
      }
  }
};






//Hospital Search Staffs
exports.searchStaffs = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, searchQuery } = req.body;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || !decoded || (decoded.hospitalId != hospitalId)) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
      }

      if (searchQuery === undefined || searchQuery === null || searchQuery.trim() === '') {
          return res.status(400).json({ status: 'error', message: 'Search query cannot be empty' });
      }

      const searchResult = await Hospital.searchStaff(hospitalId, searchQuery);

      if (searchResult.length === 0) {
          return res.status(404).json({ status: 'failed', message: 'No hospital staffs found' });
      }

      return res.status(200).json({ status: 'success', message: 'Hospital Staffs found successfully', data: searchResult });
  } catch (error) {
      console.error('Error searching hospital staff:', error);

      if (error.message === "Hospital not found") {
          return res.status(404).json({ status: 'error', error: error.message });
      }

      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ status: 'error', message: 'Invalid or missing token' });
      }

      return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
};






// Add Hospital News
exports.addNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!token || !decoded || !hospitalId || (decoded.hospitalId != hospitalId)) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
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

        function validateNewsData() {
          const validationResults = {
            isValid: true,
            errors: {},
          };

          const titleValidation = dataValidator.isValidTitle(newsData.hospitalNewsTitle);
          if (!titleValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalNewsTitle'] = titleValidation.message;
          }

          const contentValidation = dataValidator.isValidContent(newsData.hospitalNewsContent);
          if (!contentValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalNewsContent'] = contentValidation.message;
          }

          const imageValidation = dataValidator.isValidNewsImage(newsImageFile);
          if (!imageValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors['hospitalNewsImage'] = imageValidation.message;
          }

          return validationResults;
        }

        const validationResults = validateNewsData();

        if (!validationResults.isValid) {
          if (newsImageFile) {
            const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validationResults.errors });
        }

        if (newsData.hospitalId != decoded.hospitalId) {
          if (newsImageFile) {
            const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(401).json({ status: 'error', message: 'Unauthorized access' });
        }

        const newHospitalNews = {
          hospitalNewsTitle: newsData.hospitalNewsTitle,
          hospitalNewsContent: newsData.hospitalNewsContent,
          hospitalNewsImage: newsImageFile ? newsImageFile.filename : null,
        };

        try {
          const addedNewsId = await Hospital.addNews(newsData.hospitalId, newHospitalNews);
          return res.status(201).json({ status: 'success', message: 'Hospital news added successfully', data: { hospitalNewsId: addedNewsId, ...newHospitalNews } });
        } catch (error) {
          if (error.message === 'Hospital not found') {
            if (newsImageFile) {
              const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
              fs.unlinkSync(imagePath);
            }
            return res.status(404).json({ status: 'error', error: error.message});
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
    return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
};






// Delete  News
exports.deleteNews = async (req, res) => {
  const token = req.headers.token;
  const { hospitalNewsId, hospitalId } = req.body;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || !hospitalNewsId || (decoded.hospitalId != hospitalId)) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
      }

      await Hospital.deleteNews(hospitalNewsId, hospitalId);

      return res.status(200).json({ status: 'success', message: 'Hospital News deleted successfully' });
  } catch (error) {
      console.error('Error deleting hospital news:', error);

      if (error.message === "Hospital not found" || error.message === "Hospital news not found") {
          return res.status(404).json({ status: 'error', error: error.message });
      } else if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ status: 'error', message: 'Invalid token' });
      } else {
          return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
      }
  }
};







// Update  News
exports.updateNews = async (req, res) => {
  try {
      const token = req.headers.token;
      const { hospitalId, hospitalNewsId, hospitalNewsTitle, hospitalNewsContent } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!token || !decoded || !hospitalId || !hospitalNewsId || (decoded.hospitalId != hospitalId)) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
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
                  errors: {},
              };

              const titleValidation = dataValidator.isValidTitle(newsData.hospitalNewsTitle);

              if (!titleValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalNewsTitle'] = [titleValidation.message];
              }

              const contentValidation = dataValidator.isValidContent(newsData.hospitalNewsContent);

              if (!contentValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalNewsContent'] = [contentValidation.message];
              }

              const imageValidation = dataValidator.isValidNewsImage(newsImageFile);

              if (!imageValidation.isValid) {
                  validationResults.isValid = false;
                  validationResults.errors['hospitalNewsImage'] = [imageValidation.message];
              }

              return validationResults;
          }

          const validationResults = validateUpdatedNewsData({ hospitalNewsTitle, hospitalNewsContent, hospitalId }, newsImageFile);

          if (!validationResults.isValid) {
              fs.unlinkSync(req.file.path);  // Delete uploaded file on validation failure
              return res.status(400).json({ status: 'error', message: 'Validation failed', errors: validationResults.errors });
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
              if (error.message === 'Hospital not found' || error.message === 'Hospital news not found') {
                  return res.status(403).json({ status: 'error', error: error.message });
              } else {
                  console.error('Error updating hospital news:', error);
                  fs.unlinkSync(req.file.path);  // Delete uploaded file on error
                  return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
              }
          }
      });
  } catch (error) {
      console.error('Error during updateHospitalNews:', error);
      return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
};








// Hospital view all Hospital News
exports.viewAllNews = async (req, res) => {
  try {
      const token = req.headers.token;
      const { hospitalId } = req.body;

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || (decoded.hospitalId != hospitalId)) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
      }

      try {
          const allNewsData = await Hospital.viewAllNews(hospitalId);
          return res.status(200).json({ status: 'success', message: 'All hospital news retrieved successfully', data: allNewsData });
      } catch (error) {
          console.error('Error viewing all hospital news:', error);

          if (error.message === "Hospital not found") {
              return res.status(404).json({ status: 'error', error: error.message });
          }

          return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
      }
  } catch (error) {
      console.error('Error during viewAllHospitalNews:', error);

      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ status: 'error', message: 'Invalid or missing token' });
      }
      return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
};







// Hospital view One Hospital News
exports.viewOneNews = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, hospitalNewsId } = req.body;

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL);

      if (!hospitalId || !hospitalNewsId || (decoded.hospitalId != hospitalId)) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
      }

      try {
          const newsItemData = await Hospital.viewOneNews(hospitalNewsId, hospitalId);
          return res.status(200).json({ status: 'success', message: 'Hospital news retrieved successfully', data: newsItemData });
      } catch (error) {
          console.error('Error viewing one hospital news:', error);
          if (error.message === 'Hospital news not found' || error.message === "Hospital not found") {
              return res.status(404).json({ status: 'error', message: error.message });
          } else {
              return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
          }
      }
  } catch (error) {
      console.error('Error during viewOneHospitalNews:', error);
      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ status: 'error', message: 'Invalid or missing token' });
      }
      return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
  }
};

