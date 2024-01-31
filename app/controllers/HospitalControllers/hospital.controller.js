// hospital.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Hospital, HospitalNews } = require('../../models/HospitalModels/hospital.model');
const dataValidator = require('../../config/data.validate');
const bcrypt = require('bcrypt');
const fs = require('fs');
const nodemailer = require('nodemailer');
const emailConfig = require('../../config/emailConfig');




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
      if (err) {
        return res.status(400).json({ error: 'File upload failed', details: err.message });
      }

      const hospitalData = req.body;
      const hospitalImageFile = req.file;

      const validationResults = validateHospitalRegistration(hospitalData, hospitalImageFile);
      if (!validationResults.isValid) {
        if (hospitalImageFile) {
          const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
          fs.unlinkSync(imagePath);
        }
        return res.status(400).json({ error: 'Validation failed', details: validationResults.messages });
      }

      const newHospital = {
        hospitalName: hospitalData.hospitalName,
        hospitalEmail: hospitalData.hospitalEmail,
        hospitalWebSite: hospitalData.hospitalWebSite,
        hospitalAadhar: hospitalData.hospitalAadhar,
        hospitalMobile: hospitalData.hospitalMobile,
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
        if (error.message === "Hospital email already exists" || error.message === "Aadhar number already exists") {
          if (hospitalImageFile) {
            const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(400).json({ error: error.message });
        } else {
          if (hospitalImageFile) {
            const imagePath = path.join('Files/HospitalImages', hospitalImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          throw error; 
        }
      }
    });
  } catch (error) {
    console.error('Error during hospital registration:', error);
    if (req.file) {
      const imagePath = path.join('Files/HospitalImages', req.file.filename);
      fs.unlinkSync(imagePath);
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
function validateHospitalRegistration(hospitalData, hospitalImageFile) {
  const validationResults = {
    isValid: true,
    messages: [],
  };

  const nameValidation = dataValidator.isValidName(hospitalData.hospitalName);
  if (!nameValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalName', message: nameValidation.message });
  }

  const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);
  if (!emailValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalEmail', message: emailValidation.message });
  }

  const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);
  if (!aadharValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalAadhar', message: aadharValidation.message });
  }

  const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);
  if (!mobileValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalMobile', message: mobileValidation.message });
  }

  const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);
  if (!websiteValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalWebSite', message: websiteValidation.message });
  }
  const addressValidation = dataValidator.isValidAddress(hospitalData.hospitalAddress);
  if (!addressValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalAddress', message: addressValidation.message });
  }
  const imageValidation = dataValidator.isValidImageWith1MBConstraint(hospitalImageFile);
  if (!imageValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalImage', message: imageValidation.message });
  }

  const passwordValidation = dataValidator.isValidPassword(hospitalData.hospitalPassword);
  if (!passwordValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalPassword', message: passwordValidation.message });
  }

  return validationResults;
}



// Hospital Login
exports.hospitalLogin = async (req, res) => {
  const { hospitalEmail, hospitalPassword } = req.body;
  const hospitalData = req.body;

  const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);
  if (!emailValidation.isValid) {
      return res.status(400).json({ status: 'Validation failed', details: emailValidation.message });
  }

  const passwordValidation = dataValidator.isValidPassword(hospitalData.hospitalPassword);
  if (!passwordValidation.isValid) {
      return res.status(400).json({ status: 'Validation failed', details: passwordValidation.message });
  }

  try {
      const hospital = await Hospital.login(hospitalEmail, hospitalPassword);

      const token = jwt.sign(
          { hospitalId: hospital.hospitalId, hospitalEmail: hospital.hospitalEmail },
          'micadmin', //secret key
          { expiresIn: '1h' }
      );

      return res.status(200).json({ status: 'Login successful', data: { token, hospital } });
  } catch (error) {
      if (error.message === "Hospital not found" || error.message === "Hospital is not active or has been deleted" || error.message === "Invalid password") {
          return res.status(401).json({ status: 'Login failed', data: error.message });
      } else {
          console.error('Error during hospital login:', error);
          return res.status(500).json({ status: 'Internal server error' });
      }
  }
};




