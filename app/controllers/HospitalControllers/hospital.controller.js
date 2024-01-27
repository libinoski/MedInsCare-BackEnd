// hospital.controller.js
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Hospital, HospitalNews } = require('../../models/HospitalModels/hospital.model');
const dataValidator = require('../../config/data.validate');
const bcrypt = require('bcrypt');







//Hospital Register
exports.hospitalRegister = async (req, res) => {
  try {
    // Multer configuration for hospital image upload
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

    // Multer middleware to handle file upload
    uploadHospitalImage(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ error: 'File upload failed', details: err.message });
      }

      // Use data from req.body and req.file
      const hospitalData = req.body;
      const hospitalImageFile = req.file;

      // Validate the request body and hospital image using data.validate.js functions
      const validationResults = validateHospitalRegistration(hospitalData, hospitalImageFile);
      if (!validationResults.isValid) {
        return res.status(400).json({ error: 'Validation failed', details: validationResults.messages });
      }

      // Construct the hospital object for registration
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

      // Register the hospital using the model function
      try {
        const registrationResponse = await Hospital.register(newHospital);

        // Respond with the registration details
        return res.status(201).json({ message: 'Hospital registered successfully', data: registrationResponse });
      } catch (error) {
        // Handle specific errors thrown by the model function
        if (error.message === "Hospital email already exists" || error.message === "Aadhar number already exists") {
          return res.status(400).json({ error: error.message });
        } else {
          throw error; // Propagate other errors
        }
      }
    });
  } catch (error) {
    console.error('Error during hospital registration:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
// Function to validate the hospital registration request
function validateHospitalRegistration(hospitalData, hospitalImageFile) {
  // Use data.validate.js functions to validate each field
  const validationResults = {
    isValid: true,
    messages: [],
  };

  // Validate hospital name
  const nameValidation = dataValidator.isValidName(hospitalData.hospitalName);
  if (!nameValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalName', message: nameValidation.message });
  }

  // Validate hospital email
  const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);
  if (!emailValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalEmail', message: emailValidation.message });
  }

  // Validate hospital Aadhar
  const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);
  if (!aadharValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalAadhar', message: aadharValidation.message });
  }

  // Validate hospital mobile number
  const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);
  if (!mobileValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalMobile', message: mobileValidation.message });
  }

  // Validate hospital website
  const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);
  if (!websiteValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalWebSite', message: websiteValidation.message });
  }

  // Validate hospital image
  const imageValidation = dataValidator.isValidImageWith1MBConstraint(hospitalImageFile);
  if (!imageValidation.isValid) {
    validationResults.isValid = false;
    validationResults.messages.push({ field: 'hospitalImage', message: imageValidation.message });
  }

  // Validate hospital password
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

  // Validate hospital email
  const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);
  if (!emailValidation.isValid) {
      return res.status(400).json({ status: 'Validation failed', details: emailValidation.message });
  }

  // Validate hospital password
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



//View Hospital Profile
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
      const decoded = jwt.verify(token, 'micadmin');

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
  const updateProfileToken = req.headers.token;

  if (!updateProfileToken) {
      return res.status(401).json({ status: "Token missing" });
  }

  try {
      const decoded = jwt.verify(updateProfileToken, "micadmin");

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

      // Validation
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

  // Validate hospital name
  const nameValidation = dataValidator.isValidName(hospitalData.hospitalName);
  if (!nameValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalName', message: nameValidation.message });
  }

  // Validate hospital website
  const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);
  if (!websiteValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalWebSite', message: websiteValidation.message });
  }

  // Validate hospital Aadhar
  const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);
  if (!aadharValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalAadhar', message: aadharValidation.message });
  }

  // Validate hospital mobile number
  const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);
  if (!mobileValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalMobile', message: mobileValidation.message });
  }

  // Validate hospital address
  const addressValidation = dataValidator.isValidAddress(hospitalData.hospitalAddress);
  if (!addressValidation.isValid) {
      validationResults.isValid = false;
      validationResults.messages.push({ field: 'hospitalAddress', message: addressValidation.message });
  }

  return validationResults;
}



