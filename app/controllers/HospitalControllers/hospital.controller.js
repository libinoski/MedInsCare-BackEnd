// hospital.controller.js
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Hospital } = require("../../models/HospitalModels/hospital.model");
const dataValidator = require("../../config/data.validate");
const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();
//
//
//
//
// Configure AWS SDK with credentials from .env file
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
//
//
//
//
// REGISTRATION
exports.register = async (req, res) => {
  try {
    const uploadHospitalImage = multer({
      storage: multer.memoryStorage(), // Store file in memory for uploading to S3
    }).single("hospitalImage");

    uploadHospitalImage(req, res, async function (err) {
      try {
        if (err) {
          return res.status(400).json({
            status: "validation failed",
            results: { file: "File upload failed", details: err.message },
          });
        }

        const hospitalData = req.body;
        const hospitalImageFile = req.file;

        function validateHospitalRegistration() {
          const validationResults = {
            isValid: true,
            errors: {},
          };

          // Validate hospital name
          const nameValidation = dataValidator.isValidName(hospitalData.hospitalName);
          if (!nameValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalName"] = nameValidation.message;
          }

          // Validate hospital email
          const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);
          if (!emailValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalEmail"] = emailValidation.message;
          }

          // Validate hospital Aadhar number
          const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);
          if (!aadharValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalAadhar"] = aadharValidation.message;
          }

          // Validate hospital mobile number
          const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);
          if (!mobileValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalMobile"] = mobileValidation.message;
          }

          // Validate hospital website
          const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);
          if (!websiteValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalWebSite"] = websiteValidation.message;
          }

          // Validate hospital address
          const addressValidation = dataValidator.isValidAddress(hospitalData.hospitalAddress);
          if (!addressValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalAddress"] = addressValidation.message;
          }

          // Validate hospital image
          console.log("Hospital image file:", hospitalImageFile);
          const imageValidation = dataValidator.isValidImageWith1MBConstraint(hospitalImageFile);
          if (!imageValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalImage"] = imageValidation.message;
          }

          // Validate hospital password
          const passwordValidation = dataValidator.isValidPassword(hospitalData.hospitalPassword);
          if (!passwordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalPassword"] = passwordValidation.message;
          }

          return validationResults;
        }

        const validationResults = validateHospitalRegistration();

        if (!validationResults.isValid) {
          if (hospitalImageFile && hospitalImageFile.filename) {
            const imagePath = path.join(
              "Files/HospitalImages",
              hospitalImageFile.filename
            );
            fs.unlinkSync(imagePath);
          }
          return res.status(400).json({
            status: "validation failed",
            results: validationResults.errors,
          });
        }

        // Upload image to S3
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `hospitalImages/hospitalImage-${Date.now()}${path.extname(hospitalImageFile.originalname)}`,
          Body: hospitalImageFile.buffer,
          ACL: "public-read",
        };

        s3.upload(params, async (err, data) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: "Error uploading image to S3",
              error: err.message,
            });
          }

          const newHospital = {
            hospitalName: hospitalData.hospitalName,
            hospitalEmail: hospitalData.hospitalEmail,
            hospitalWebSite: hospitalData.hospitalWebSite,
            hospitalAadhar: hospitalData.hospitalAadhar.replace(/\s/g, ""),
            hospitalMobile: hospitalData.hospitalMobile.replace(/\s/g, ""),
            hospitalAddress: hospitalData.hospitalAddress,
            hospitalImage: data.Location, // Store S3 image URL
            hospitalPassword: hospitalData.hospitalPassword,
            registeredDate: new Date(),
            isActive: 1,
            deleteStatus: 0,
            updateStatus: 0,
            passwordUpdatedStatus: 0,
          };

          try {
            const registrationResponse = await Hospital.register(newHospital);
            return res.status(200).json({
              status: "success",
              message: "Hospital registered successfully",
              data: registrationResponse,
            });
          } catch (error) {
            console.error("Error during hospital registration:", error);

            if (error.name === "ValidationError") {
              return res
                .status(422)
                .json({ status: "failed", error: error.errors });
            } else {
              return res.status(500).json({
                status: "error",
                message: "Internal server error",
                error: error.message,
              });
            }
          }
        });
      } catch (error) {
        console.error("Error during hospital registration:", error);
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message,
        });
      }
    });
  } catch (error) {
    console.error("Error during hospital registration:", error);
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
// LOGIN
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
      validationResults.errors["hospitalEmail"] = emailValidation.message;
    }

    // Validate password
    const passwordValidation = dataValidator.isValidPassword(hospitalPassword);
    if (!passwordValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalPassword"] = passwordValidation.message;
    }

    return validationResults;
  }

  const validationResults = validateHospitalLogin();
  if (!validationResults.isValid) {
    return res.status(400).json({
      status: "validation failed",
      results: validationResults.errors
    });
  }

  try {
    const hospital = await Hospital.login(hospitalEmail, hospitalPassword);

    const token = jwt.sign(
      {
        hospitalId: hospital.hospitalId,
        hospitalEmail: hospital.hospitalEmail,
      },
      process.env.JWT_SECRET_KEY_HOSPITAL,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: { token, hospital },
    });
  } catch (error) {
    console.error("Error during hospital login:", error);

    if (error.message === "Hospital not found") {
      return res.status(422).json({
        status: "error",
        error: error.message
      });
    }

    if (error.message === "Wrong password") {
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
};
//
//
//
//
// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, oldPassword, newPassword } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET_KEY_HOSPITAL,
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

      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: "failed",
          message: "Unauthorized access"
        });
      }

      try {
        function validateHospitalChangePassword() {
          const validationResults = {
            isValid: true,
            errors: {},
          };

          // Validate old password
          const passwordValidation = dataValidator.isValidPassword(oldPassword);
          if (!passwordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["oldPassword"] = passwordValidation.message;
          }

          // Validate new password
          const newPasswordValidation = dataValidator.isValidPassword(newPassword);
          if (!newPasswordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["newPassword"] = newPasswordValidation.message;
          }

          return validationResults;
        }

        const validationResults = validateHospitalChangePassword();
        if (!validationResults.isValid) {
          return res.status(400).json({
            status: "failed",
            message: "Validation failed",
            results: validationResults.errors
          });
        }

        await Hospital.changePassword(hospitalId, oldPassword, newPassword);
        return res.status(200).json({
          status: "success",
          message: "Password changed successfully"
        });
      } catch (error) {
        if (
          error.message === "Hospital not found" ||
          error.message === "Invalid old password"
        ) {
          return res.status(422).json({
            status: "error",
            message: error.message
          });
        } else {
          console.error("Error changing hospital password:", error);
          return res.status(500).json({
            status: "error",
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
// UPDATE IMAGE
exports.updateImage = async (req, res) => {
  const token = req.headers.token;

  // Check if token is missing
  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET_KEY_HOSPITAL,
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

      // Define Multer upload middleware
      const hospitalImageStorage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, "Files/HospitalImages");
        },
        filename: function (req, file, cb) {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, "hospitalImage-" + uniqueSuffix + ext);
        },
      });

      const uploadHospitalImage = multer({
        storage: hospitalImageStorage,
      }).single("hospitalImage");

      // Use Multer middleware to handle the file upload and form data parsing
      uploadHospitalImage(req, res, async function (err) {
        if (err) {
          return res.status(400).json({
            status: "validation failed",
            results: { file: "File upload failed", details: err.message },
          });
        }

        const { hospitalId } = req.body;

        // Check if hospitalId is missing after form data is processed
        if (!hospitalId) {
          return res.status(401).json({
            status: "failed",
            results: "Hospital ID is missing"
          });
        }

        const imageValidation = dataValidator.isValidImageWith1MBConstraint(
          req.file
        );
        if (!imageValidation.isValid) {
          return res.status(400).json({
            status: "validation failed",
            results: imageValidation.message,
          });
        }

        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        try {
          const hospitalImageFile = req.file;

          if (!hospitalImageFile) {
            return res.status(400).json({
              status: "validation failed",
              results: "Hospital image file is required",
            });
          }

          // Update hospital image in database
          await Hospital.updateImage(hospitalId, hospitalImageFile.filename);

          return res.status(200).json({
            status: "success",
            message: "Hospital image updated successfully",
          });
        } catch (error) {
          console.error("Error updating hospital image:", error);
          if (error.message === "Hospital not found") {
            return res.status(422).json({
              status: "failed",
              error: error.message,
            });
          }
          return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
          });
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
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      results: "Hospital ID is missing"
    });
  }

  try {
    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
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

        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Token is valid, proceed to fetch hospital profile
        try {
          const result = await Hospital.getProfile(hospitalId);
          return res.status(200).json({
            status: "success",
            data: result
          });
        } catch (error) {
          if (error.message === "Hospital not found") {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else {
            console.error("Error fetching hospital profile:", error);
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
    console.error("Error verifying token:", error);
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
// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  const token = req.headers.token;
  const {
    hospitalId,
    hospitalName,
    hospitalWebSite,
    hospitalAadhar,
    hospitalMobile,
    hospitalAddress,
  } = req.body;

  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      results: "Hospital ID is missing"
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET_KEY_HOSPITAL,
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

      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: "failed",
          message: "Unauthorized access"
        });
      }

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
          validationResults.errors["hospitalName"] = [nameValidation.message];
        }

        const websiteValidation = dataValidator.isValidWebsite(hospitalWebSite);
        if (!websiteValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalWebSite"] = [
            websiteValidation.message,
          ];
        }

        const aadharValidation =
          dataValidator.isValidAadharNumber(hospitalAadhar);
        if (!aadharValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalAadhar"] = [
            aadharValidation.message,
          ];
        }

        const mobileValidation =
          dataValidator.isValidMobileNumber(hospitalMobile);
        if (!mobileValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalMobile"] = [
            mobileValidation.message,
          ];
        }

        const addressValidation = dataValidator.isValidAddress(hospitalAddress);
        if (!addressValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalAddress"] = [
            addressValidation.message,
          ];
        }

        return validationResults;
      }

      const validationResults = validateHospitalUpdateProfile();

      if (!validationResults.isValid) {
        return res.status(400).json({
          status: "failed",
          message: "Validation failed",
          results: validationResults.errors,
        });
      }

      try {
        const updatedData = await Hospital.updateProfile(updatedHospital);
        return res.status(200).json({
          status: "success",
          message: "Hospital updated successfully",
          data: updatedData,
        });
      } catch (error) {
        console.error("Error updating hospital profile:", error);
        if (
          error.message === "Hospital not found" ||
          error.message === "Aadhar Number Already Exists."
        ) {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        } else if (
          error.message === "Error fetching updated hospital details."
        ) {
          return res.status(500).json({
            status: "failed",
            message: error.message
          });
        } else {
          return res.status(500).json({
            status: "failed",
            message: "Internal server error",
            error: error.message,
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
// REGISTER STAFF
exports.staffRegister = async (req, res) => {
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
      process.env.JWT_SECRET_KEY_HOSPITAL,
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

        const staffImagesStorage = multer.diskStorage({
          destination: function (req, file, cb) {
            cb(null, "Files/HospitalStaffImages");
          },
          filename: function (req, file, cb) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);

            if (file.fieldname === "hospitalStaffProfileImage") {
              const fileName =
                "hospitalStaffProfileImage-" + uniqueSuffix + ext;
              cb(null, fileName);
              req.hospitalStaffProfileImageFileName = fileName;
            } else if (file.fieldname === "hospitalStaffIdProofImage") {
              const fileName =
                "hospitalStaffIdProofImage-" + uniqueSuffix + ext;
              cb(null, fileName);
              req.hospitalStaffIdProofImageFileName = fileName;
            }
          },
        });

        const uploadStaffImages = multer({
          storage: staffImagesStorage,
        }).fields([
          { name: "hospitalStaffProfileImage", maxCount: 1 },
          { name: "hospitalStaffIdProofImage", maxCount: 1 },
        ]);

        // Extracting hospitalId after multer configuration
        uploadStaffImages(req, res, async function (err) {
          if (err) {
            return res.status(400).json({
              status: "error",
              message: "File upload failed",
              results: err.message,
            });
          }

          const hospitalStaffData = req.body;
          const hospitalId = hospitalStaffData.hospitalId;

          if (!hospitalId) {
            return res.status(401).json({
              status: "failed",
              results: "Hospital ID is missing"
            });
          }

          if (decoded.hospitalId != hospitalId) {
            return res.status(403).json({
              status: "failed",
              message: "Unauthorized access"
            });
          }

          // Validate hospital staff registration data
          function validateHospitalStaffRegistration() {
            const validationResults = {
              isValid: true,
              errors: {},
            };

            const nameValidation = dataValidator.isValidName(
              hospitalStaffData.hospitalStaffName
            );
            if (!nameValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffName"] = [
                nameValidation.message,
              ];
            }

            const emailValidation = dataValidator.isValidEmail(
              hospitalStaffData.hospitalStaffEmail
            );
            if (!emailValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffEmail"] = [
                emailValidation.message,
              ];
            }

            const aadharValidation = dataValidator.isValidAadharNumber(
              hospitalStaffData.hospitalStaffAadhar
            );
            if (!aadharValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffAadhar"] = [
                aadharValidation.message,
              ];
            }

            const mobileValidation = dataValidator.isValidMobileNumber(
              hospitalStaffData.hospitalStaffMobile
            );
            if (!mobileValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffMobile"] = [
                mobileValidation.message,
              ];
            }

            const addressValidation = dataValidator.isValidAddress(
              hospitalStaffData.hospitalStaffAddress
            );
            if (!addressValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffAddress"] = [
                addressValidation.message,
              ];
            }

            const profileImageValidation =
              dataValidator.isValidImageWith1MBConstraint(
                req.files["hospitalStaffProfileImage"]
                  ? req.files["hospitalStaffProfileImage"][0]
                  : null
              );
            if (!profileImageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffProfileImage"] = [
                profileImageValidation.message,
              ];
            }

            const idProofImageValidation =
              dataValidator.isValidImageWith1MBConstraint(
                req.files["hospitalStaffIdProofImage"]
                  ? req.files["hospitalStaffIdProofImage"][0]
                  : null
              );
            if (!idProofImageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffIdProofImage"] = [
                idProofImageValidation.message,
              ];
            }

            const passwordValidation = dataValidator.isValidPassword(
              hospitalStaffData.hospitalStaffPassword
            );
            if (!passwordValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalStaffPassword"] = [
                passwordValidation.message,
              ];
            }

            return validationResults;
          }

          const validationResults = validateHospitalStaffRegistration();

          if (!validationResults.isValid) {
            // If validation fails, delete uploaded files
            cleanupUploadedFiles(req);
            return res.status(400).json({
              status: "failed",
              message: "Validation failed",
              results: validationResults.errors,
            });
          }

          // Save hospital staff registration data
          const newHospitalStaff = {
            hospitalId: hospitalId,
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
            const registrationResponse = await Hospital.registerStaff(
              newHospitalStaff
            );
            return res.status(201).json({
              status: "success",
              message: "Hospital Staff registered successfully",
              data: {
                hospitalStaffId: registrationResponse,
                ...newHospitalStaff,
              },
            });
          } catch (error) {
            // If database operation fails, delete uploaded files
            cleanupUploadedFiles(req);
            if (error.name === "ValidationError") {
              return res.status(422).json({
                status: "failed",
                results: error.errors
              });
            } else {
              return res.status(500).json({
                status: "error",
                message: "Internal server error",
                error: error.message,
              });
            }
          }
        });
      }
    );
  } catch (error) {
    // Error handling logic
    cleanupUploadedFiles(req);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }

  function cleanupUploadedFiles(req) {
    if (req.files) {
      if (
        req.files["hospitalStaffProfileImage"] &&
        req.files["hospitalStaffProfileImage"][0]
      ) {
        fs.unlinkSync(
          path.join(
            "Files/HospitalStaffImages",
            req.files["hospitalStaffProfileImage"][0].filename
          )
        );
      }

      if (
        req.files["hospitalStaffIdProofImage"] &&
        req.files["hospitalStaffIdProofImage"][0]
      ) {
        fs.unlinkSync(
          path.join(
            "Files/HospitalStaffImages",
            req.files["hospitalStaffIdProofImage"][0].filename
          )
        );
      }
    }
  }
};