// View Hospital Profile
exports.getHospitalProfile = async (req, res) => {
  const { hospitalId } = req.body;
  const token = req.headers.token;

  if (!hospitalId) {
    return res.status(400).json({
      status: 'error',
      message: 'Hospital ID is required in the request body',
    });
  }

  try {
    jwt.verify(token, 'micadmin', async (err, decoded) => {
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

      const result = await Hospital.getProfile(hospitalId);

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
    } else if (error.message === "Hospital not found") {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found',
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




// Update Hospital Profile
exports.hospitalUpdateProfile = async (req, res) => {
  const token = req.headers.token;

  if (!token) {
      return res.status(401).json({ status: "Token missing" });
  }

  try {
      jwt.verify(token, "micadmin", async (err, decoded) => {
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

          const validationResults = validateHospitalUpdateProfile(req.body);

          if (!validationResults.isValid) {
              return res.status(400).json({ status: "Validation failed", data: validationResults.messages });
          }

          const updatedHospital = {
              hospitalId,
              hospitalName,
              hospitalWebSite,
              hospitalAadhar,
              hospitalMobile,
              hospitalAddress,
          };

          const data = await Hospital.updateProfile(updatedHospital);

          return res.status(200).json({ status: "success", message: "Hospital updated successfully", data });
      });
  } catch (error) {
      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ status: "Invalid token" });
      } else if (error.message === "Hospital not found" || error.message === "Aadhar Number Already Exists.") {
          return res.status(404).json({ status: error.message });
      } else {
          console.error('Error updating hospital profile:', error);
          return res.status(500).json({ status: "Failed to edit hospital profile", error: error.message });
      }
  }
};
// Function to validate the hospital update profile request
function validateHospitalUpdateProfile(hospitalData) {
  const validationResults = {
      isValid: true,
      messages: [],
  };

  const nameValidation = dataValidator.isValidName(hospitalData.hospitalName);
  if (!nameValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalName', message: nameValidation.message });
  }

  const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);
  if (!websiteValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalWebSite', message: websiteValidation.message });
  }

  const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);
  if (!aadharValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalAadhar', message: aadharValidation.message });
  }

  const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);
  if (!mobileValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalMobile', message: mobileValidation.message });
  }

  const addressValidation = dataValidator.isValidAddress(hospitalData.hospitalAddress);
  if (!addressValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalAddress', message: addressValidation.message });
  }

  return validationResults;
}