//Register New Hospital Staff
exports.hospitalStaffRegister = async (req, res) => {
  try {
    // Extract the token from the request headers
    const token = req.headers.token;

    // Verify the JWT token
    jwt.verify(token, 'micadmin', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Continue with the registration process if the token is valid
      const staffImagesStorage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, 'Files/HospitalStaffImages');
        },
        filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          const fileName = 'hospitalStaffImage-' + uniqueSuffix + ext;
          cb(null, fileName);

          if (file.fieldname === 'hospitalStaffProfileImage') {
            req.hospitalStaffProfileImageFileName = fileName;
          } else if (file.fieldname === 'hospitalStaffIdProofImage') {
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
          return res.status(400).json({ error: 'File upload failed', details: err.message });
        }

        const staffProfileImageFile = req.files['hospitalStaffProfileImage'][0];
        const staffIdProofImageFile = req.files['hospitalStaffIdProofImage'][0];

        // Move the staffData declaration inside the try block or make sure it's available here
        const staffData = req.body;  // Assuming staffData is sent in the request body, adjust accordingly

        const validationResults = validateHospitalStaffRegistration(staffData, staffProfileImageFile, staffIdProofImageFile);
        if (!validationResults.isValid) {
          return res.status(400).json({ error: 'Validation failed', details: validationResults.messages });
        }

        // Extract hospitalId from the decoded token
        const hospitalIdFromToken = decoded.hospitalId;

        // Compare hospitalId from token with hospitalId in staffData
        if (staffData.hospitalId != hospitalIdFromToken) {
          return res.status(401).json({ error: 'Unauthorized access to hospital data' });
        }

        // Continue with the registration process if hospitalId matches
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
          isActive: 1,
          deleteStatus: 0,
          updateStatus: 0,
          passwordUpdateStatus: 0,
        };

        try {
          const registrationResponse = await Hospital.registerStaff(newHospitalStaff);

          return res.status(201).json({ message: 'Hospital Staff registered successfully', data: registrationResponse.data });
        } catch (error) {
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

  try {
      const decoded = jwt.verify(deleteStaffToken, 'micadmin');

      if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
              status: 'error',
              message: 'Unauthorized access to delete hospital staff',
          });
      }

      const deleteRes = await Hospital.deleteStaff(hospitalStaffId, hospitalId);

      return res.status(200).json({
          status: 'success',
          message: 'Hospital Staff deleted successfully',
          data: deleteRes,
      });
  } catch (error) {
      if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ status: 'error', message: 'Invalid token' });
      } else {
          console.error('Error deleting hospital staff:', error);
          return res.status(500).json({
              status: 'error',
              message: 'Failed to delete hospital staff',
              error: error.message,
          });
      }
  }
};



