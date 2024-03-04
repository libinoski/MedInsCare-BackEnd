// hospitalStaff.controller.js
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const dataValidator = require("../../config/data.validate");
const fs = require("fs");
const { HospitalStaff, MedicalRecord } = require("../../models/HospitalStaffModel/hospitalStaff.model");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
//
//
//
//
//
// BUCKET CONFIGURATION
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
//
//
//
//
// HOSPITAL STAFF LOGIN
exports.login = async (req, res) => {
  const { hospitalStaffEmail, hospitalStaffPassword } = req.body;

  function validateHospitalStaffLogin() {
    const validationResults = {
      isValid: true,
      errors: {},
    };

    // Validate email
    const emailValidation = dataValidator.isValidEmail(hospitalStaffEmail);
    if (!emailValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffEmail"] = [emailValidation.message];
    }

    // Validate password
    const passwordValidation = dataValidator.isValidPassword(hospitalStaffPassword);
    if (!passwordValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffPassword"] = [passwordValidation.message];
    }

    return validationResults;
  }

  const validationResults = validateHospitalStaffLogin();
  if (!validationResults.isValid) {
    return res.status(400).json({
      status: "failed",
      message: "Validation failed",
      results: validationResults.errors
    });
  }

  try {
    const hospitalStaff = await HospitalStaff.login(hospitalStaffEmail, hospitalStaffPassword);

    const token = jwt.sign(
      {
        hospitalStaffId: hospitalStaff.hospitalStaffId,
        hospitalStaffEmail: hospitalStaff.hospitalStaffEmail,
      },
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: { token, hospitalStaff },
    });
  } catch (error) {
    console.error("Error during hospital staff login:", error);

    if (error.message === "Hospital staff not found" || error.message === "Wrong password") {
      return res.status(422).json({
        status: "failed",
        message: "Login failed",
        error: error.message
      });
    }

    return res.status(500).json({
      status: "failed",
      message: "Internal server error",
      error: error.message,
    });
  }
};
//
//
//
//
// HOSPITAL STAFF CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const token = req.headers.token;
  const { hospitalStaffId, oldPassword, newPassword } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalId is missing
  if (!hospitalStaffId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital staff ID is missing"
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

      if (decoded.hospitalStaffId != hospitalStaffId) {
        return res.status(403).json({
          status: "failed",
          message: "Unauthorized access"
        });
      }

      try {
        function validateHospitalStaffChangePassword() {
          const validationResults = {
            isValid: true,
            errors: {},
          };

          // Validate old password
          const passwordValidation = dataValidator.isValidPassword(oldPassword);
          if (!passwordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["oldPassword"] = [passwordValidation.message];
          }

          // Validate new password
          const newPasswordValidation = dataValidator.isValidPassword(newPassword);
          if (!newPasswordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["newPassword"] = [newPasswordValidation.message];
          }

          return validationResults;
        }

        const validationResults = validateHospitalStaffChangePassword();
        if (!validationResults.isValid) {
          return res.status(400).json({
            status: "failed",
            message: "Validation failed",
            results: validationResults.errors
          });
        }

        await HospitalStaff.changePassword(hospitalStaffId, oldPassword, newPassword);
        return res.status(200).json({
          status: "success",
          message: "Password changed successfully"
        });
      } catch (error) {
        if (
          error.message === "Hospital staff not found" ||
          error.message === "Incorrect old password"
        ) {
          return res.status(422).json({
            status: "failed",
            message: "Password change failed",
            error: error.message
          });
        } else {
          console.error("Error changing hospital staff password:", error);
          return res.status(500).json({
            status: "failed",
            message: "Internal server error",
            error: error.message
          });
        }
      }
    }
  );
};
//
//
//
//
// HOSPITAL STAFF CHANGE ID PROOF IMAGE
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
        if (err) {
          return res.status(400).json({
            status: "error",
            message: "File upload failed",
            results: err.message,
          });
        }

        const { hospitalStaffId } = req.body;

        if (!hospitalStaffId) {
          return res.status(401).json({
            status: "failed",
            message: "Hospital Staff ID is missing",
          });
        }

        if (decoded.hospitalStaffId != hospitalStaffId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        const validationResults = validateIdProofImage(req.file);
        if (!validationResults.isValid) {
          return res.status(400).json({
            status: "error",
            message: "Invalid image file",
            results: validationResults.errors,
          });
        }

        try {
          const idProofFileLocation = await uploadFileToS3(req.file);
          await HospitalStaff.changeIdProofImage(hospitalStaffId, idProofFileLocation);
          return res.status(200).json({
            status: "success",
            message: "ID proof image updated successfully",
          });
        } catch (error) {
          console.error("Error updating ID proof image:", error);

          // Delete uploaded image from S3 if it exists
          if (req.file) {
            const s3Key = req.file.location.split('/').pop(); // Extract filename from S3 URL
            const params = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `hospitalStaffImages/${s3Key}`
            };
            try {
              await s3Client.send(new DeleteObjectCommand(params));
            } catch (s3Error) {
              console.error("Error deleting image from S3:", s3Error);
            }
          }

          // Delete uploaded image from local storage
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }

          // Handle specific errors
          if (error.message === "Hospital staff not found") {
            return res.status(422).json({
              status: "failed",
              message: "Hospital staff not found",
              error: error.message
            });
          } else {
            return res.status(500).json({
              status: "error",
              message: "Failed to update ID proof image",
              error: error.message,
            });
          }
        }
      });

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
        await s3Client.send(command);
        return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
      }

      function validateIdProofImage(file) {
        const validationResults = {
          isValid: true,
          errors: {},
        };

        if (!file) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffIdProofImage"] = ["ID proof image is required"];
        } else {
          const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);
          if (!imageValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffIdProofImage"] = [imageValidation.message];
          }
        }

        return validationResults;
      }
    }
  );
};
//
//
//
//
// HOSPITAL STAFF CHANGE PROFILE IMAGE
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
        if (err) {
          return res.status(400).json({
            status: "error",
            message: "File upload failed",
            results: err.message,
          });
        }

        const { hospitalStaffId } = req.body;

        if (!hospitalStaffId) {
          return res.status(401).json({
            status: "failed",
            message: "Hospital Staff ID is missing",
          });
        }

        if (decoded.hospitalStaffId != hospitalStaffId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        const validationResults = validateProfileImage(req.file);
        if (!validationResults.isValid) {
          return res.status(400).json({
            status: "error",
            message: "Invalid image file",
            results: validationResults.errors,
          });
        }

        try {
          const profileFileLocation = await uploadFileToS3(req.file);
          await HospitalStaff.changeProfileImage(hospitalStaffId, profileFileLocation);
          return res.status(200).json({
            status: "success",
            message: "Profile image updated successfully",
          });
        } catch (error) {
          console.error("Error updating profile image:", error);

          // Delete uploaded image from S3 if it exists
          if (req.file) {
            const s3Key = req.file.location.split('/').pop(); // Extract filename from S3 URL
            const params = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `hospitalStaffImages/${s3Key}`
            };
            try {
              await s3Client.send(new DeleteObjectCommand(params));
            } catch (s3Error) {
              console.error("Error deleting image from S3:", s3Error);
            }
          }

          // Delete uploaded image from local storage
          if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
          }

          // Handle specific errors
          if (error.message === "Hospital staff not found") {
            return res.status(422).json({
              status: "failed",
              message: "Hospital staff not found",
              error: error.message
            });
          } else {
            return res.status(500).json({
              status: "error",
              message: "Failed to update profile image",
              error: error.message,
            });
          }
        }
      });

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
        await s3Client.send(command);
        return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
      }

      function validateProfileImage(file) {
        const validationResults = {
          isValid: true,
          errors: {},
        };

        if (!file) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffProfileImage"] = ["Profile image is required"];
        } else {
          const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);
          if (!imageValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffProfileImage"] = [imageValidation.message];
          }
        }

        return validationResults;
      }
    }
  );
};
//
//
//
//
// HOSPITAL STAFF VIEW PROFILE
exports.viewProfile = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
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
// HOSPITAL STAFF UPDATE PROFILE
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

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
      });
    }

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

        // Clean Aadhar and mobile data
        const cleanedAadhar = hospitalStaffAadhar.replace(/\s/g, '');
        const cleanedMobile = hospitalStaffMobile.replace(/\s/g, '');

        // Validate hospital staff profile update data
        function validateHospitalStaffUpdateProfile() {
          const validationResults = {
            isValid: true,
            errors: {}
          };

          const nameValidation = dataValidator.isValidName(hospitalStaffName);
          if (!nameValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffName"] =
              [nameValidation.message];
          }

          const aadharValidation = dataValidator.isValidAadharNumber(cleanedAadhar);
          if (!aadharValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffAadhar"] =
              [aadharValidation.message];
          }

          const mobileValidation = dataValidator.isValidMobileNumber(cleanedMobile);
          if (!mobileValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffMobile"] =
              [mobileValidation.message];
          }

          const addressValidation = dataValidator.isValidAddress(
            hospitalStaffAddress
          );
          if (!addressValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffAddress"] =
              [addressValidation.message];
          }

          return validationResults;
        }

        const validationResults = validateHospitalStaffUpdateProfile();

        if (!validationResults.isValid) {
          return res.status(400).json({
            status: "failed",
            message: "Validation failed",
            results: validationResults.errors,
          });
        }

        // Update hospital staff profile
        try {
          const updatedHospitalStaff = {
            hospitalStaffId,
            hospitalStaffName,
            hospitalStaffMobile: cleanedMobile,
            hospitalStaffAddress,
            hospitalStaffAadhar: cleanedAadhar,
          };
          const data = await HospitalStaff.updateProfile(updatedHospitalStaff);

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
// HOSPITAL STAFF VIEW ALL NEWS
exports.viewAllNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(403).json({
              status: "error",
              message: "Invalid token"
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(403).json({
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

        try {
          // Check if decoded token matches hospitalStaffId from request body
          if (decoded.hospitalStaffId != hospitalStaffId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const allNewsData = await HospitalStaff.viewAllNews(hospitalStaffId); // Using the viewAllNews method from the model
          return res.status(200).json({
            status: "success",
            message: "All hospital news retrieved successfully",
            data: allNewsData,
          });
        } catch (error) {
          console.error("Error viewing all hospital news:", error);

          if (error.message === "Hospital staff not found" || error.message === "Hospital not found or inactive") {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          }

          return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
          });
        }
      }
    );
  } catch (error) {
    console.error("Error during viewAllHospitalNews:", error);
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
//
// HOSPITAL STAFF VIEW ONE NEWS
exports.viewOneNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId, hospitalNewsId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital staff ID is missing"
      });
    }

    // Check if hospitalNewsId is missing
    if (!hospitalNewsId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital News ID is missing"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL_STAFF,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(403).json({
              status: "error",
              message: "Invalid token"
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(403).json({
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

        try {
          // Check if decoded token matches hospitalStaffId from request body
          if (decoded.hospitalStaffId != hospitalStaffId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const newsItemData = await HospitalStaff.viewOneNews(
            hospitalNewsId,
            hospitalStaffId
          );
          return res.status(200).json({
            status: "success",
            message: "Hospital news retrieved successfully",
            data: newsItemData,
          });
        } catch (error) {
          console.error("Error viewing one hospital news:", error);
          if (
            error.message === "Hospital news not found" ||
            error.message === "Hospital not found" ||
            error.message === "Hospital staff not found"
          ) {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else {
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
    console.error("Error during viewOneHospitalNews:", error);
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
//
//HOSPITAL STAFF VIEW ALL NOTIFICATIONS FROM HOSPITAL
exports.viewAllNotifications = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
      });
    }

    // Verifying the token
    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          return res.status(403).json({
            status: "error",
            message: "Invalid token"
          });
        } else if (err.name === "TokenExpiredError") {
          return res.status(403).json({
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

      try {
        // Check if decoded token matches hospitalStaffId from request body
        if (decoded.hospitalStaffId != hospitalStaffId) {
          return res.status(403).json({
            status: "error",
            message: "Unauthorized access"
          });
        }

        const notifications = await HospitalStaff.viewAllNotifications(hospitalStaffId);

        return res.status(200).json({
          status: "success",
          message: "All notifications retrieved successfully",
          data: notifications
        });
      } catch (error) {
        // Handle specific errors returned by the model
        if (error.message === "Hospital staff not found") {
          return res.status(422).json({
            status: "error",
            message: "Hospital staff not found"
          });
        } else if (error.message === "No notifications found for this hospital staff") {
          return res.status(422).json({
            status: "error",
            message: "No notifications found for this hospital staff"
          });
        }

        console.error("Error viewing all notifications for hospital staff:", error);
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error("Error during viewAllNotifications:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
};
//
//
//
//
//
// HOSPITAL STAFF VIEW ONE NOTIFICATION FROM HOSPITAL
exports.viewOneNotification = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId, notificationId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
      });
    }

    // Check if notificationId is missing
    if (!notificationId) {
      return res.status(401).json({
        status: "failed",
        message: "Notification ID is missing"
      });
    }

    // Verifying the token
    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          return res.status(403).json({
            status: "error",
            message: "Invalid token"
          });
        } else if (err.name === "TokenExpiredError") {
          return res.status(403).json({
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

      try {
        // Check if decoded token matches hospitalStaffId from request body
        if (decoded.hospitalStaffId != hospitalStaffId) {
          return res.status(403).json({
            status: "error",
            message: "Unauthorized access"
          });
        }

        const notification = await HospitalStaff.viewOneNotification(notificationId, hospitalStaffId);
        return res.status(200).json({
          status: "success",
          message: "Notification retrieved successfully",
          data: notification
        });
      } catch (error) {
        console.error("Error viewing one notification for hospital staff:", error);
        if (error.message === "Notification not found" || error.message === "Hospital staff not found") {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        } else {
          return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message
          });
        }
      }
    });
  } catch (error) {
    console.error("Error during viewOneNotification:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
};
//
//
//
//
//
// HOSPITAL STAFF REGISTER PATIENT
exports.registerPatient = async (req, res) => {
  const token = req.headers.token;

  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
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

      const patientData = req.body;

      if (!patientData.hospitalStaffId) {
        return res.status(401).json({
          status: "failed",
          message: "Hospital Staff ID is missing"
        });
      }

      if (decoded.hospitalStaffId != patientData.hospitalStaffId) {
        return res.status(403).json({
          status: "failed",
          message: "Unauthorized access"
        });
      }

      // Clean up patient data
      if (patientData.patientAadhar) {
        patientData.patientAadhar = patientData.patientAadhar.replace(/\s/g, '');
      }
      if (patientData.patientMobile) {
        patientData.patientMobile = patientData.patientMobile.replace(/\s/g, '');
      }

      const idProofImageFile = req.files["patientIdProofImage"] ? req.files["patientIdProofImage"][0] : null;
      const profileImageFile = req.files["patientProfileImage"] ? req.files["patientProfileImage"][0] : null;

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
        const idProofFileLocation = await uploadFileToS3(idProofImageFile.buffer, idProofFileName, idProofImageFile.mimetype);
        const profileImageFileLocation = await uploadFileToS3(profileImageFile.buffer, profileImageFileName, profileImageFile.mimetype);

        // Assign S3 URLs to patientData instead of file names
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
            error: error.errors,
          });
        } else {
          if (idProofImageFile && idProofImageFile.filename) {
            const idProofImagePath = path.join("Files/PatientImages", idProofImageFile.filename);
            fs.unlinkSync(idProofImagePath);
          }
          if (profileImageFile && profileImageFile.filename) {
            const profileImagePath = path.join("Files/PatientImages", profileImageFile.filename);
            fs.unlinkSync(profileImagePath);
          }
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
    try {
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `PatientImages/${fileName}`,
        Body: fileBuffer,
        ACL: "public-read",
        ContentType: mimeType,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
    } catch (error) {
      throw error;
    }
  }

  function validatePatientRegistration(patientData, idProofImageFile, profileImageFile) {
    const validationResults = {
      isValid: true,
      errors: {},
    };

    const nameValidation = dataValidator.isValidName(patientData.patientName);
    if (!nameValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientName"] = [nameValidation.message];
    }

    const emailValidation = dataValidator.isValidEmail(patientData.patientEmail);
    if (!emailValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientEmail"] = [emailValidation.message];
    }

    const aadharValidation = dataValidator.isValidAadharNumber(patientData.patientAadhar);
    if (!aadharValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientAadhar"] = [aadharValidation.message];
    }

    const mobileValidation = dataValidator.isValidMobileNumber(patientData.patientMobile);
    if (!mobileValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientMobile"] = [mobileValidation.message];
    }

    const passwordValidation = dataValidator.isValidPassword(patientData.patientPassword);
    if (!passwordValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientPassword"] = [passwordValidation.message];
    }

    const genderValidation = dataValidator.isValidGender(patientData.patientGender);
    if (!genderValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientGender"] = [genderValidation.message];
    }

    const ageValidation = dataValidator.isValidAge(patientData.patientAge);
    if (!ageValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientAge"] = [ageValidation.message];
    }

    const addressValidation = dataValidator.isValidAddress(patientData.patientAddress);
    if (!addressValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientAddress"] = [addressValidation.message];
    }

    const idProofImageValidation = dataValidator.isValidImageWith1MBConstraint(idProofImageFile);
    if (!idProofImageValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientIdProofImage"] = [idProofImageValidation.message];
    }

    const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(profileImageFile);
    if (!profileImageValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["patientProfileImage"] = [profileImageValidation.message];
    }

    return validationResults;
  }
};