exports.hospitalStaffRegister = async (req, res) => {
  try {
    // Verify JWT token
    const token = req.headers.token;
    jwt.verify(token, 'micadmin', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Set up multer storage and file handling
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

      // Upload staff images
      uploadStaffImages(req, res, async function (err) {
        if (err) {
          return res.status(400).json({ error: 'File upload failed', details: err.message });
        }

        // Get uploaded files
        const staffProfileImageFile = req.files['hospitalStaffProfileImage'] ? req.files['hospitalStaffProfileImage'][0] : null;
        const staffIdProofImageFile = req.files['hospitalStaffIdProofImage'] ? req.files['hospitalStaffIdProofImage'][0] : null;

        // Check if both images are uploaded
        if (!staffProfileImageFile || !staffIdProofImageFile) {
          // Clean up code for uploaded images
          if (staffProfileImageFile) {
            fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
          }
          if (staffIdProofImageFile) {
            fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));
          }

          return res.status(400).json({ error: 'Both profile image and ID proof image are required for registration' });
        }

        const staffData = req.body;

        // Validate staff registration data
        const validationResults = validateHospitalStaffRegistration(staffData, staffProfileImageFile, staffIdProofImageFile);
        if (!validationResults.isValid) {
          // Clean up code for uploaded images
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));

          return res.status(400).json({ error: 'Validation failed', details: validationResults.messages });
        }

        const hospitalIdFromToken = decoded.hospitalId;

        // Check if the hospital ID from the token matches the provided hospital ID
        if (staffData.hospitalId != hospitalIdFromToken) {
          // Clean up code for uploaded images
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));

          return res.status(401).json({ error: 'Unauthorized access to hospital data' });
        }

        // Create a new hospital staff object
        const newHospitalStaff = {
          hospitalId: staffData.hospitalId,
          hospitalStaffName: staffData.hospitalStaffName,
          hospitalStaffProfileImage: req.hospitalStaffProfileImageFileName,
          hospitalStaffIdProofImage: req.hospitalStaffIdProofImageFileName,
          hospitalStaffMobile: staffData.hospitalStaffMobile,
          hospitalStaffEmail: staffData.hospitalStaffEmail,
          hospitalStaffAddress: staffData.hospitalStaffAddress,
          hospitalStaffAadhar: staffData.hospitalStaffAadhar,
          hospitalStaffPassword: staffData.hospitalStaffPassword,
          addedDate: new Date(),
          updatedDate: null,
          deleteStatus: 0,
          isSuspended: 0,
          updateStatus: 0,
          passwordUpdateStatus: 0,
        };

        try {
          // Register hospital staff
          const registrationResponse = await Hospital.registerStaff(newHospitalStaff);

          // Send a welcome email
          const transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: emailConfig.auth,
          });

          const mailOptions = {
            from: emailConfig.fromEmail,
            to: newHospitalStaff.hospitalStaffEmail,
            subject: 'Welcome to Your Hospital',
            text: `Dear ${newHospitalStaff.hospitalStaffName},\n\n` +
                  `Welcome to Your Hospital!\n\n` +
                  `Your login credentials:\n` +
                  `Email: ${newHospitalStaff.hospitalStaffEmail}\n` +
                  `Password: ${newHospitalStaff.hospitalStaffPassword}\n\n` +
                  `Thank you for joining us!`,
          };

          transporter.sendMail(mailOptions, (emailError, info) => {
            if (emailError) {
              console.error('Error sending welcome email:', emailError);

              // Clean up code for uploaded images
              fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
              fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));

              return res.status(500).json({ error: 'Failed to send welcome email. Internal server error.' });
            } else {
              console.log('Welcome email sent:', info.response);
              return res.status(201).json({ message: 'Hospital Staff registered successfully', data: registrationResponse.data });
            }
          });

        } catch (error) {
          // Clean up code for uploaded images
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffProfileImageFile.filename));
          fs.unlinkSync(path.join('Files/HospitalStaffImages', staffIdProofImageFile.filename));

          if (
            error.message === "Hospital ID does not exist" ||
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
    console.error('Error during hospital staff registration:', error);

    // Clean up code for uploaded images
    if (req.files) {
      fs.unlinkSync(path.join('Files/HospitalStaffImages', req.files['hospitalStaffProfileImage'][0].filename));
      fs.unlinkSync(path.join('Files/HospitalStaffImages', req.files['hospitalStaffIdProofImage'][0].filename));
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};
// Function to validate the Hospital Staffr registration equest
function validateHospitalStaffRegistration(staffData, staffProfileImageFile, staffIdProofImageFile) {
  const validationResults = {
    isValid: true,
    messages: [],
  };

  const idValidation = dataValidator.isValidId(staffData.hospitalId);
  if (!idValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalId', message: idValidation.message });
  }

  const nameValidation = dataValidator.isValidName(staffData.hospitalStaffName);
  if (!nameValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalStaffName', message: nameValidation.message });
  }

  const emailValidation = dataValidator.isValidEmail(staffData.hospitalStaffEmail);
  if (!emailValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalStaffEmail', message: emailValidation.message });
  }

  const aadharValidation = dataValidator.isValidAadharNumber(staffData.hospitalStaffAadhar);
  if (!aadharValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalStaffAadhar', message: aadharValidation.message });
  }

  const mobileValidation = dataValidator.isValidMobileNumber(staffData.hospitalStaffMobile);
  if (!mobileValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalStaffMobile', message: mobileValidation.message });
  }
  const addressValidation = dataValidator.isValidAddress(staffData.hospitalStaffAddress);
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

  const passwordValidation = dataValidator.isValidPassword(staffData.hospitalStaffPassword);
  if (!passwordValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalPassword', message: passwordValidation.message });
  }

  return validationResults;
}



// Delete Hospital Staff
exports.deleteHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token missing',
      });
    }

    const { hospitalId, hospitalStaffId } = req.body;

    jwt.verify(token, 'micadmin', async (err, decoded) => {
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

      try {
        const deleteResult = await Hospital.deleteStaff(hospitalStaffId);

        return res.status(200).json({
          status: 'success',
          message: 'Hospital Staff deleted successfully',
          data: { hospitalStaffId },
        });
      } catch (error) {
        if (error.message === 'Hospital Staff not found or already deleted') {
          return res.status(404).json({
            status: 'error',
            message: error.message,
          });
        } else {
          console.error('Error deleting hospital staff:', error);
          return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error during deleteHospitalStaff:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};





// Suspend Hospital Staff
exports.suspendHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token missing',
      });
    }

    const { hospitalId, hospitalStaffId } = req.body;

    jwt.verify(token, 'micadmin', async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token',
        });
      }

      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized access to suspend hospital staff',
        });
      }

      try {
        const suspendResult = await Hospital.suspendStaff(hospitalStaffId);

        return res.status(200).json({
          status: 'success',
          message: 'Hospital Staff suspended successfully',
          data: { hospitalStaffId },
        });
      } catch (error) {
        if (error.message === 'Hospital Staff not found, already deleted, or already suspended') {
          return res.status(404).json({
            status: 'error',
            message: error.message,
          });
        } else {
          console.error('Error suspending hospital staff:', error);
          return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error during suspendHospitalStaff:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};


// Unsuspend Hospital Staff
exports.unSuspendHospitalStaff = async (req, res) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token missing',
      });
    }

    const { hospitalId, hospitalStaffId } = req.body;

    jwt.verify(token, 'micadmin', async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token',
        });
      }

      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: 'error',
          message: 'Unauthorized access to unsuspend hospital staff',
        });
      }

      try {
        const unsuspendResult = await Hospital.unSuspendStaff(hospitalStaffId);

        return res.status(200).json({
          status: 'success',
          message: 'Hospital Staff unsuspended successfully',
          data: { hospitalStaffId },
        });
      } catch (error) {
        if (error.message === 'Hospital Staff not found, already deleted, or not suspended') {
          return res.status(404).json({
            status: 'error',
            message: error.message,
          });
        } else {
          console.error('Error unsuspending hospital staff:', error);
          return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
          });
        }
      }
    });
  } catch (error) {
    console.error('Error during unSuspendHospitalStaff:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};






// Update Hospital Staff
exports.updateHospitalStaff = async (req, res) => {
  try {
      const token = req.headers.token;

      if (!token) {
          return res.status(401).json({ status: "Token missing" });
      }

      const { hospitalStaffId, hospitalId, hospitalStaffName, hospitalStaffMobile, hospitalStaffAddress, hospitalStaffAadhar } = req.body;

      jwt.verify(token, "micadmin", async (err, decoded) => {
          if (err) {
              return res.status(401).json({ status: "Invalid token" });
          }

          if (decoded.hospitalId != hospitalId) {
              return res.status(403).json({
                  status: "error",
                  message: "Unauthorized access to update hospital staff",
              });
          }

          const validationResults = validateHospitalStaffUpdate(req.body);
          if (!validationResults.isValid) {
              return res.status(400).json({ status: "Validation failed", data: validationResults.messages });
          }

          const updatedHospitalStaff = {
              hospitalStaffId,
              hospitalId,
              hospitalStaffName,
              hospitalStaffMobile,
              hospitalStaffAddress,
              hospitalStaffAadhar,
          };

          try {
              const updateResponse = await Hospital.updateStaff(updatedHospitalStaff);

              return res.status(200).json({
                  status: "success",
                  message: "Hospital Staff updated successfully",
                  data: updateResponse.updatedData,
              });
          } catch (error) {
              if (error.message === "Hospital not found, is not active, or has been deleted" || error.message === "Hospital Staff not found, is not active, or has been deleted" || error.message === "Aadhar Number Already Exists.") {
                  return res.status(404).json({ status: error.message });
              } else {
                  return res.status(500).json({
                      status: "Failed to update hospital staff",
                      error: error,
                  });
              }
          }
      });
  } catch (error) {
      console.error("Error during update hospital staff:", error);
      return res.status(500).json({ status: "Internal server error" });
  }
};
// Function to validate the Hospital Staff update request
function validateHospitalStaffUpdate(hospitalStaffData) {
  const validationResults = {
    isValid: true,
    messages: [],
  };

  const nameValidation = dataValidator.isValidName(hospitalStaffData.hospitalStaffName);
  if (!nameValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalStaffName', message: nameValidation.message });
  }

  const idValidation = dataValidator.isValidId(hospitalStaffData.hospitalStaffId);
  if (!idValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalStaffId', message: idValidation.message });
  }

  const hospitalIdValidation = dataValidator.isValidId(hospitalStaffData.hospitalId);
  if (!hospitalIdValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalId', message: hospitalIdValidation.message });
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

  const aadharValidation = dataValidator.isValidAadharNumber(hospitalStaffData.hospitalStaffAadhar);
  if (!aadharValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalStaffAadhar', message: aadharValidation.message });
  }

  return validationResults;
}




// View All Hospital Staffs
exports.viewAllHospitalStaffs = async (req, res) => {
  try {
      const { hospitalId } = req.body;

      const token = req.headers.token;
      if (!token) {
          return res.status(401).json({
              status: 'error',
              message: 'Token missing',
          });
      }

      jwt.verify(token, 'micadmin', async (err, decoded) => {
          if (err) {
              return res.status(401).json({
                  status: 'error',
                  message: 'Invalid token',
              });
          }

          if (decoded.hospitalId != hospitalId) {
              return res.status(403).json({
                  status: 'error',
                  message: 'Unauthorized access to view hospital staff details',
              });
          }

          try {
              const allStaffs = await Hospital.viewAllStaffs(hospitalId);

              return res.status(200).json({
                  status: 'success',
                  message: 'All Hospital Staffs retrieved successfully',
                  data: allStaffs.data,
              });
          } catch (error) {
              console.error('Error viewing all hospital staffs:', error);
              return res.status(500).json({
                  status: 'error',
                  message: 'Internal server error',
              });
          }
      });
  } catch (error) {
      console.error('Error during viewAllHospitalStaffs:', error);
      return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
      });
  }
};




// View One Hospital Staff
exports.viewOneHospitalStaff = async (req, res) => {
  try {
      const { hospitalId, hospitalStaffId } = req.body;
      
      const token = req.headers.token;
      if (!token) {
          return res.status(401).json({
              status: 'error',
              message: 'Token missing',
          });
      }

      jwt.verify(token, 'micadmin', async (err, decoded) => {
          if (err) {
              return res.status(401).json({
                  status: 'error',
                  message: 'Invalid token',
              });
          }

          if (decoded.hospitalId != hospitalId) {
              return res.status(403).json({
                  status: 'error',
                  message: 'Unauthorized access to view hospital staff details',
              });
          }

          try {
              const staffDetails = await Hospital.viewOneStaff(hospitalStaffId);

              return res.status(200).json({
                  status: 'success',
                  message: 'Hospital Staff details retrieved successfully',
                  data: staffDetails.data,
              });
          } catch (error) {
              if (error.message === 'Hospital Staff not found or already deleted') {
                  return res.status(404).json({
                      status: 'error',
                      message: error.message,
                  });
              } else {
                  console.error('Error viewing hospital staff details:', error);
                  return res.status(500).json({
                      status: 'error',
                      message: 'Internal server error',
                  });
              }
          }
      });
  } catch (error) {
      console.error('Error during viewOneHospitalStaff:', error);
      return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
      });
  }
};



