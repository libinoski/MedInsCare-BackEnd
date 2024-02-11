// hospitalStaff.controller.js
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const dataValidator = require("../../config/data.validate");
const fs = require("fs");
const { HospitalStaff } = require("../../models/HospitalStaffModel/hospitalStaff.model");
//
//
//
//
// LOGIN
exports.login = async (req, res) => {
  const { hospitalStaffEmail, hospitalStaffPassword } = req.body;

  const emailValidation = dataValidator.isValidEmail(hospitalStaffEmail);
  const passwordValidation = dataValidator.isValidPassword(
    hospitalStaffPassword
  );

  const validationResults = {
    isValid: true,
    errors: {},
  };

  if (!passwordValidation.isValid) {
    validationResults.isValid = false;
    validationResults.errors["hospitalStaffPassword"] = [
      passwordValidation.message,
    ];
  }

  if (!emailValidation.isValid) {
    validationResults.isValid = false;
    validationResults.errors["hospitalStaffEmail"] = [emailValidation.message];
  }

  if (!validationResults.isValid) {
    return res.status(400).json({
      status: "Validation failed",
      message: "Invalid input data",
      results: validationResults.errors,
    });
  }

  try {
    const hospitalStaff = await HospitalStaff.login(
      hospitalStaffEmail,
      hospitalStaffPassword
    );

    const token = jwt.sign(
      {
        hospitalStaffId: hospitalStaff.hospitalStaffId,
        hospitalStaffEmail: hospitalStaff.hospitalStaffEmail,
      },
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      status: "Success",
      message: "Login successful",
      data: { token, hospitalStaff },
    });
  } catch (error) {
    if (
      error.message === "Hospital staff not found" ||
      error.message === "You are not permitted to login" ||
      error.message === "Invalid password" ||
      error.message === "Hospital staff account is deleted"
    ) {
      return res.status(422).json({
        status: "Failure",
        message: "Authentication failed",
        error: error.message,
      });
    } else if (
      error.message === "The associated hospital is not active" ||
      error.message === "The associated hospital is deleted"
    ) {
      return res.status(422).json({
        status: "Failure",
        message: "Authentication failed",
        error: error.message,
      });
    } else {
      console.error("Error during hospital staff login:", error);
      return res.status(500).json({
        status: "Error",
        message: "Internal server error",
        details: "An internal server error occurred during login",
      });
    }
  }
};
//
//
//
//
// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId, oldPassword, newPassword } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    // Verify the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "failed",
              message: "Invalid token",
              error: "Token verification failed",
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              status: "failed",
              message: "Token has expired"
            });
          } else {
            console.error("Error changing staff password:", err);
            return res.status(403).json({
              status: "failed",
              message: "Unauthorized access"
            });
          }
        }

        // Check if decoded token matches hospitalStaffId from request body
        if (decoded.hospitalStaffId != hospitalStaffId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Validate the password data
        function validateHospitalStaffChangePassword(passwordData) {
          const validationResults = {
            isValid: true,
            errors: {},
          };

          const passwordValidation = dataValidator.isValidPassword(
            passwordData.oldPassword
          );
          if (!passwordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["oldPassword"] =
              passwordValidation.message;
          }

          const newPasswordValidation = dataValidator.isValidPassword(
            passwordData.newPassword
          );
          if (!newPasswordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["newPassword"] =
              newPasswordValidation.message;
          }

          return validationResults;
        }

        const validationResults = validateHospitalStaffChangePassword({
          oldPassword,
          newPassword,
        });

        if (!validationResults.isValid) {
          return res.status(400).json({
            status: "failed",
            message: "Validation failed",
            results: validationResults.errors,
          });
        }

        // Change password
        try {
          await HospitalStaff.changePassword(
            hospitalStaffId,
            oldPassword,
            newPassword
          );
          return res.status(200).json({
            status: "success",
            message: "Password changed successfully",
          });
        } catch (error) {
          if (
            error.message === "Staff not found" ||
            error.message === "Invalid old password"
          ) {
            return res.status(422).json({
              status: "failed",
              error: error.message
            });
          } else {
            console.error("Error changing staff password:", error);
            return res.status(500).json({
              status: "error",
              message: "Failed to change password",
              error: error.message,
            });
          }
        }
      }
    );
  } catch (error) {
    console.error("Error changing staff password:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to change password",
      error: error.message,
    });
  }
};
//
//
//
//
// UPDATE ID PROOF IMAGE
exports.changeIdProofImage = async (req, res) => {
  try {
    const token = req.headers.token;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Verify the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
      async (err, decoded) => {
        if (err) {
          // Handle token verification errors
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "error",
              message: "Invalid token",
              error: "Token verification failed",
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              status: "error",
              message: "Token has expired"
            });
          } else {
            console.error("Error during ID proof image change:", err);
            return res.status(403).json({
              status: "failed",
              message: "Unauthorized access"
            });
          }
        }

        // Set up storage for ID proof image
        const idProofImageStorage = multer.diskStorage({
          destination: function (req, file, cb) {
            cb(null, "Files/HospitalStaffIdProofImages");
          },
          filename: function (req, file, cb) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `hospitalStaffIdProof-${uniqueSuffix}${ext}`);
          },
        });

        const uploadIdProofImage = multer({
          storage: idProofImageStorage,
        }).single("hospitalStaffIdProofImage");

        // Use Multer middleware to handle the file upload and form data parsing
        uploadIdProofImage(req, res, async (err) => {
          if (err || !req.file) {
            // Handle file upload errors
            return res.status(400).json({
              status: "error",
              message: "File upload failed",
              results: err ? err.message : "File is required.",
            });
          }

          // Now you can safely access req.body here after Multer processed the form data
          const { hospitalStaffId } = req.body;

          // Check if hospitalStaffId is missing after form data is processed
          if (!hospitalStaffId) {
            return res.status(400).json({
              status: "failed",
              results: "Hospital Staff ID is missing",
            });
          }

          // Check if decoded token matches hospitalStaffId from request body
          if (decoded.hospitalStaffId != hospitalStaffId) {
            return res.status(403).json({
              status: "failed",
              message: "Unauthorized access"
            });
          }

          // Validate ID proof image
          function validateIdProofImage(file) {
            const validationResults = {
              isValid: true,
              errors: {},
            };

            const imageValidation =
              dataValidator.isValidImageWith1MBConstraint(file);
            if (!imageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffIdProofImage"] =
                imageValidation.message;
            }

            return validationResults;
          }

          const validationResults = validateIdProofImage(req.file);
          if (!validationResults.isValid) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
              status: "error",
              message: "Invalid image file",
              results: validationResults.errors,
            });
          }

          // Change ID proof image
          try {
            await HospitalStaff.changeIdProofImage(
              hospitalStaffId,
              req.file.filename
            );
            return res.status(200).json({
              status: "success",
              message: "ID proof image updated successfully",
            });
          } catch (error) {
            if (error.message === "Hospital staff not found") {
              return res.status(422).json({
                status: "error",
                error: error.message
              });
            } else {
              fs.unlinkSync(req.file.path);
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
  } catch (error) {
    console.error("Error during ID proof image change:", error);
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
// UPDATE PROFILE IMAGE
exports.changeProfileImage = async (req, res) => {
  try {
    const token = req.headers.token;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Verify the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
      async (err, decoded) => {
        if (err) {
          // Handle token verification errors
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "error",
              message: "Invalid token",
              error: "Token verification failed",
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

        // Set up storage for profile image
        const profileImageStorage = multer.diskStorage({
          destination: (req, file, cb) =>
            cb(null, "Files/HospitalStaffProfileImages"),
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `hospitalStaffProfile-${uniqueSuffix}${ext}`);
          },
        });

        const uploadProfileImage = multer({
          storage: profileImageStorage,
        }).single("hospitalStaffProfileImage");

        // Use Multer middleware to handle the file upload and form data parsing
        uploadProfileImage(req, res, async (err) => {
          if (err || !req.file) {
            // Handle file upload errors
            return res.status(400).json({
              status: "error",
              message: "File upload failed",
              details: err ? err.message : "File is required.",
            });
          }

          // Now you can safely access req.body here after Multer processed the form data
          const { hospitalStaffId } = req.body;

          // Check if hospitalStaffId is missing after form data is processed
          if (!hospitalStaffId) {
            return res.status(400).json({
              status: "failed",
              results: "Hospital Staff ID is missing",
            });
          }

          // Check if decoded token matches hospitalStaffId from request body
          if (decoded.hospitalStaffId != hospitalStaffId) {
            return res.status(403).json({
              status: "failed",
              message: "Unauthorized access"
            });
          }

          // Validate the profile image file
          function validateProfileImage(file) {
            const validationResults = {
              isValid: true,
              errors: {},
            };

            const imageValidation =
              dataValidator.isValidImageWith1MBConstraint(file);
            if (!imageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffProfileImage"] =
                imageValidation.message;
            }

            return validationResults;
          }

          const validationResults = validateProfileImage(req.file);
          if (!validationResults.isValid) {
            fs.unlinkSync(req.file.path); // Cleanup uploaded file
            return res.status(400).json({
              status: "error",
              message: "Invalid image file",
              results: validationResults.errors,
            });
          }

          // Change profile image
          try {
            await HospitalStaff.changeProfileImage(
              hospitalStaffId,
              req.file.filename
            );
            return res.status(200).json({
              status: "success",
              message: "Profile image updated successfully",
            });
          } catch (error) {
            if (
              error.message ===
              "Failed to update profile image or staff not found."
            ) {
              // Check for specific error message
              return res.status(422).json({
                status: "error",
                error: error.message
              });
            } else {
              fs.unlinkSync(req.file.path); // Cleanup on error
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
  } catch (error) {
    console.error("Error during profile image change:", error);
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
// VIEW PROFILE
exports.viewProfile = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    // Verify the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
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

        // Check if decoded token matches hospitalStaffId from request body
        if (decoded.hospitalStaffId != hospitalStaffId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Fetch staff profile data
        try {
          const staffProfileData = await HospitalStaff.viewProfile(
            hospitalStaffId
          );
          return res.status(200).json({
            status: "success",
            message: "Hospital staff profile retrieved successfully",
            data: staffProfileData
          });
        } catch (error) {
          if (error.message === "Hospital staff not found") {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else {
            console.error("Error fetching hospital profile:", error);
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
      hospitalStaffId,
      hospitalStaffName,
      hospitalStaffMobile,
      hospitalStaffAddress,
      hospitalStaffAadhar,
    } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    // Verify the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
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

        // Check if decoded token matches hospitalStaffId from request body
        if (decoded.hospitalStaffId != hospitalStaffId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Validate hospital staff profile update data
        function validateHospitalStaffUpdateProfile(hospitalStaffData) {
          const validationResults = {
            isValid: true,
            errors: {}
          };

          const idValidation = dataValidator.isValidId(
            hospitalStaffData.hospitalStaffId
          );
          if (!idValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffId"] = idValidation.message;
          }

          const nameValidation = dataValidator.isValidName(
            hospitalStaffData.hospitalStaffName
          );
          if (!nameValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffName"] =
              nameValidation.message;
          }

          const aadharValidation = dataValidator.isValidAadharNumber(
            hospitalStaffData.hospitalStaffAadhar
          );
          if (!aadharValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffAadhar"] =
              aadharValidation.message;
          }

          const mobileValidation = dataValidator.isValidMobileNumber(
            hospitalStaffData.hospitalStaffMobile
          );
          if (!mobileValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffMobile"] =
              mobileValidation.message;
          }

          const addressValidation = dataValidator.isValidAddress(
            hospitalStaffData.hospitalStaffAddress
          );
          if (!addressValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffAddress"] =
              addressValidation.message;
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
          return res.status(400).json({
            status: "Validation failed",
            message: "One or more fields failed validation",
            results: validationResults.errors,
          });
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

          return res.status(200).json({
            status: "success",
            message: "Hospital staff updated successfully",
            data,
          });
        } catch (error) {
          if (error.message === "Hospital Staff not found") {
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
            console.error("Error updating hospital staff profile:", error);
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
// REGISTER PATIENT
exports.registerPatient = async (req, res) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
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

        const patientImagesStorage = multer.diskStorage({
          destination: function (req, file, cb) {
            cb(null, "Files/PatientImages");
          },
          filename: function (req, file, cb) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);

            if (file.fieldname === "patientProfileImage") {
              const fileName = "patientProfileImage-" + uniqueSuffix + ext;
              cb(null, fileName);
              req.patientProfileImageFileName = fileName;
            } else if (file.fieldname === "patientIdProofImage") {
              const fileName = "patientIdProofImage-" + uniqueSuffix + ext;
              cb(null, fileName);
              req.patientIdProofImageFileName = fileName;
            }
          },
        });

        const uploadPatientImages = multer({
          storage: patientImagesStorage,
        }).fields([
          { name: "patientProfileImage", maxCount: 1 },
          { name: "patientIdProofImage", maxCount: 1 },
        ]);

        uploadPatientImages(req, res, async (err) => {
          if (err) {
            return res.status(400).json({
              status: "error",
              message: "File upload failed",
              results: err.message,
            });
          }

          const hospitalStaffId = req.body.hospitalStaffId;

          if (!hospitalStaffId) {
            return res.status(400).json({
              status: "failed",
              results: "Hospital Staff ID is missing",
            });
          }

          if (decoded.hospitalStaffId != hospitalStaffId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const patientData = req.body;

          function validatePatientRegistration(
            patientData,
            patientProfileImageFile,
            patientIdProofImageFile
          ) {
            const validationResults = {
              isValid: true,
              messages: {},
            };

            // Validate hospitalStaffId
            const staffIdValidation = dataValidator.isValidHospitalStaffId(
              patientData.hospitalStaffId
            );
            if (!staffIdValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["hospitalStaffId"] =
                staffIdValidation.message;
            }

            // Validate patientName
            const nameValidation = dataValidator.isValidName(
              patientData.patientName
            );
            if (!nameValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientName"] =
                nameValidation.message;
            }

            // Validate patientEmail
            const emailValidation = dataValidator.isValidEmail(
              patientData.patientEmail
            );
            if (!emailValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientEmail"] =
                emailValidation.message;
            }

            // Validate patientAge
            const ageValidation = dataValidator.isValidAge(
              patientData.patientAge
            );
            if (!ageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientAge"] = ageValidation.message;
            }

            // Validate patientGender
            const genderValidation = dataValidator.isValidGender(
              patientData.patientGender
            );
            if (!genderValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientGender"] =
                genderValidation.message;
            }

            // Validate patientAadhar
            const aadharValidation = dataValidator.isValidAadharNumber(
              patientData.patientAadhar
            );
            if (!aadharValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientAadhar"] =
                aadharValidation.message;
            }

            // Validate patientMobile
            const mobileValidation = dataValidator.isValidMobileNumber(
              patientData.patientMobile
            );
            if (!mobileValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientMobile"] =
                mobileValidation.message;
            }

            // Validate patientAddress
            const addressValidation = dataValidator.isValidAddress(
              patientData.patientAddress
            );
            if (!addressValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientAddress"] =
                addressValidation.message;
            }

            // Validate patientProfileImage
            const profileImageValidation =
              dataValidator.isValidImageWith1MBConstraint(
                patientProfileImageFile
              );
            if (!profileImageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientProfileImage"] =
                profileImageValidation.message;
            }

            // Validate patientIdProofImage
            const idProofImageValidation =
              dataValidator.isValidImageWith1MBConstraint(
                patientIdProofImageFile
              );
            if (!idProofImageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientIdProofImage"] =
                idProofImageValidation.message;
            }

            // Validate patientPassword
            const passwordValidation = dataValidator.isValidPassword(
              patientData.patientPassword
            );
            if (!passwordValidation.isValid) {
              validationResults.isValid = false;
              validationResults.messages["patientPassword"] =
                passwordValidation.message;
            }

            return validationResults;
          }

          const validationResults = validatePatientRegistration(
            patientData,
            req.files["patientProfileImage"][0],
            req.files["patientIdProofImage"][0]
          );

          if (!validationResults.isValid) {
            cleanupUploadedFiles(req);
            return res.status(400).json({
              status: "error",
              message: "Validation failed",
              results: validationResults.messages,
            });
          }

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
            patientPassword: patientData.patientPassword,
            patientRegisteredDate: new Date(),
            patientDischargedDate: patientData.patientDischargedDate,
            updatedDate: null,
            dischargeStatus: 0,
            updateStatus: 0,
            passwordUpdateStatus: 0,
          };

          try {
            const registrationResponse = await HospitalStaff.registerPatient(
              newPatient
            );
            return res.status(200).json({
              status: "success",
              message: "Patient registered successfully",
              data: registrationResponse,
            });
          } catch (error) {
            cleanupUploadedFiles(req);
            if (error.name === "ValidationError") {
              return res.status(422).json({
                status: "error",
                message: "Validation failed",
                error: error.errors,
              });
            } else {
              throw error;
            }
          }
        });
      }
    );
  } catch (error) {
    console.error("Error during hospital patient registration:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }

  function cleanupUploadedFiles(req) {
    if (
      req.files &&
      req.files["patientProfileImage"] &&
      req.files["patientProfileImage"][0]
    ) {
      fs.unlinkSync(
        path.join(
          "Files/PatientImages",
          req.files["patientProfileImage"][0].filename
        )
      );
    }
    if (
      req.files &&
      req.files["patientIdProofImage"] &&
      req.files["patientIdProofImage"][0]
    ) {
      fs.unlinkSync(
        path.join(
          "Files/PatientImages",
          req.files["patientIdProofImage"][0].filename
        )
      );
    }
  }
};
//
//
//
//
// VIEW ONE PATIENT
exports.viewOnePatient = async (req, res) => {
  try {
    const { hospitalStaffId, patientId } = req.body;
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    if (!patientId) {
      return res.status(400).json({
        status: "failed",
        results: "Patient ID is missing"
      });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
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

      if (decoded.hospitalStaffId != hospitalStaffId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized access"
        });
      }

      try {
        const patientData = await HospitalStaff.viewOnePatient(hospitalStaffId, patientId);
        return res.status(200).json({
          status: "success",
          message: "Patient retrieved successfully",
          data: patientData,
        });
      } catch (error) {
        if (error.message === "Patient not found") {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        } else if (
          error.message === "The associated hospital staff is suspended" ||
          error.message === "The associated hospital is not active" ||
          error.message === "The associated hospital is deleted"
        ) {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        }
        console.error("Error viewing one patient:", error);
        return res.status(500).json({
          status: "error",
          message: "Internal server error"
        });
      }
    });
  } catch (error) {
    console.error("Error during viewOnePatient:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};

//
//
//
//
// VIEW ALL PATIENTS
exports.viewAllPatients = async (req, res) => {
  try {
    const token = req.headers.token;
    const hospitalStaffId = req.body.hospitalStaffId;

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            status: "error",
            message: "Invalid token",
            error: "Token verification failed",
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

      if (decoded.hospitalStaffId != hospitalStaffId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized access"
        });
      }

      try {
        const allPatientsData = await HospitalStaff.viewAllPatients(hospitalStaffId);
        return res.status(200).json({
          status: "success",
          message: "All patients are retrieved successfully",
          data: allPatientsData,
        });
      } catch (error) {
        console.error("Error viewing all patients:", error);
        if (
          error.message === "The associated hospital staff is suspended" ||
          error.message === "The associated hospital is not active" ||
          error.message === "The associated hospital is deleted"
        ) {
          return res.status(422).json({
            status: "failed",
            error: error.message
          });
        } else {
          return res.status(500).json({
            status: "error",
            message: "Internal server error"
          });
        }
      }
    });
  } catch (error) {
    console.error("Error during viewAllPatients:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};

//
//
//
//
// SEARCH PATIENTS
exports.searchPatients = async (req, res) => {
  try {
    const { hospitalStaffId, searchQuery } = req.body;
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    if (!searchQuery && searchQuery !== "") {
      return res.status(400).json({
        status: "failed",
        results: "Search query is required"
      });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            status: "error",
            message: "Invalid token"
          });
        } else if (err.name === "TokenExpiredError") {
          return res.status(401).json({
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

      if (decoded.hospitalStaffId != hospitalStaffId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized access"
        });
      }

      try {
        const patientData = await HospitalStaff.searchPatients(hospitalStaffId, searchQuery);

        return res.status(200).json({
          status: "success",
          message: "Patients retrieved successfully",
          data: patientData,
        });
      } catch (error) {
        if (error.message === 'No patients found') {
          return res.status(422).json({
            status: "failed",
            error: error.message
          });
        } else if (
          error.message === "Associated hospital not found" ||
          error.message === "Associated hospital is not active" ||
          error.message === "Associated hospital is marked as deleted"
        ) {
          return res.status(422).json({
            status: "failed",
            error: error.message
          });
        } else {
          console.error("Error searching patients:", error);
          return res.status(500).json({
            status: "error",
            message: "Internal server error"
          });
        }
      }
    });
  } catch (error) {
    console.error("Error during searchPatients:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
};