//
//
//
//
// HOSPITAL STAFF VIEW ONE PATIENT
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
// HOSPITAL STAFF VIEW ALL PATIENTS
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
// HOSPITAL STAFF SEARCH PATIENTS
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
//
//
//
//
// HOSPITAL STAFF SEND NOTIFICATION TO PATIENT
exports.sendNotificationToPatient = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId, patientId, notificationMessage } = req.body;

    if (!token) {
      return res.status(403).json({
        status: "error",
        message: "Token is missing"
      });
    }

    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "error",
        message: "Hospital Staff ID is missing"
      });
    }
    if (!patientId) {
      return res.status(401).json({
        status: "error",
        message: "Patient ID is missing"
      });
    }
    if (!notificationMessage) {
      return res.status(401).json({
        status: "error",
        message: "Notification message is missing"
      });
    }

    // Token verification
    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          return res.status(403).json({
            status: "error",
            message: "Invalid or missing token"
          });
        } else if (err.name === "TokenExpiredError") {
          return res.status(403).json({
            status: "error",
            message: "Token has expired"
          });
        } else {
          return res.status(403).json({
            status: "error",
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


      // Function to validate notification message
      function validateNotificationData(notificationMessage) {
        const validationResults = {
          isValid: true,
          errors: {},
        };

        const messageValidation = dataValidator.isValidMessage(notificationMessage);
        if (!messageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["notificationMessage"] = messageValidation.message;
        }

        return validationResults;
      }

      const validationResults = validateNotificationData(notificationMessage);

      if (!validationResults.isValid) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          results: validationResults.errors
        });
      }

      try {
        const notificationDetails = await HospitalStaff.sendNotificationToPatient(hospitalStaffId, patientId, notificationMessage);

        return res.status(200).json({
          status: "success",
          message: "Notification sent successfully",
          data: notificationDetails
        });
      } catch (error) {
        console.error("Error sending notification to patient:", error);

        if (error.message === "Hospital Staff not found or not active" || error.message === "Patient not found or not active") {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        }

        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error("Error in sendNotificationToPatient controller:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
};
//
//
//
//
//
// HOSPITAL STAFF ADD MEDICAL RECORD
exports.addMedicalRecord = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId, patientId, staffReport, medicineAndLabCosts, byStanderName, byStanderMobileNumber } = req.body;

    if (!token) {
      return res.status(403).json({
        status: "error",
        message: "Token is missing"
      });
    }

    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "error",
        message: "Hospital Staff ID is missing"
      });
    }
    
    if (!patientId) {
      return res.status(401).json({
        status: "error",
        message: "Patient ID is missing"
      });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL_STAFF, async (err, decoded) => {
      if (err) {
        if (err.name === "JsonWebTokenError") {
          return res.status(403).json({
            status: "error",
            message: "Invalid or missing token"
          });
        } else if (err.name === "TokenExpiredError") {
          return res.status(403).json({
            status: "error",
            message: "Token has expired"
          });
        } else {
          return res.status(403).json({
            status: "error",
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

      const recordDetails = {
        staffReport,
        medicineAndLabCosts,
        byStanderName,
        byStanderMobileNumber
      };

      const validationResults = validateMedicalRecordData(recordDetails);

      if (!validationResults.isValid) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          results: validationResults.errors
        });
      }

      try {
        const medicalRecordDetails = await HospitalStaff.addMedicalRecord(hospitalStaffId, patientId, recordDetails);
        return res.status(200).json({
          status: "success",
          message: "Medical record added successfully",
          data: medicalRecordDetails
        });
      } catch (error) {
        console.error("Error adding medical record:", error);
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error("Error in addMedicalRecord controller:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }

  function validateMedicalRecordData(data) {
    const validationResults = {
      isValid: true,
      errors: {}
    };

    const staffReportValidation = dataValidator.isValidText(data.staffReport);
    if (!staffReportValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["staffReport"] = [staffReportValidation.message];
    }

    const medicineAndLabCostsValidation = dataValidator.isValidCost(data.medicineAndLabCosts);
    if (!medicineAndLabCostsValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["medicineAndLabCosts"] = [medicineAndLabCostsValidation.message];
    }

    const byStanderNameValidation = dataValidator.isValidName(data.byStanderName);
    if (!byStanderNameValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["byStanderName"] = [byStanderNameValidation.message];
    }

    const byStanderMobileNumberValidation = dataValidator.isValidMobileNumber(data.byStanderMobileNumber);
    if (!byStanderMobileNumberValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["byStanderMobileNumber"] = [byStanderMobileNumberValidation.message];
    }

    return validationResults;
  }
};





//
//
//
//
//
// HOSPITAL STAFF  REQUEST DISCHARGE OF ONE PATIENT
exports.requestDischarge = async (req, res) => {
  try {
    const { hospitalStaffId, patientId, message } = req.body;
    const token = req.headers.token;

    if (!token) {
      return res.status(403).json({
        status: "error",
        message: "Token is missing"
      });
    }

    // Validate presence of necessary fields
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "error",
        message: "Hospital Staff ID is required"
      });
    }
    if (!patientId) {
      return res.status(401).json({
        status: "error",
        message: "Patient ID is required"
      });
    }

    // Token verification
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

      // Function to validate discharge message
      function validateDischargeData(dischargeMessage) {
        const validationResults = {
          isValid: true,
          errors: {},
        };

        const messageValidation = dataValidator.isValidMessage(dischargeMessage);
        if (!messageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["message"] = messageValidation.message;
        }

        return validationResults;
      }

      const validationResults = validateDischargeData(message);

      if (!validationResults.isValid) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: validationResults.errors
        });
      }

      try {
        const success = await HospitalStaff.requestDischarge(hospitalStaffId, patientId, message);
        if (success) {
          return res.status(200).json({
            status: "success",
            message: "Discharge request submitted successfully"
          });
        }
      } catch (error) {
        if (error.message === "Hospital staff not found or not active" || error.message === "Patient not found or already discharged") {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        }

        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error("Error in requestDischarge controller:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
};
//
//
//
//
// HOSPITAL STAFF VIEW ALL APPROVED DISCHARGE REQUESTS
exports.viewAllApprovedDischargeRequests = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalStaffId } = req.body; // Assuming hospitalStaffId is sent in the request body. Adjust as needed.

    // Token validation
    if (!token) {
      return res.status(403).json({
        status: "error",
        message: "Token is missing"
      });
    }

    // Validate hospitalStaffId presence
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "error",
        message: "Hospital Staff ID is required"
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
        // Fetch approved discharge requests
        const approvedDischargeRequests = await HospitalStaff.viewAllApprovedDischargeRequests(hospitalStaffId);
        return res.status(200).json({
          status: "success",
          message: "Approved discharge requests retrieved successfully",
          data: approvedDischargeRequests
        });
      } catch (error) {
        if (error.message === "Hospital staff not found or not active") {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        }

        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error("Error in viewApprovedDischargeRequests controller:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
};
//
//
//
//
//