// Hospital Search Staff
exports.searchHospitalStaff = async (req, res) => {
  try {
      const { hospitalId, searchQuery } = req.body;

      const token = req.headers.token;
      if (!token) {
          return res.status(401).json({
              status: 'error',
              message: 'Token missing',
          });
      }

      jwt.verify(token, 'micadmin', async (err, decoded) => {
          if (err) {
              return res.status(401).json({
                  status: 'error',
                  message: 'Invalid token',
              });
          }

          if (decoded.hospitalId != hospitalId) {
              return res.status(403).json({
                  status: 'error',
                  message: 'Unauthorized access to search hospital staff',
              });
          }

          try {
              if (!searchQuery) {
                  return res.status(400).json({
                      status: 'error',
                      message: 'Search query is required',
                  });
              }

              const searchResult = await Hospital.searchStaff(hospitalId, searchQuery);

              if (searchResult.length === 0) {
                  return res.status(404).json({
                      status: 'success',
                      message: 'Nothing found',
                  });
              }

              return res.status(200).json({
                  status: 'success',
                  message: 'Hospital Staffs found successfully',
                  data: searchResult,
              });
          } catch (error) {
              console.error('Error searching hospital staff:', error);
              return res.status(500).json({
                  status: 'error',
                  message: 'Internal server error',
              });
          }
      });
  } catch (error) {
      console.error('Error during searchHospitalStaff:', error);
      return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
      });
  }
};