// Update Hospital Staff
exports.updateHospitalStaff = async (req, res) => {
  try {
      const updateStaffToken = req.headers.token;

      if (!updateStaffToken) {
          return res.status(401).json({ status: "Token missing" });
      }

      const { hospitalStaffId, hospitalId, hospitalStaffName, hospitalStaffMobile, hospitalStaffAddress, hospitalStaffAadhar } = req.body;

      jwt.verify(updateStaffToken, "micadmin", async (err, decoded) => {
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

  const hospitalStaffIdValidation = dataValidator.isValidId(hospitalStaffData.hospitalStaffId);
  if (!hospitalStaffIdValidation.isValid) validationResults.messages.push({ field: 'hospitalStaffId', message: hospitalStaffIdValidation.message });

  const hospitalIdValidation = dataValidator.isValidId(hospitalStaffData.hospitalId);
  if (!hospitalIdValidation.isValid) validationResults.messages.push({ field: 'hospitalId', message: hospitalIdValidation.message });

  const hospitalStaffNameValidation = dataValidator.isValidName(hospitalStaffData.hospitalStaffName);
  if (!hospitalStaffNameValidation.isValid) validationResults.messages.push({ field: 'hospitalStaffName', message: hospitalStaffNameValidation.message });

  const hospitalStaffMobileValidation = dataValidator.isValidMobileNumber(hospitalStaffData.hospitalStaffMobile);
  if (!hospitalStaffMobileValidation.isValid) validationResults.messages.push({ field: 'hospitalStaffMobile', message: hospitalStaffMobileValidation.message });

  const hospitalStaffAddressValidation = dataValidator.isValidAddress(hospitalStaffData.hospitalStaffAddress);
  if (!hospitalStaffAddressValidation.isValid) validationResults.messages.push({ field: 'hospitalStaffAddress', message: hospitalStaffAddressValidation.message });

  const hospitalStaffAadharValidation = dataValidator.isValidAadharNumber(hospitalStaffData.hospitalStaffAadhar);
  if (!hospitalStaffAadharValidation.isValid) validationResults.messages.push({ field: 'hospitalStaffAadhar', message: hospitalStaffAadharValidation.message });

  return validationResults;
}



// View All Hospital Staffs
exports.viewAllHospitalStaffs = async (req, res) => {
  const { hospitalId } = req.body;
  const token = req.headers.token;

  if (!hospitalId) {
    return res.status(400).json({
      status: 'error',
      message: 'Hospital ID is required in the request body',
    });
  }

  try {
    const decoded = jwt.verify(token, 'micadmin');

    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to view hospital staffs',
      });
    }

    // Retrieve all staff members of the hospital using a model function (replace with your actual model function)
    const allStaffs = await Hospital.getHospitalStaffs(hospitalId);

    return res.status(200).json({
      status: 'success',
      data: allStaffs,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    } else if (error.message === 'Hospital not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found',
      });
    } else {
      console.error('Error fetching hospital staffs:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
};



// View One Hospital Staff
exports.viewOneHospitalStaff = async (req, res) => {
  const { hospitalId, hospitalStaffId } = req.body;
  const token = req.headers.token;

  if (!hospitalId || !hospitalStaffId) {
    return res.status(400).json({
      status: 'error',
      message: 'Both hospitalId and hospitalStaffId are required in the request body',
    });
  }

  try {
    const decoded = jwt.verify(token, 'micadmin');

    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to view hospital staff',
      });
    }

    // Retrieve the specified hospital staff using a model function (replace with your actual model function)
    const hospitalStaff = await Hospital.viewOneStaff(hospitalId, hospitalStaffId);

    return res.status(200).json({
      status: 'success',
      data: hospitalStaff,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    } else if (error.message === 'Hospital not found' || error.message === 'Hospital Staff not found or has been deleted') {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    } else {
      console.error('Error fetching hospital staff:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
};


// Search Hospital Staff
exports.searchHospitalStaff = async (req, res) => {
  const { hospitalId, searchQuery } = req.body;
  const token = req.headers.token;

  if (!hospitalId || !searchQuery) {
    return res.status(400).json({
      status: 'error',
      message: 'Both hospitalId and searchQuery are required in the request body',
    });
  }

  try {
    const decoded = jwt.verify(token, 'micadmin');

    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to search hospital staff',
      });
    }

    // Search for hospital staff based on the criteria using a model function (replace with your actual model function)
    const searchResults = await Hospital.searchStaff(hospitalId, searchQuery);

    if (searchResults.length > 0) {
      // Matches found
      return res.status(200).json({
        status: 'success',
        message: 'Matches found in the search results',
        data: searchResults,
      });
    } else {
      // No matches found
      return res.status(200).json({
        status: 'Failed',
        message: 'No matches found in the search results',
        
      });
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    } else if (error.message === 'Hospital not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Hospital not found',
      });
    } else {
      console.error('Error searching hospital staff:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
};



// Add Hospital News
exports.addHospitalNews = async (req, res) => {
  try {
    // Extract the token from the request headers
    const token = req.headers.token;

    // Verify the JWT token
    jwt.verify(token, 'micadmin', async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Continue with the news addition process if the token is valid

      // Multer configuration for hospital news image upload
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

      // Multer middleware to handle file upload
      uploadNewsImage(req, res, async function (err) {
        if (err) {
          return res.status(400).json({ error: 'File upload failed', details: err.message });
        }

        // Use data from req.body and req.file
        const newsData = req.body;
        const newsImageFile = req.file;

        // Validate the request body and news image using data.validate.js functions
        const validationResults = validateNewsData(newsData, newsImageFile);
        if (!validationResults.isValid) {
          return res.status(400).json({ error: 'Validation failed', details: validationResults.messages });
        }

        if (newsData.hospitalId != decoded.hospitalId) {
          return res.status(401).json({ error: 'Unauthorized to add hospital news' });
        }

        // Construct the news object for adding
        const newHospitalNews = {
          hospitalId: decoded.hospitalId, // Use hospitalId from the decoded token
          hospitalNewsTitle: newsData.hospitalNewsTitle,
          hospitalNewsContent: newsData.hospitalNewsContent,
          hospitalNewsImage: newsImageFile ? newsImageFile.filename : null,
          addedDate: new Date(),
          updatedDate: null,
          deleteStatus: 0,
          isActive:1
        };

        // Add news using the model function
        try {
          const addedNews = await Hospital.addNews(decoded.hospitalId, newHospitalNews);

          // Respond with the added news details
          return res.status(201).json({ message: 'Hospital News added successfully', data: addedNews });
        } catch (error) {
          // Handle specific errors thrown by the model function
          if (error.message === "Hospital not found, is not active, or has been deleted") {
            return res.status(404).json({ error: error.message });
          } else {
            throw error; // Propagate other errors
          }
        }
      });
    });
  } catch (error) {
    console.error('Error during adding hospital news:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
// Function to validate the news data
function validateNewsData(newsData, newsImageFile) {
  // Use data.validate.js functions to validate each field
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



// Delete Hospital News
exports.deleteHospitalNews = async (req, res) => {
  const { hospitalNewsId, hospitalId } = req.body;

  if (!hospitalNewsId || !hospitalId) {
      return res.status(400).json({
          status: 'error',
          message: 'Both hospitalNewsId and hospitalId are required in the request body',
      });
  }

  const deleteNewsToken = req.headers.token;

  if (!deleteNewsToken) {
      return res.status(401).json({
          status: 'error',
          message: 'Token missing',
      });
  }

  try {
      const decoded = jwt.verify(deleteNewsToken, 'micadmin');

      if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
              status: 'error',
              message: 'Unauthorized access to delete hospital news',
          });
      }

      const result = await Hospital.deleteNews(hospitalNewsId, hospitalId);

      return res.status(200).json({
          status: 'success',
          message: result.message,
      });
  } catch (error) {
      if (error.message === "Hospital News not found or has been deleted") {
          return res.status(404).json({
              status: 'error',
              message: 'Hospital News not found',
          });
      } else if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ status: 'error', message: 'Invalid token' });
      } else {
          console.error('Error deleting hospital news:', error);
          return res.status(500).json({
              status: 'error',
              message: 'Failed to delete hospital news',
              error: error.message,
          });
      }
  }
};


