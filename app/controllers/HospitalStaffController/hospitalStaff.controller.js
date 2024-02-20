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
  const token = req.headers.token;

  if (!token) {
    return res.status(403).json({
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
      }).single("hospitalStaffIdProofImage");

      uploadIdProofImage(req, res, async (err) => {
        if (err || !req.file) {
          return res.status(400).json({
            status: "error",
            message: "File upload failed",
            results: err ? err.message : "File is required.",
          });
        }

        const { hospitalStaffId } = req.body;

        if (!hospitalStaffId) {
          // Delete the uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(401).json({
            status: "failed",
            message: "Hospital Staff ID is missing",
          });
        }

        if (decoded.hospitalStaffId != hospitalStaffId) {
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
            validationResults.errors["hospitalStaffIdProofImage"] = imageValidation.message;
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
          const fileName = `hospitalStaffIdProof-${Date.now()}${path.extname(file.originalname)}`;
          const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `hospitalStaffImages/${fileName}`,
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

          await HospitalStaff.changeIdProofImage(
            hospitalStaffId,
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
            Key: `hospitalStaffImages/${key}` // Constructing the full key
          };
          await s3Client.send(new DeleteObjectCommand(params));

          // Delete the uploaded file
          fs.unlinkSync(req.file.path);

          if (error.message === "Hospital staff not found") {
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
// UPDATE PROFILE IMAGE
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
    process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
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
      }).single("hospitalStaffProfileImage");

      uploadProfileImage(req, res, async (err) => {
        if (err || !req.file) {
          return res.status(400).json({
            status: "error",
            message: "File upload failed",
            results: err ? err.message : "File is required.",
          });
        }

        const { hospitalStaffId } = req.body;

        if (!hospitalStaffId) {
          // Delete the uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(401).json({
            status: "failed",
            message: "Hospital Staff ID is missing",
          });
        }

        if (decoded.hospitalStaffId != hospitalStaffId) {
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
            validationResults.errors["hospitalStaffProfileImage"] = imageValidation.message;
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
          const fileName = `hospitalStaffProfile-${Date.now()}${path.extname(file.originalname)}`;
          const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `hospitalStaffImages/${fileName}`,
            Body: file.buffer,
            ACL: "public-read",
            ContentType: file.mimetype,
          };
        
          const command = new PutObjectCommand(uploadParams);
          const result = await s3Client.send(command);
          return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        }
        
        try {
          const profileImageFileLocation = await uploadFileToS3(req.file);

          await HospitalStaff.changeProfileImage(
            hospitalStaffId,
            profileImageFileLocation
          );
          return res.status(200).json({
            status: "success",
            message: "Profile image updated successfully",
          });
        } catch (error) {
          // Delete the uploaded image from S3
          const key = profileImageFileLocation.split('/').pop(); // Extracting the filename from the URL
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `hospitalStaffImages/${key}` // Constructing the full key
          };
          await s3Client.send(new DeleteObjectCommand(params));

          // Delete the uploaded file
          fs.unlinkSync(req.file.path);

          if (error.message === "Hospital staff not found") {
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
  const token = req.headers.token;

  if (!token) {
      return res.status(403).json({
          status: "failed",
          message: "Token is missing"
      });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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

      const uploadPatientImages = multer({
          storage: multer.memoryStorage(),
      }).fields([
          { name: "patientIdProofImage", maxCount: 1 },
          { name: "patientProfileImage", maxCount: 1 }
      ]);

      uploadPatientImages(req, res, async function (err) {
          if (err) {
              return res.status(400).json({
                  status: "validation failed",
                  results: { files: "File upload failed", details: err.message },
              });
          }
          console.log(req.files);

          const patientData = req.body;

          if (!decoded.hospitalStaffId != patientData.hospitalStaffId) {
            return res.status(403).json({
                status: "failed",
                message: "Unauthorized access"
            });
        }

          patientData.patientAadhar = patientData.patientAadhar ? patientData.patientAadhar.replace(/\s/g, '') : '';
          patientData.patientMobile = patientData.patientMobile ? patientData.patientMobile.replace(/\s/g, '') : '';

          if (!req.files || !req.files["patientIdProofImage"] || !req.files["patientProfileImage"]) {
            return res.status(400).json({
                status: "validation failed",
                error: "Patient ID proof image and profile image are required",
            });
        }

          const idProofImageFile = req.files["patientIdProofImage"][0];
          const profileImageFile = req.files["patientProfileImage"][0];

          const validationResults = validatePatientRegistration(patientData, idProofImageFile, profileImageFile);

          if (!validationResults.isValid) {
              if (idProofImageFile && idProofImageFile.filename) {
                  const idProofImagePath = path.join("Files/PatientImages", idProofImageFile.filename);
                  fs.unlinkSync(idProofImagePath);
              }
              if (profileImageFile && profileImageFile.filename) {
                  const profileImagePath = path.join("Files/PatientImages", profileImageFile.filename);
                  fs.unlinkSync(profileImagePath);
              }
              if (patientData.patientIdProofImage) {
                  const idProofS3Key = patientData.patientIdProofImage.split('/').pop();
                  const idProofParams = {
                      Bucket: process.env.S3_BUCKET_NAME,
                      Key: `PatientImages/${idProofS3Key}`
                  };
                  try {
                      await s3Client.send(new DeleteObjectCommand(idProofParams));
                  } catch (s3Error) {
                      console.error("Error deleting ID proof image from S3:", s3Error);
                  }
              }
              if (patientData.patientProfileImage) {
                  const profileS3Key = patientData.patientProfileImage.split('/').pop();
                  const profileParams = {
                      Bucket: process.env.S3_BUCKET_NAME,
                      Key: `PatientImages/${profileS3Key}`
                  };
                  try {
                      await s3Client.send(new DeleteObjectCommand(profileParams));
                  } catch (s3Error) {
                      console.error("Error deleting profile image from S3:", s3Error);
                  }
              }
              return res.status(400).json({
                  status: "validation failed",
                  results: validationResults.errors,
              });
          }

          const idProofFileName = `patientIdProof-${Date.now()}${path.extname(idProofImageFile.originalname)}`;
          const profileImageFileName = `patientProfileImage-${Date.now()}${path.extname(profileImageFile.originalname)}`;

          try {
              const idProofFileLocation = await uploadFileToS3(idProofImageFile, idProofFileName, idProofImageFile.mimetype);
              const profileImageFileLocation = await uploadFileToS3(profileImageFile, profileImageFileName, profileImageFile.mimetype);

              patientData.patientIdProofImage = idProofFileLocation;
              patientData.patientProfileImage = profileImageFileLocation;

              const registrationResponse = await HospitalStaff.registerPatient(patientData);
              return res.status(200).json({
                  status: "success",
                  message: "Patient registered successfully",
                  data: registrationResponse,
              });
          } catch (error) {
              if (error.name === "ValidationError") {
                  if (patientData.patientIdProofImage) {
                      const idProofS3Key = patientData.patientIdProofImage.split('/').pop();
                      const idProofParams = {
                          Bucket: process.env.S3_BUCKET_NAME,
                          Key: `PatientImages/${idProofS3Key}`
                      };
                      try {
                          await s3Client.send(new DeleteObjectCommand(idProofParams));
                      } catch (s3Error) {
                          console.error("Error deleting ID proof image from S3:", s3Error);
                      }
                  }
                  if (patientData.patientProfileImage) {
                      const profileS3Key = patientData.patientProfileImage.split('/').pop();
                      const profileParams = {
                          Bucket: process.env.S3_BUCKET_NAME,
                          Key: `PatientImages/${profileS3Key}`
                      };
                      try {
                          await s3Client.send(new DeleteObjectCommand(profileParams));
                      } catch (s3Error) {
                          console.error("Error deleting profile image from S3:", s3Error);
                      }
                  }
                  return res.status(422).json({
                      status: "failed",
                      message: "Validation error during registration",
                      errors: error.errors,
                  });
              } else {
                  return res.status(500).json({
                      status: "error",
                      message: "Internal server error during registration",
                      error: error.message,
                  });
              }
          }
      });
  });

  async function uploadFileToS3(fileBuffer, fileName, mimeType) {
      const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `PatientImages/${fileName}`,
          Body: fileBuffer.buffer,
          ACL: "public-read",
          ContentType: mimeType,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
  }

  function validatePatientRegistration(patientData, idProofImageFile, profileImageFile) {
      const validationResults = {
          isValid: true,
          errors: {},
      };

      const nameValidation = dataValidator.isValidName(patientData.patientName);
      if (!nameValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["patientName"] = nameValidation.message;
      }

      const emailValidation = dataValidator.isValidEmail(patientData.patientEmail);
      if (!emailValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["patientEmail"] = emailValidation.message;
      }

      const aadharValidation = dataValidator.isValidAadharNumber(patientData.patientAadhar);
      if (!aadharValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["patientAadhar"] = aadharValidation.message;
      }

      const mobileValidation = dataValidator.isValidMobileNumber(patientData.patientMobile);
      if (!mobileValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["patientMobile"] = mobileValidation.message;
      }

      const passwordValidation = dataValidator.isValidPassword(patientData.patientPassword);
      if (!passwordValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["patientPassword"] = passwordValidation.message;
      }

      const addressValidation = dataValidator.isValidAddress(patientData.patientAddress);
      if (!passwordValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["patientAddress"] = addressValidation.message;
      }

      const idProofImageValidation =  dataValidator.isValidImageWith1MBConstraint(idProofImageFile);
      if (!idProofImageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["patientIdProofImage"] = idProofImageValidation.message;
      }

      const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(profileImageFile);
      if (!profileImageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["patientProfileImage"] = profileImageValidation.message;
      }

      return validationResults;
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