// Add Hospital News
exports.addHospitalNews = async (req, res) => {
  try {
    const token = req.headers.token;
    jwt.verify(token, 'micadmin', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
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
          return res.status(400).json({ error: 'File upload failed', details: err.message });
        }

        const newsData = req.body;
        const newsImageFile = req.file;

        const validationResults = validateNewsData(newsData, newsImageFile);
        if (!validationResults.isValid) {
          if (newsImageFile) {
            const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(400).json({ error: 'Validation failed', details: validationResults.messages });
        }

        if (newsData.hospitalId != decoded.hospitalId) {
          if (newsImageFile) {
            const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
            fs.unlinkSync(imagePath);
          }
          return res.status(401).json({ error: 'Unauthorized to add hospital news' });
        }

        const newHospitalNews = {
          hospitalId: decoded.hospitalId, 
          hospitalNewsTitle: newsData.hospitalNewsTitle,
          hospitalNewsContent: newsData.hospitalNewsContent,
          hospitalNewsImage: newsImageFile ? newsImageFile.filename : null,
          addedDate: new Date(),
          updatedDate: null,
          deleteStatus: 0,
          updateStatus : 0,
          isHided: 0,
        };

        try {
          const addedNews = await Hospital.addNews(decoded.hospitalId, newHospitalNews);
          return res.status(201).json({ message: 'Hospital News added successfully', data: addedNews });
        } catch (error) {
          if (error.message === "Hospital not found, is not active, or has been deleted") {
            if (newsImageFile) {
              const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
              fs.unlinkSync(imagePath);
            }
            return res.status(404).json({ error: error.message });
          } else {
            if (newsImageFile) {
              const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', newsImageFile.filename);
              fs.unlinkSync(imagePath);
            }
            throw error; 
          }
        }
      });
    });
  } catch (error) {
    console.error('Error during adding hospital news:', error);
        if (req.file) {
      const imagePath = path.join('Files/HospitalImages/HospitalNewsImages', req.file.filename);
      fs.unlinkSync(imagePath);
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};
// Function to validate the news data
function validateNewsData(newsData, newsImageFile) {
  const validationResults = {
    isValid: true,
    messages: [],
  };

  const idValidation = dataValidator.isValidId(newsData.hospitalId);
  if (!idValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalId', message: idValidation.message });
  }

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



// Hospital Delete News
exports.deleteHospitalNews = async (req, res) => {
  try {
      const { hospitalId, hospitalNewsId } = req.body;

      const token = req.headers.token;
      if (!token) {
          return res.status(401).json({
              status: 'error',
              message: 'Token missing',
          });
      }

      jwt.verify(token, 'micadmin', async (err, decoded) => {
          if (err) {
              return res.status(401).json({
                  status: 'error',
                  message: 'Invalid token',
              });
          }

          if (decoded.hospitalId != hospitalId) {
              return res.status(403).json({
                  status: 'error',
                  message: 'Unauthorized access to delete hospital news',
              });
          }

          try {
              const deleteResult = await Hospital.deleteNews(hospitalNewsId, hospitalId);

              if (deleteResult.status === 'success') {
                  return res.status(200).json({
                      status: deleteResult.status,
                      message: deleteResult.message,
                  });
              } else {
                  return res.status(404).json({
                      status: deleteResult.status,
                      message: deleteResult.message,
                  });
              }
          } catch (error) {
              console.error('Error deleting hospital news:', error);
              return res.status(500).json({
                  status: 'error',
                  message: 'Internal server error',
              });
          }
      });
  } catch (error) {
      console.error('Error during deleteHospitalNews:', error);
      return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
      });
  }
};