//
//
//
//
// DELETE STAFF
exports.deleteStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalId is missing
    if (!hospitalId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital ID is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "failed",
              message: "Invalid token"
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              status: "failed",
              message: "Token has expired"
            });
          }
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        try {
          const deletionStatus = await Hospital.deleteStaff(
            hospitalStaffId,
            hospitalId
          );

          if (deletionStatus) {
            return res.status(200).json({
              status: "success",
              message: "Hospital Staff deleted successfully",
              data: { hospitalStaffId },
            });
          } else {
            throw new Error("Error deleting hospital staff");
          }
        } catch (error) {
          console.error("Error deleting hospital staff:", error);

          if (
            error.message === "Hospital Staff not found" ||
            error.message === "Hospital not found"
          ) {
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
    console.error("Error deleting hospital staff:", error);
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
// SUSPEND STAFF
exports.suspendStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    if (!hospitalId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital ID is missing"
      });
    }

    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "failed",
              message: "Invalid token"
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              status: "failed",
              message: "Token has expired"
            });
          }
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        try {
          const suspensionStatus = await Hospital.suspendStaff(
            hospitalStaffId,
            hospitalId
          );

          if (suspensionStatus) {
            return res.status(200).json({
              status: "success",
              message: "Hospital Staff suspended successfully",
              data: { hospitalStaffId },
            });
          } else {
            throw new Error("Error suspending hospital staff");
          }
        } catch (error) {
          console.error("Error suspending hospital staff:", error);

          if (
            error.message === "Hospital Staff not found" ||
            error.message === "Hospital not found"
          ) {
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
    console.error("Error suspending hospital staff:", error);
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
// UNSUSPEND STAFF
exports.unsuspendStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalId is missing
    if (!hospitalId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital ID is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "failed",
              message: "Invalid token"
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              status: "failed",
              message: "Token has expired"
            });
          }
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        try {
          const unsuspensionStatus = await Hospital.unSuspendStaff(
            hospitalStaffId,
            hospitalId
          );

          if (unsuspensionStatus) {
            return res.status(200).json({
              status: "success",
              message: "Hospital Staff unsuspended successfully",
              data: { hospitalStaffId },
            });
          } else {
            throw new Error("Error unsuspending hospital staff");
          }
        } catch (error) {
          console.error("Error unsuspending hospital staff:", error);

          if (
            error.message === "Hospital Staff not found" ||
            error.message === "Hospital not found"
          ) {
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
    console.error("Error unsuspending hospital staff:", error);
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
// UPDATE STAFF
exports.updateStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const {
      hospitalStaffId,
      hospitalId,
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

    // Check if hospitalId is missing
    if (!hospitalId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital ID is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "failed",
              message: "Invalid token"
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              status: "failed",
              message: "Token has expired"
            });
          }
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
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

          // Validate hospital staff name
          const nameValidation = dataValidator.isValidName(
            updatedHospitalStaff.hospitalStaffName
          );
          if (!nameValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffName"] = [
              nameValidation.message,
            ];
          }

          // Validate hospital staff mobile number
          const mobileValidation = dataValidator.isValidMobileNumber(
            updatedHospitalStaff.hospitalStaffMobile
          );
          if (!mobileValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffMobile"] = [
              mobileValidation.message,
            ];
          }

          // Validate hospital staff address
          const addressValidation = dataValidator.isValidAddress(
            updatedHospitalStaff.hospitalStaffAddress
          );
          if (!addressValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffAddress"] = [
              addressValidation.message,
            ];
          }

          // Validate hospital staff aadhar number
          const aadharValidation = dataValidator.isValidAadharNumber(
            updatedHospitalStaff.hospitalStaffAadhar
          );
          if (!aadharValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["hospitalStaffAadhar"] = [
              aadharValidation.message,
            ];
          }

          return validationResults;
        }

        const validationResults = validateHospitalStaffUpdate();

        if (!validationResults.isValid) {
          return res.status(400).json({
            status: "error",
            message: "Validation failed",
            results: validationResults.errors,
          });
        }

        try {
          const updateResponse = await Hospital.updateStaff(
            updatedHospitalStaff
          );
          return res.status(200).json({
            status: "success",
            message: "Hospital Staff updated successfully",
            data: updateResponse.updatedData,
          });
        } catch (error) {
          if (
            error.message === "Hospital not found" ||
            error.message === "Hospital staff not found" ||
            error.message === "Aadhar number already exists"
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
    console.error("Error during update hospital staff:", error);
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
// VIEW ALL STAFFS
exports.viewAllStaffs = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(400).json({
      status: "failed",
      results: "Hospital ID is missing"
    });
  }

  try {
    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "failed",
              message: "Invalid token"
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              status: "failed",
              message: "Token has expired"
            });
          } else {
            return res.status(403).json({
              status: "failed",
              message: "Unauthorized access"
            });
          }
        }

        // Check if decoded token matches hospitalId from request body
        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Token is valid, proceed to fetch all hospital staffs
        try {
          const allStaffs = await Hospital.viewAllStaffs(hospitalId);
          return res.status(200).json({
            status: "success",
            message: "All Hospital Staffs retrieved successfully",
            data: allStaffs,
          });
        } catch (error) {
          console.error("Error viewing all hospital staffs:", error);
          if (error.message === "Hospital not found") {
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
    console.error("Error verifying token:", error);
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
// VIEW ONE STAFF
exports.viewOneStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalId is missing
    if (!hospitalId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital ID is missing"
      });
    }

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital Staff ID is missing"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "failed",
              message: "Invalid token"
            });
          } else if (err.name === "TokenExpiredError") {
            return res.status(401).json({
              status: "failed",
              message: "Token has expired"
            });
          } else {
            return res.status(403).json({
              status: "failed",
              message: "Unauthorized access"
            });
          }
        }

        // Check if decoded token matches hospitalId from request body
        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Token is valid, proceed to fetch details of one hospital staff
        try {
          const staffDetails = await Hospital.viewOneStaff(
            hospitalStaffId,
            hospitalId
          );
          return res.status(200).json({
            status: "success",
            message: "Hospital Staff details",
            data: staffDetails,
          });
        } catch (error) {
          if (
            error.message === "Hospital Staff not found" ||
            error.message === "Hospital not found"
          ) {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else {
            console.error("Error viewing hospital staff details:", error);
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
    console.error("Error verifying token:", error);
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
// SEARCH STAFFS
exports.searchStaffs = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, searchQuery } = req.body;

  try {
    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalId is missing
    if (!hospitalId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital ID is missing"
      });
    }

    // Check if searchQuery is missing or empty
    if (!searchQuery || searchQuery.trim() === "") {
      return res.status(400).json({
        status: "error",
        results: "Search query cannot be empty"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
        if (err) {
          if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
              status: "error",
              message: "Invalid or missing token"
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

        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Token is valid, proceed to search hospital staff
        try {
          const searchResult = await Hospital.searchStaff(
            hospitalId,
            searchQuery
          );

          return res.status(200).json({
            status: "success",
            message: "Hospital Staffs found successfully",
            data: searchResult,
          });
        } catch (error) {
          console.error("Error searching hospital staff:", error);

          if (error.message === "Hospital not found") {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else if (error.message === "No hospital staffs found") {
            return res.status(422).json({
              status: "failed",
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
    console.error("Error searching hospital staff:", error);
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
// ADD NEWS
exports.addNews = async (req, res) => {
  const token = req.headers.token;

  try {
    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
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

        // Multer configuration and file upload
        const newsImageStorage = multer.diskStorage({
          destination: function (req, file, cb) {
            cb(null, "Files/HospitalImages/HospitalNewsImages");
          },
          filename: function (req, file, cb) {
            const uniqueSuffix =
              Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, "hospitalNewsImage-" + uniqueSuffix + ext);
          },
        });

        const uploadNewsImage = multer({ storage: newsImageStorage }).single(
          "hospitalNewsImage"
        );

        // Use Multer middleware to handle the file upload and form data parsing
        uploadNewsImage(req, res, async function (err) {
          if (err) {
            return res.status(400).json({
              status: "error",
              message: "File upload failed",
              details: err.message,
            });
          }

          const { hospitalId } = req.body; // Retrieve hospitalId after form data is processed

          // Check if hospitalId is missing
          if (!hospitalId) {
            cleanupUploadedFiles(req);
            return res.status(400).json({
              status: "failed",
              results: "Hospital ID is missing"
            });
          }

          // Check if decoded token matches hospitalId from request body
          if (decoded.hospitalId != hospitalId) {
            cleanupUploadedFiles(req);
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const newsData = req.body;
          const newsImageFile = req.file;

          // Validate news data
          function validateNewsData() {
            const validationResults = {
              isValid: true,
              errors: {},
            };

            const titleValidation = dataValidator.isValidTitle(
              newsData.hospitalNewsTitle
            );
            if (!titleValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalNewsTitle"] =
                titleValidation.message;
            }

            const contentValidation = dataValidator.isValidContent(
              newsData.hospitalNewsContent
            );
            if (!contentValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalNewsContent"] =
                contentValidation.message;
            }

            const imageValidation =
              dataValidator.isValidImageWith1MBConstraint(newsImageFile);
            if (!imageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalNewsImage"] =
                imageValidation.message;
            }

            return validationResults;
          }

          const validationResults = validateNewsData();

          if (!validationResults.isValid) {
            if (newsImageFile) {
              const imagePath = path.join(
                "Files/HospitalImages/HospitalNewsImages",
                newsImageFile.filename
              );
              fs.unlinkSync(imagePath);
            }
            return res.status(400).json({
              status: "error",
              message: "Validation failed",
              results: validationResults.errors,
            });
          }

          const newHospitalNews = {
            hospitalNewsTitle: newsData.hospitalNewsTitle,
            hospitalNewsContent: newsData.hospitalNewsContent,
            hospitalNewsImage: newsImageFile ? newsImageFile.filename : null,
          };

          try {
            const addedNewsId = await Hospital.addNews(
              newsData.hospitalId,
              newHospitalNews
            );
            return res.status(201).json({
              status: "success",
              message: "Hospital news added successfully",
              data: { hospitalNewsId: addedNewsId, ...newHospitalNews },
            });
          } catch (error) {
            if (error.message === "Hospital not found") {
              if (newsImageFile) {
                const imagePath = path.join(
                  "Files/HospitalImages/HospitalNewsImages",
                  newsImageFile.filename
                );
                fs.unlinkSync(imagePath);
              }
              return res.status(422).json({
                status: "error",
                error: error.message
              });
            } else {
              if (newsImageFile) {
                const imagePath = path.join(
                  "Files/HospitalImages/HospitalNewsImages",
                  newsImageFile.filename
                );
                fs.unlinkSync(imagePath);
              }
              throw error;
            }
          }
        });
      }
    );
  } catch (error) {
    console.error("Error during adding hospital news:", error);
    if (req.file) {
      const imagePath = path.join(
        "Files/HospitalImages/HospitalNewsImages",
        req.file.filename
      );
      fs.unlinkSync(imagePath);
    }
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }

  function cleanupUploadedFiles(req) {
    if (req.file) {
      const imagePath = path.join(
        "Files/HospitalImages/HospitalNewsImages",
        req.file.filename
      );
      fs.unlinkSync(imagePath);
    }
  }
};
//
//
//
//
// DELETE NEWS
exports.deleteNews = async (req, res) => {
  const token = req.headers.token;
  const { hospitalNewsId, hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(401).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalNewsId is missing
  if (!hospitalNewsId) {
    return res.status(400).json({
      status: "failed",
      results: "Hospital News ID is missing"
    });
  }

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(400).json({
      status: "failed",
      results: "Hospital ID is missing"
    });
  }

  try {
    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
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

        try {
          // Check if decoded token matches hospitalId from request body
          if (decoded.hospitalId != hospitalId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          // Call the function to delete hospital news
          await Hospital.deleteNews(hospitalNewsId, hospitalId);

          return res.status(200).json({
            status: "success",
            message: "Hospital News deleted successfully",
          });
        } catch (error) {
          console.error("Error deleting hospital news:", error);

          if (
            error.message === "Hospital not found" ||
            error.message === "Hospital news not found"
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
    console.error("Error deleting hospital news:", error);

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
// UPDATE NEWS
exports.updateNews = async (req, res) => {
  try {
    const token = req.headers.token;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
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

        try {
          const newsImageStorage = multer.diskStorage({
            destination: function (req, file, cb) {
              cb(null, "Files/HospitalImages/HospitalNewsImages");
            },
            filename: function (req, file, cb) {
              const uniqueSuffix =
                Date.now() + "-" + Math.round(Math.random() * 1e9);
              const ext = path.extname(file.originalname);
              cb(null, "hospitalNewsImage-" + uniqueSuffix + ext);
            },
          });

          const uploadNewsImage = multer({ storage: newsImageStorage }).single(
            "hospitalNewsImage"
          );

          uploadNewsImage(req, res, async function (err) {
            if (err) {
              return res.status(400).json({
                status: "error",
                message: "File upload failed",
                results: err.message,
              });
            }

            const { hospitalId, hospitalNewsId, hospitalNewsTitle, hospitalNewsContent } = req.body;

            // Check if hospitalId is missing
            if (!hospitalId) {
              cleanupUploadedFiles(req);
              return res.status(400).json({
                status: "failed",
                results: "Hospital ID is missing"
              });
            }

            // Check if hospitalNewsId is missing
            if (!hospitalNewsId) {
              cleanupUploadedFiles(req);
              return res.status(400).json({
                status: "failed",
                results: "Hospital News ID is missing"
              });
            }

            // Check if decoded token matches hospitalId from request body
            if (decoded.hospitalId != hospitalId) {
              cleanupUploadedFiles(req);
              return res.status(403).json({
                status: "error",
                message: "Unauthorized access"
              });
            }

            const newsImageFile = req.file;

            function validateUpdatedNewsData(newsData, newsImageFile) {
              const validationResults = {
                isValid: true,
                errors: {},
              };

              const titleValidation = dataValidator.isValidTitle(
                newsData.hospitalNewsTitle
              );

              if (!titleValidation.isValid) {
                validationResults.isValid = false;
                validationResults.errors["hospitalNewsTitle"] = [
                  titleValidation.message,
                ];
              }

              const contentValidation = dataValidator.isValidContent(
                newsData.hospitalNewsContent
              );

              if (!contentValidation.isValid) {
                validationResults.isValid = false;
                validationResults.errors["hospitalNewsContent"] = [
                  contentValidation.message,
                ];
              }

              const imageValidation =
                dataValidator.isValidImageWith1MBConstraint(newsImageFile);

              if (!imageValidation.isValid) {
                validationResults.isValid = false;
                validationResults.errors["hospitalNewsImage"] = [
                  imageValidation.message,
                ];
              }

              return validationResults;
            }

            const validationResults = validateUpdatedNewsData(
              { hospitalNewsTitle, hospitalNewsContent, hospitalId },
              newsImageFile
            );

            if (!validationResults.isValid) {
              cleanupUploadedFiles(req); // Delete uploaded file on validation failure
              return res.status(400).json({
                status: "error",
                message: "Validation failed",
                results: validationResults.errors,
              });
            }

            const updatedHospitalNews = {
              hospitalNewsTitle,
              hospitalNewsContent,
              hospitalNewsImage: newsImageFile ? newsImageFile.filename : null,
              updatedDate: new Date(),
            };

            try {
              await Hospital.updateNews(
                hospitalNewsId,
                hospitalId,
                updatedHospitalNews
              );
              return res.status(200).json({
                status: "success",
                message: "Hospital news updated successfully",
              });
            } catch (error) {
              if (
                error.message === "Hospital not found" ||
                error.message === "Hospital news not found"
              ) {
                return res
                  .status(422)
                  .json({
                    status: "error",
                    error: error.message
                  });
              } else {
                console.error("Error updating hospital news:", error);
                cleanupUploadedFiles(req); // Delete uploaded file on error
                return res.status(500).json({
                  status: "error",
                  message: "Internal server error",
                  error: error.message,
                });
              }
            }
          });
        } catch (error) {
          console.error("Error during updateHospitalNews:", error);
          return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message,
          });
        }
      }
    );
  } catch (error) {
    console.error("Error during updateHospitalNews:", error);
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
// VIEW ALL NEWS
exports.viewAllNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalId is missing
    if (!hospitalId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital ID is missing"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
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

        try {
          // Check if decoded token matches hospitalId from request body
          if (decoded.hospitalId != hospitalId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const allNewsData = await Hospital.viewAllNews(hospitalId);
          return res.status(200).json({
            status: "success",
            message: "All hospital news retrieved successfully",
            data: allNewsData,
          });
        } catch (error) {
          console.error("Error viewing all hospital news:", error);

          if (error.message === "Hospital not found") {
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
// VIEW ONE NEWS
exports.viewOneNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalNewsId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if hospitalId is missing
    if (!hospitalId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital ID is missing"
      });
    }

    // Check if hospitalNewsId is missing
    if (!hospitalNewsId) {
      return res.status(400).json({
        status: "failed",
        results: "Hospital News ID is missing"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
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

        try {
          // Check if decoded token matches hospitalId from request body
          if (decoded.hospitalId != hospitalId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const newsItemData = await Hospital.viewOneNews(
            hospitalNewsId,
            hospitalId
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
            error.message === "Hospital not found"
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