// Hospital Hide News
exports.hideHospitalNews = async (req, res) => {
  try {
      const { hospitalId, hospitalNewsId } = req.body;

      // Check if hospitalId and hospitalNewsId are present
      if (!hospitalId || !hospitalNewsId) {
          return res.status(400).json({
              status: 'error',
              message: 'Both hospitalId and hospitalNewsId are required in the request body',
          });
      }

      const token = req.headers.token;
      if (!token) {
          return res.status(401).json({
              status: 'error',
              message: 'Token missing',
          });
      }

      jwt.verify(token, 'micadmin', async (err, decoded) => {
          if (err) {
              return res.status(401).json({
                  status: 'error',
                  message: 'Invalid token',
              });
          }

          if (decoded.hospitalId != hospitalId) {
              return res.status(403).json({
                  status: 'error',
                  message: 'Unauthorized access to hide hospital news',
              });
          }

          try {
              const hideResult = await Hospital.hideNews(hospitalNewsId, hospitalId);

              return res.status(200).json({
                  status: 'success',
                  message: hideResult.message,
              });
          } catch (error) {
              console.error('Error hiding hospital news:', error);

              if (error.message === 'Hospital News is already hidden') {
                  return res.status(200).json({
                      status: 'success',
                      message: error.message,
                  });
              } else if (error.message === 'Failed to hide Hospital News') {
                  return res.status(500).json({
                      status: 'error',
                      message: 'Failed to hide Hospital News',
                  });
              } else {
                  return res.status(500).json({
                      status: 'error',
                      message: 'Internal server error',
                  });
              }
          }
      });
  } catch (error) {
      console.error('Error during hideHospitalNews:', error);
      return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
      });
  }
};




// Hospital Unhide News
exports.unhideHospitalNews = async (req, res) => {
  try {
      const { hospitalId, hospitalNewsId } = req.body;

      const token = req.headers.token;
      if (!token) {
          return res.status(401).json({
              status: 'error',
              message: 'Token missing',
          });
      }

      jwt.verify(token, 'micadmin', async (err, decoded) => {
          if (err) {
              return res.status(401).json({
                  status: 'error',
                  message: 'Invalid token',
              });
          }

          if (decoded.hospitalId != hospitalId) {
              return res.status(403).json({
                  status: 'error',
                  message: 'Unauthorized access to unhide hospital news',
              });
          }

          try {
              const unhideResult = await Hospital.unhideNews(hospitalNewsId, hospitalId);

              return res.status(200).json({
                  status: 'success',
                  message: unhideResult.message,
              });
          } catch (error) {
              console.error('Error unhiding hospital news:', error);

              if (error.message === 'Hospital News is not hidden') {
                  return res.status(200).json({
                      status: 'success',
                      message: error.message,
                  });
              } else if (error.message === 'Failed to unhide Hospital News') {
                  return res.status(500).json({
                      status: 'error',
                      message: 'Failed to unhide Hospital News',
                  });
              } else {
                  return res.status(500).json({
                      status: 'error',
                      message: 'Internal server error',
                  });
              }
          }
      });
  } catch (error) {
      console.error('Error during unhideHospitalNews:', error);
      return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
      });
  }
};


//update hnews