// hospital.controller.js
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Hospital } = require("../../models/HospitalModels/hospital.model");
const dataValidator = require("../../config/data.validate");
const fs = require("fs");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3"); // Add this line
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
// REGISTER HOSPITAL
exports.register = async (req, res) => {
  const uploadHospitalImage = multer({
    storage: multer.memoryStorage(),
  }).single("hospitalImage");

  uploadHospitalImage(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        status: "failed",
        message: "Validation failed",
        results: { file: "File upload failed", details: err.message },
      });
    }

    const hospitalData = req.body;
    const hospitalImageFile = req.file;
    hospitalData.hospitalAadhar = hospitalData.hospitalAadhar.replace(/\s/g, '');
    hospitalData.hospitalMobile = hospitalData.hospitalMobile.replace(/\s/g, '');

    const validationResults = validateHospitalRegistration(hospitalData, hospitalImageFile);

    if (!validationResults.isValid) {
      // Delete uploaded image from local storage
      if (hospitalImageFile && hospitalImageFile.filename) {
        const imagePath = path.join("Files/HospitalImages", hospitalImageFile.filename);
        fs.unlinkSync(imagePath);
      }
      return res.status(400).json({
        status: "failed",
        message: "Validation failed",
        results: validationResults.errors,
      });
    }

    if (hospitalImageFile) {
      const fileName = `hospitalImage-${Date.now()}${path.extname(hospitalImageFile.originalname)}`;
      const mimeType = hospitalImageFile.mimetype;

      try {
        const fileLocation = await uploadFileToS3(hospitalImageFile, fileName, mimeType);
        hospitalData.hospitalImage = fileLocation;
      } catch (uploadError) {
        // Delete uploaded image from local storage
        if (hospitalImageFile && hospitalImageFile.filename) {
          const imagePath = path.join("Files/HospitalImages", hospitalImageFile.filename);
          fs.unlinkSync(imagePath);
        }
        return res.status(500).json({
          status: "failed",
          message: "Internal server error",
          error: uploadError.message,
        });
      }
    }

    try {
      const registrationResponse = await Hospital.register(hospitalData, hospitalImageFile);
      return res.status(200).json({
        status: "success",
        message: "Hospital registered successfully",
        data: registrationResponse,
      });
    } catch (error) {
      // Delete uploaded image from local storage
      if (hospitalImageFile && hospitalImageFile.filename) {
        const imagePath = path.join("Files/HospitalImages", hospitalImageFile.filename);
        fs.unlinkSync(imagePath);
      }

      // Delete uploaded image from S3 if it exists
      if (hospitalData.hospitalImage) {
        const s3Key = hospitalData.hospitalImage.split('/').pop();
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `hospitalImages/${s3Key}`
        };
        try {
          await s3Client.send(new DeleteObjectCommand(params));
        } catch (s3Error) {
          console.error("Error deleting image from S3:", s3Error);
        }
      }

      if (error.name === "ValidationError") {
        return res.status(422).json({
          status: "failed",
          message: "Validation error during registration",
          error: error.errors,
        });
      } else {
        return res.status(500).json({
          status: "failed",
          message: "Internal server error during registration",
          error: error.message,
        });
      }
    }
  });

  async function uploadFileToS3(fileBuffer, fileName, mimeType) {
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `hospitalImages/${fileName}`,
      Body: fileBuffer.buffer,
      ACL: "public-read",
      ContentType: mimeType,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
  }

  function validateHospitalRegistration(hospitalData, hospitalImageFile) {
    const validationResults = {
      isValid: true,
      errors: {},
    };

    // Name validation
    const nameValidation = dataValidator.isValidName(hospitalData.hospitalName);
    if (!nameValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalName"] = [nameValidation.message];
    }

    // Email validation
    const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);
    if (!emailValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalEmail"] = [emailValidation.message];
    }

    // Aadhar validation
    const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);
    if (!aadharValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalAadhar"] = [aadharValidation.message];
    }

    // Mobile validation
    const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);
    if (!mobileValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalMobile"] = [mobileValidation.message];
    }

    // Website validation
    const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);
    if (!websiteValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalWebSite"] = [websiteValidation.message];
    }

    // Address validation
    const addressValidation = dataValidator.isValidAddress(hospitalData.hospitalAddress);
    if (!addressValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalAddress"] = [addressValidation.message];
    }

    // Image validation
    const imageValidation = dataValidator.isValidImageWith1MBConstraint(hospitalImageFile);
    if (!imageValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalImage"] = [imageValidation.message];
    }

    // Password validation
    const passwordValidation = dataValidator.isValidPassword(hospitalData.hospitalPassword);
    if (!passwordValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalPassword"] = [passwordValidation.message];
    }

    return validationResults;
  }
};
//
//
//
//
// HOSPITAL LOGIN
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
      validationResults.errors["hospitalEmail"] = [emailValidation.message];
    }

    // Validate password
    const passwordValidation = dataValidator.isValidPassword(hospitalPassword);
    if (!passwordValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalPassword"] = [passwordValidation.message];
    }

    return validationResults;
  }

  const validationResults = validateHospitalLogin();
  if (!validationResults.isValid) {
    return res.status(400).json({
      status: "failed",
      message: "Validation failed",
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

    if (error.message === "Hospital not found" || error.message === "Wrong password") {
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
// HOSPITAL CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, oldPassword, newPassword } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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
          error.message === "Incorrect old password"
        ) {
          return res.status(422).json({
            status: "failed",
            message: "Password change failed",
            error: error.message
          });
        } else {
          console.error("Error changing hospital password:", error);
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
// HOSPITAL CHANGE HOSPITAL IMAGE
exports.changeImage = async (req, res) => {
  const token = req.headers.token;

  if (!token) {
    return res.status(403).json({
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

      try {
        const uploadHospitalImage = multer({
          storage: multer.memoryStorage(),
        }).single("hospitalImage");

        uploadHospitalImage(req, res, async function (err) {
          if (err) {
            return res.status(400).json({
              status: "validation failed",
              results: { hospitalImage: ["File upload failed"] },
            });
          }

          const { hospitalId } = req.body;

          if (!hospitalId) {
            return res.status(401).json({
              status: "failed",
              message: "Hospital ID is missing"
            });
          }

          // Function to upload file to S3
          async function uploadFileToS3(file) {
            const fileName = `hospitalImage-${Date.now()}${path.extname(file.originalname)}`;
            const mimeType = file.mimetype;

            const uploadParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `hospitalImages/${fileName}`,
              Body: file.buffer,
              ACL: "public-read",
              ContentType: mimeType,
            };

            const command = new PutObjectCommand(uploadParams);
            const result = await s3Client.send(command);
            return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
          }

          // Validation function for hospital image
          function validateHospitalImage(file) {
            const validationResults = {
              isValid: true,
              errors: {},
            };

            if (!file) {
              validationResults.isValid = false;
              validationResults.errors["hospitalImage"] = ["Hospital image is required"];
            } else {
              const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);
              if (!imageValidation.isValid) {
                validationResults.isValid = false;
                validationResults.errors["hospitalImage"] = [imageValidation.message];
              }
            }

            return validationResults;
          }

          const imageValidation = validateHospitalImage(req.file); // Validate image
          if (!imageValidation.isValid) {
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
              status: "failed",
              message: "Validation failed",
              results: imageValidation.errors,
            });
          }

          if (decoded.hospitalId != hospitalId) {
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({
              status: "failed",
              message: "Unauthorized access"
            });
          }

          const s3Url = await uploadFileToS3(req.file); // Upload file to S3
          await Hospital.updateImage(hospitalId, s3Url); // Call the updated hospital model function

          return res.status(200).json({
            status: "success",
            message: "Hospital image updated successfully",
            data: { s3Url },
          });
        });
      } catch (error) {
        console.error("Error during hospital image update:", error);
        if (req.file && req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        const s3Key = req.file ? req.file.filename : '';
        if (s3Key) {
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `hospitalImages/${s3Key}`
          };
          await s3Client.send(new DeleteObjectCommand(params));
        }

        if (error.message === "Hospital not found") {
          return res.status(422).json({
            status: "failed",
            message: "Hospital not found",
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
    }
  );
};
//
//
//
//
// HOSPITAL VIEW PROFILE
exports.viewProfile = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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
// HOSPITAL UPDATE PROFILE
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
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

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

      // Remove spaces from Aadhar number and mobile number
      const updatedHospital = {
        hospitalId,
        hospitalName,
        hospitalWebSite,
        hospitalAadhar: hospitalAadhar.replace(/\s/g, ''),
        hospitalMobile: hospitalMobile.replace(/\s/g, ''),
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
          dataValidator.isValidAadharNumber(hospitalAadhar.replace(/\s/g, ''));
        if (!aadharValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalAadhar"] = [
            aadharValidation.message,
          ];
        }

        const mobileValidation =
          dataValidator.isValidMobileNumber(hospitalMobile.replace(/\s/g, ''));
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
// HOSPITAL REGISTER STAFF
exports.registerStaff = async (req, res) => {
  const token = req.headers.token;

  // Check if token is missing
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

    const uploadStaffImages = multer({
      storage: multer.memoryStorage(),
    }).fields([
      { name: "hospitalStaffIdProofImage", maxCount: 1 },
      { name: "hospitalStaffProfileImage", maxCount: 1 }
    ]);

    uploadStaffImages(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          status: "validation failed",
          results: { files: "File upload failed", details: err.message },
        });
      }

      const hospitalStaffData = req.body;
      if (decoded.hospitalId != hospitalStaffData.hospitalId) {
        return res.status(403).json({
          status: "failed",
          message: "Unauthorized access"
        });
      }

      // Perform data cleanup
      hospitalStaffData.hospitalStaffAadhar = hospitalStaffData.hospitalStaffAadhar ? hospitalStaffData.hospitalStaffAadhar.replace(/\s/g, '') : '';
      hospitalStaffData.hospitalStaffMobile = hospitalStaffData.hospitalStaffMobile ? hospitalStaffData.hospitalStaffMobile.replace(/\s/g, '') : '';

      const idProofImageFile = req.files["hospitalStaffIdProofImage"] ? req.files["hospitalStaffIdProofImage"][0] : null;
      const profileImageFile = req.files["hospitalStaffProfileImage"] ? req.files["hospitalStaffProfileImage"][0] : null;

      const validationResults = validateStaffRegistration(hospitalStaffData, idProofImageFile, profileImageFile);

      if (!validationResults.isValid) {
        // Delete uploaded images from local storage
        if (idProofImageFile && idProofImageFile.filename) {
          const idProofImagePath = path.join("Files/StaffImages", idProofImageFile.filename);
          fs.unlinkSync(idProofImagePath);
        }
        if (profileImageFile && profileImageFile.filename) {
          const profileImagePath = path.join("Files/StaffImages", profileImageFile.filename);
          fs.unlinkSync(profileImagePath);
        }
        // Delete uploaded images from S3
        if (hospitalStaffData.hospitalStaffIdProofImage) {
          const idProofS3Key = hospitalStaffData.hospitalStaffIdProofImage.split('/').pop();
          const idProofParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `staffImages/${idProofS3Key}`
          };
          try {
            await s3Client.send(new DeleteObjectCommand(idProofParams));
          } catch (s3Error) {
            console.error("Error deleting ID proof image from S3:", s3Error);
          }
        }
        if (hospitalStaffData.hospitalStaffProfileImage) {
          const profileS3Key = hospitalStaffData.hospitalStaffProfileImage.split('/').pop();
          const profileParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `staffImages/${profileS3Key}`
          };
          try {
            await s3Client.send(new DeleteObjectCommand(profileParams));
          } catch (s3Error) {
            console.error("Error deleting profile image from S3:", s3Error);
          }
        }
        return res.status(400).json({
          status: "failed",
          message: "Validation failed",
          results: validationResults.errors,
        });
      }

      // Upload staff images to S3
      const idProofFileName = `staffIdProof-${Date.now()}${path.extname(idProofImageFile.originalname)}`;
      const profileImageFileName = `staffProfileImage-${Date.now()}${path.extname(profileImageFile.originalname)}`;

      try {
        const idProofFileLocation = await uploadFileToS3(idProofImageFile, idProofFileName, idProofImageFile.mimetype);
        const profileImageFileLocation = await uploadFileToS3(profileImageFile, profileImageFileName, profileImageFile.mimetype);

        hospitalStaffData.hospitalStaffIdProofImage = idProofFileLocation;
        hospitalStaffData.hospitalStaffProfileImage = profileImageFileLocation;

        // Register staff in the hospital
        const registrationResponse = await Hospital.registerStaff(hospitalStaffData);
        return res.status(200).json({
          status: "success",
          message: "Hospital staff registered successfully",
          data: registrationResponse,
        });
      } catch (error) {
        // Handling errors from the model
        if (error.name === "ValidationError") {
          // Delete uploaded images from S3
          if (hospitalStaffData.hospitalStaffIdProofImage) {
            const idProofS3Key = hospitalStaffData.hospitalStaffIdProofImage.split('/').pop();
            const idProofParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `staffImages/${idProofS3Key}`
            };
            try {
              await s3Client.send(new DeleteObjectCommand(idProofParams));
            } catch (s3Error) {
              console.error("Error deleting ID proof image from S3:", s3Error);
            }
          }
          if (hospitalStaffData.hospitalStaffProfileImage) {
            const profileS3Key = hospitalStaffData.hospitalStaffProfileImage.split('/').pop();
            const profileParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `staffImages/${profileS3Key}`
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
      Key: `staffImages/${fileName}`,
      Body: fileBuffer.buffer,
      ACL: "public-read",
      ContentType: mimeType,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
  }

  function validateStaffRegistration(hospitalStaffData, idProofImageFile, profileImageFile) {
    const validationResults = {
      isValid: true,
      errors: {},
    };

    // Validate hospital ID
    const idValidation = dataValidator.isValidId(hospitalStaffData.hospitalId);
    if (!idValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalId"] = [idValidation.message];
    }

    // Validate staff name
    const nameValidation = dataValidator.isValidName(hospitalStaffData.hospitalStaffName);
    if (!nameValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffName"] = [nameValidation.message];
    }

    // Validate staff email
    const emailValidation = dataValidator.isValidEmail(hospitalStaffData.hospitalStaffEmail);
    if (!emailValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffEmail"] = [emailValidation.message];
    }

    // Validate staff Aadhar
    const aadharValidation = dataValidator.isValidAadharNumber(hospitalStaffData.hospitalStaffAadhar);
    if (!aadharValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffAadhar"] = [aadharValidation.message];
    }

    // Validate staff mobile number
    const mobileValidation = dataValidator.isValidMobileNumber(hospitalStaffData.hospitalStaffMobile);
    if (!mobileValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffMobile"] = [mobileValidation.message];
    }

    // Validate staff password
    const passwordValidation = dataValidator.isValidPassword(hospitalStaffData.hospitalStaffPassword);
    if (!passwordValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffPassword"] = [passwordValidation.message];
    }

    // Validate staff address
    const addressValidation = dataValidator.isValidAddress(hospitalStaffData.hospitalStaffAddress);
    if (!addressValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffAddress"] = [addressValidation.message];
    }


    // Validate staff ID proof image
    const idProofImageValidation = dataValidator.isValidImageWith1MBConstraint(idProofImageFile);
    if (!idProofImageValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffIdProofImage"] = [idProofImageValidation.message];
    }

    // Validate staff profile image
    const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(profileImageFile);
    if (!profileImageValidation.isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalStaffProfileImage"] = [profileImageValidation.message];
    }

    return validationResults;
  }
};
//
//
//
//
// HOSPITAL DELETE STAFF
exports.deleteStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
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
// HOSPITAL SUSPEND STAFF
exports.suspendStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    if (!hospitalId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital ID is missing"
      });
    }

    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
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
// HOSPITAL UNSUSPEND STAFF
exports.unsuspendStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
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
// HOSPITAL VIEW ALL SUSPENDED STAFFS
exports.viewAllSuspendedStaffs = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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

        // Token is valid, proceed to fetch all suspended hospital staffs
        try {
          const suspendedStaffs = await Hospital.viewAllSuspendedStaffs(hospitalId);
          return res.status(200).json({
            status: "success",
            message: "All Suspended Hospital Staffs retrieved successfully",
            data: suspendedStaffs,
          });
        } catch (error) {
          console.error("Error viewing all suspended hospital staffs:", error);
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
// HOSPITAL VIEW ONE SUSPENDED STAFF
exports.viewOneSuspendedStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

        // Token is valid, proceed to fetch details of one suspended hospital staff
        try {
          const suspendedStaffDetails = await Hospital.viewOneSuspendedStaff(
            hospitalStaffId,
            hospitalId
          );
          return res.status(200).json({
            status: "success",
            message: "Suspended Hospital Staff details",
            data: suspendedStaffDetails,
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
            console.error("Error viewing suspended hospital staff details:", error);
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
// HOSPITAL UPDATE STAFF
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
      return res.status(403).json({
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

    // Check if hospitalStaffId is missing
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital Staff ID is missing"
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
// HOSPITAL VIEW ALL STAFFS
exports.viewAllStaffs = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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
// HOSPITAL VIEW ONE STAFF
exports.viewOneStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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
// HOSPITAL SEARCH STAFFS
exports.searchStaffs = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, searchQuery } = req.body;

  try {
    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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
// HOSPITAL SEND NOTIFICATION TO STAFF
exports.sendNotificationToStaff = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalStaffId, notificationMessage } = req.body;

    if (!token) {
      return res.status(403).json({
        status: "error",
        message: "Token is missing"
      });
    }

    if (!hospitalId) {
      return res.status(401).json({
        status: "error",
        message: "Hospital ID is missing"
      });
    }
    if (!hospitalStaffId) {
      return res.status(401).json({
        status: "error",
        message: "Hospital Staff ID is missing"
      });
    }
    if (!notificationMessage) {
      return res.status(401).json({
        status: "error",
        message: "Notification message is missing"
      });
    }

    // Token verification
    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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

      if (decoded.hospitalId != hospitalId) {
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
          errors: validationResults.errors
        });
      }

      try {
        const notificationDetails = await Hospital.sendNotificationToStaff(hospitalId, hospitalStaffId, notificationMessage);

        return res.status(200).json({
          status: "success",
          message: "Notification sent successfully",
          data: notificationDetails
        });
      } catch (error) {
        console.error("Error sending notification to hospital staff:", error);

        if (error.message === "Hospital not found" || error.message === "Hospital Staff not found or not active") {
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
    console.error("Error in sendNotificationToStaff controller:", error);
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
// HOSPITAL ADD NEWS
exports.addNews = async (req, res) => {
  const token = req.headers.token;

  try {
    if (!token) {
      return res.status(403).json({
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

        const uploadNewsImage = multer({
          storage: multer.memoryStorage(),
        }).single("hospitalNewsImage");

        uploadNewsImage(req, res, async function (err) {
          if (err) {
            console.error("File upload failed:", err);
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
              status: "error",
              message: "File upload failed",
              results: err.message,
            });
          }

          const { hospitalId } = req.body;

          if (!hospitalId) {
            console.error("Hospital ID is missing");
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(401).json({
              status: "failed",
              message: "Hospital ID is missing"
            });
          }

          if (decoded.hospitalId != hospitalId) {
            console.error("Unauthorized access");
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const newsData = req.body;
          const newsImageFile = req.file;

          const validationResults = validateHospitalNewsData(newsData, newsImageFile);

          if (!validationResults.isValid) {
            console.error("Validation failed:", validationResults.errors);
            if (newsImageFile && newsImageFile.path) {
              fs.unlinkSync(newsImageFile.path);
            }
            return res.status(400).json({
              status: "error",
              message: "Validation failed",
              results: validationResults.errors,
            });
          }

          try {
            const imageUrl = await uploadFileToS3(
              newsImageFile.buffer,
              newsImageFile.originalname, 
              newsImageFile.mimetype
            );

            const newHospitalNews = {
              hospitalNewsTitle: newsData.hospitalNewsTitle,
              hospitalNewsContent: newsData.hospitalNewsContent,
              hospitalNewsImage: imageUrl,
            };

            const addedNewsId = await Hospital.addNews(
              newsData.hospitalId,
              newHospitalNews
            );
            return res.status(200).json({
              status: "success",
              message: "Hospital news added successfully",
              data: { hospitalNewsId: addedNewsId, ...newHospitalNews },
            });
          } catch (error) {
            console.error("Error during adding hospital news:", error);
            if (newsImageFile && newsImageFile.path) {
              fs.unlinkSync(newsImageFile.path);
            }
            if (error.message === "Hospital not found" && newsImageFile) {
              const s3Key = req.file.key.split('/').pop();
              const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `Files/hospitalNewsImages/${s3Key}`
              };
              try {
                await s3Client.send(new DeleteObjectCommand(params));
              } catch (s3Error) {
                console.error("Error deleting news image from S3:", s3Error);
              }
            }
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          }
        });
      }
    );
  } catch (error) {
    console.error("Error during adding hospital news:", error);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }

  // Function to validate hospital news data
  function validateHospitalNewsData(newsData, newsImageFile) {
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

    if (!newsImageFile) {
      validationResults.isValid = false;
      validationResults.errors["hospitalNewsImage"] =
        "Hospital news image is required";
    } else {
      const imageValidation =
        dataValidator.isValidImageWith1MBConstraint(newsImageFile);
      if (!imageValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["hospitalNewsImage"] =
          imageValidation.message;
      }
    }

    return validationResults;
  }

  // Function to upload file to S3
  async function uploadFileToS3(fileBuffer, fileName, mimeType) {
    try {
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `hospitalNewsImages/${fileName}`,
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
};

//
//
//
//
// HOSPITAL DELETE NEWS
exports.deleteNews = async (req, res) => {
  const token = req.headers.token;
  const { hospitalNewsId, hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalNewsId is missing
  if (!hospitalNewsId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital News ID is missing"
    });
  }

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
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
// HOSPITAL UPDATE NEWS
exports.updateNews = async (req, res) => {
  const token = req.headers.token;

  try {
    if (!token) {
      return res.status(403).json({
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

        const uploadNewsImage = multer({
          storage: multer.memoryStorage(),
        }).single("hospitalNewsImage");

        uploadNewsImage(req, res, async function (err) {
          if (err) {
            console.error("File upload failed:", err);
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
              status: "error",
              message: "File upload failed",
              results: err.message,
            });
          }

          const { hospitalId, hospitalNewsId, hospitalNewsTitle, hospitalNewsContent } = req.body;

          if (!hospitalId || !hospitalNewsId) {
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(401).json({
              status: "failed",
              message: "Hospital ID or Hospital News ID is missing"
            });
          }

          if (decoded.hospitalId != hospitalId) {
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const newsData = req.body;
          const newsImageFile = req.file;

          const validationResults = validateHospitalNewsData(newsData, newsImageFile);

          if (!validationResults.isValid) {
            console.error("Validation failed:", validationResults.errors);
            if (newsImageFile && newsImageFile.path) {
              fs.unlinkSync(newsImageFile.path);
            }
            return res.status(400).json({
              status: "error",
              message: "Validation failed",
              results: validationResults.errors,
            });
          }

          try {
            let imageUrl = null;

            if (newsImageFile) {
              imageUrl = await uploadFileToS3(
                newsImageFile.buffer,
                newsImageFile.originalname,
                newsImageFile.mimetype
              );
            }

            const updatedHospitalNews = {
              hospitalNewsTitle,
              hospitalNewsContent,
              hospitalNewsImage: imageUrl,
              updatedDate: new Date(),
            };

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
            console.error("Error during updating hospital news:", error);
            if (newsImageFile && newsImageFile.path) {
              fs.unlinkSync(newsImageFile.path);
            }
            if (
              error.message === "Hospital not found" ||
              error.message === "Hospital news not found"
            ) {
              if (newsImageFile) {
                const s3Key = newsImageFile.key.split('/').pop(); // Extracting file name from S3 key
                const params = {
                  Bucket: process.env.S3_BUCKET_NAME,
                  Key: `Files/hospitalNewsImages/${s3Key}` // Updated directory structure
                };
                try {
                  await s3Client.send(new DeleteObjectCommand(params));
                } catch (s3Error) {
                  console.error("Error deleting news image from S3:", s3Error);
                }
              }
              return res
                .status(422)
                .json({
                  status: "error",
                  error: error.message
                });
            } else {
              return res.status(422).json({
                status: "error",
                error: error.message
              });
            }
          }
        });
      }
    );
  } catch (error) {
    console.error("Error during updating hospital news:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }

  // Function to validate hospital news data
  function validateHospitalNewsData(newsData, newsImageFile) {
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

    if (newsImageFile && !dataValidator.isValidImageWith1MBConstraint(newsImageFile).isValid) {
      validationResults.isValid = false;
      validationResults.errors["hospitalNewsImage"] =
        dataValidator.isValidImageWith1MBConstraint(newsImageFile).message;
    }

    return validationResults;
  }

  // Function to upload file to S3
  async function uploadFileToS3(fileBuffer, fileName, mimeType) {
    try {
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `Files/hospitalNewsImages/${fileName}`, // Updated directory structure
        Body: fileBuffer,
        ACL: "public-read",
        ContentType: mimeType,
      };
      const command = new PutObjectCommand(uploadParams);
      const result = await s3Client.send(command);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
    } catch (error) {
      throw error;
    }
  }
};
//
//
//
//
// HOSPITAL VIEW ALL NEWS
exports.viewAllNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
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
// HOSPITAL VIEW ONE NEWS
exports.viewOneNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, hospitalNewsId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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
      process.env.JWT_SECRET_KEY_HOSPITAL,
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
// HOSPITAL VIEW ALL UNAPPROVED INSURANCE PROVIDERS
exports.viewAllUnapprovedInsuranceProviders = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Verifying the token
  jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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
      // Check if decoded token matches hospitalId from request body
      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized access"
        });
      }

      // Retrieve all unapproved insurance providers for the hospital
      const unapprovedProviders = await Hospital.viewAllUnapprovedInsuranceProviders(hospitalId);
      return res.status(200).json({
        status: "success",
        message: "All unapproved insurance providers retrieved successfully",
        data: unapprovedProviders
      });
    } catch (error) {
      console.error("Error viewing all unapproved insurance providers:", error);

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
  });
};
//
//
//
//
//
// HOSPITAL VIEW ONE UNAPPROVED INSURANCE PROVIDER
exports.viewOneUnapprovedInsuranceProvider = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, insuranceProviderId } = req.body;

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }

  // Check if insuranceProviderId is missing
  if (!insuranceProviderId) {
    return res.status(401).json({
      status: "failed",
      message: "Insurance Provider ID is missing"
    });
  }

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Verifying the token
  jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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
      // Check if decoded token matches hospitalId from request body
      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized access"
        });
      }

      // Retrieve details of one unapproved insurance provider
      const unapprovedProvider = await Hospital.viewOneUnapprovedInsuranceProvider(hospitalId, insuranceProviderId);
      return res.status(200).json({
        status: "success",
        message: "Unapproved insurance provider details retrieved successfully",
        data: unapprovedProvider
      });
    } catch (error) {
      console.error("Error viewing one unapproved insurance provider:", error);

      if (error.message === "Unapproved insurance provider not found or already approved" || error.message === "Hospital not found") {
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
  });
};
//
//
//
//
// HOSPITAL APPROVE ONE INSURANCE PROVIDER
exports.approveOneInsuranceProvider = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, insuranceProviderId } = req.body;

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }

  // Check if insuranceProviderId is missing
  if (!insuranceProviderId) {
    return res.status(401).json({
      status: "failed",
      message: "Insurance Provider ID is missing"
    });
  }

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Verifying the token
  jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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
      // Check if decoded token matches hospitalId from request body
      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized access"
        });
      }

      // Call the model function to approve the insurance provider
      const approvedProviderId = await Hospital.approveOneInsuranceProvider(hospitalId, insuranceProviderId);

      return res.status(200).json({
        status: "success",
        message: "Insurance provider approved successfully",
        data: { insuranceProviderId: approvedProviderId }
      });
    } catch (error) {
      console.error("Error approving insurance provider:", error);

      if (error.message === "Insurance provider not found or already approved" || error.message === "Hospital not found") {
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
  });
};
//
//
//
//
//
// HOSPITAL DELETE ONE INSURANCE PROVIDER
exports.deleteOneInsuranceProvider = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, insuranceProviderId } = req.body;

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }

  // Check if insuranceProviderId is missing
  if (!insuranceProviderId) {
    return res.status(401).json({
      status: "failed",
      message: "Insurance Provider ID is missing"
    });
  }

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Verifying the token
  jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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
      // Check if decoded token matches hospitalId from request body
      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized access"
        });
      }

      // Call the model function to delete the insurance provider
      await Hospital.deleteOneInsuranceProvider(hospitalId, insuranceProviderId);

      return res.status(200).json({
        status: "success",
        message: "Insurance provider deleted successfully",
        data: { insuranceProviderId: insuranceProviderId }
      });
    } catch (error) {
      console.error("Error deleting insurance provider:", error);

      if (error.message === "Insurance provider not found or already deleted" || error.message === "Hospital not found") {
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
  });
};
//
//
//
//
// HOSPITAL VIEW ALL INSURANCE PROVIDERS
exports.viewAllInsuranceProviders = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
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
          // Check if decoded token matches hospitalId from request body
          if (decoded.hospitalId != hospitalId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const allInsuranceProviders = await Hospital.viewAllInsuranceProviders(hospitalId);
          return res.status(200).json({
            status: "success",
            message: "All insurance providers retrieved successfully",
            data: allInsuranceProviders,
          });
        } catch (error) {
          console.error("Error viewing all insurance providers:", error);

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
    console.error("Error during viewInsuranceProviders:", error);
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
// HOSPITAL VIEW ONE INSURANCE PROVIDER
exports.viewOneInsuranceProvider = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

    // Check if insuranceProviderId is missing
    if (!insuranceProviderId) {
      return res.status(401).json({
        status: "failed",
        message: "Insurance Provider ID is missing"
      });
    }

    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
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
          // Check if decoded token matches hospitalId from request body
          if (decoded.hospitalId != hospitalId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const insuranceProviderData = await Hospital.viewOneInsuranceProvider(
            hospitalId,
            insuranceProviderId
          );
          return res.status(200).json({
            status: "success",
            message: "Insurance provider retrieved successfully",
            data: insuranceProviderData,
          });
        } catch (error) {
          console.error("Error viewing one insurance provider:", error);
          if (
            error.message === "Insurance provider not found for this hospital" ||
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
    console.error("Error during viewOneInsuranceProvider:", error);
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
// HOSPITAL SEARCH INSURANCE PROVIDERS
exports.searchInsuranceProviders = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, searchQuery } = req.body;

  try {
    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

        // Token is valid, proceed to search insurance providers
        try {
          const searchResult = await Hospital.searchInsuranceProviders(
            hospitalId,
            searchQuery
          );

          return res.status(200).json({
            status: "success",
            message: "Insurance Providers found successfully",
            data: searchResult,
          });
        } catch (error) {
          console.error("Error searching insurance providers:", error);

          if (error.message === "Hospital not found") {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else if (error.message === "No insurance providers found") {
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
    console.error("Error searching insurance providers:", error);
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
// HOSPITAL SUSPEND INSURANCE PROVIDER
exports.suspendInsuranceProvider = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, insuranceProviderId } = req.body;

    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    if (!hospitalId) {
      return res.status(401).json({
        status: "failed",
        message: "Hospital ID is missing"
      });
    }

    if (!insuranceProviderId) {
      return res.status(401).json({
        status: "failed",
        message: "Insurance Provider ID is missing"
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
          const suspensionStatus = await Hospital.suspendOneInsuranceProvider(
            insuranceProviderId,
            hospitalId
          );

          if (suspensionStatus) {
            return res.status(200).json({
              status: "success",
              message: "Insurance Provider suspended successfully",
              data: { insuranceProviderId },
            });
          } else {
            throw new Error("Error suspending insurance provider");
          }
        } catch (error) {
          console.error("Error suspending insurance provider:", error);

          if (
            error.message === "Insurance Provider not found or already suspended" ||
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
    console.error("Error suspending insurance provider:", error);
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
// HOSPITAL UNSUSPEND INSURANCE PROVIDER
exports.unsuspendInsuranceProvider = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

    // Check if insuranceProviderId is missing
    if (!insuranceProviderId) {
      return res.status(401).json({
        status: "failed",
        message: "Insurance Provider ID is missing"
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
          const unsuspensionStatus = await Hospital.unsuspendOneInsuranceProvider(
            insuranceProviderId,
            hospitalId
          );

          if (unsuspensionStatus) {
            return res.status(200).json({
              status: "success",
              message: "Insurance Provider unsuspended successfully",
              data: { insuranceProviderId },
            });
          } else {
            throw new Error("Error unsuspending insurance provider");
          }
        } catch (error) {
          console.error("Error unsuspending insurance provider:", error);

          if (
            error.message === "Insurance Provider not found or not suspended" ||
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
    console.error("Error unsuspending insurance provider:", error);
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
// HOSPITAL VIEW ALL SUSPENDED INSURANCE PROVIDERS
exports.viewAllSuspendedInsuranceProviders = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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

        // Token is valid, proceed to fetch all suspended insurance providers
        try {
          const suspendedProviders = await Hospital.viewAllSuspendedInsuranceProviders(hospitalId);
          return res.status(200).json({
            status: "success",
            message: "All Suspended Insurance Providers retrieved successfully",
            data: suspendedProviders,
          });
        } catch (error) {
          console.error("Error viewing all suspended insurance providers:", error);
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
// HOSPITAL VIEW ONE SUSPENDED INSURANCE PROVIDER
exports.viewOneSuspendedInsuranceProvider = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

    // Check if insuranceProviderId is missing
    if (!insuranceProviderId) {
      return res.status(401).json({
        status: "failed",
        message: "Insurance Provider ID is missing"
      });
    }

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

        // Token is valid, proceed to fetch details of one suspended insurance provider
        try {
          const suspendedProviderDetails = await Hospital.viewOneSuspendedInsuranceProvider(
            insuranceProviderId,
            hospitalId
          );
          return res.status(200).json({
            status: "success",
            message: "Suspended Insurance Provider details",
            data: suspendedProviderDetails,
          });
        } catch (error) {
          if (
            error.message === "Suspended insurance provider not found" ||
            error.message === "Hospital not found"
          ) {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else {
            console.error("Error viewing suspended insurance provider details:", error);
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
//
// HOSPITAL SEND NOTIFICATION TO INSURANCE PROVIDER
exports.sendNotificationToInsuranceProvider = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, insuranceProviderId, notificationMessage } = req.body;

    // Check if token is provided
    if (!token) {
      return res.status(403).json({
        status: "error",
        message: "Token is missing"
      });
    }

    // Check if hospitalId, insuranceProviderId, and notificationMessage are provided
    if (!hospitalId) {
      return res.status(401).json({
        status: "error",
        message: "Hospital ID is missing"
      });
    }
    if (!insuranceProviderId) {
      return res.status(401).json({
        status: "error",
        message: "Insurance Provider ID is missing"
      });
    }

    // Token verification
    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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

      // Check if the decoded hospitalId matches the provided hospitalId
      if (decoded.hospitalId != hospitalId) {
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

        // Your validation logic here
        const messageValidation = dataValidator.isValidMessage(notificationMessage);
        if (!messageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["notificationMessage"] = [messageValidation.message];
        }

        return validationResults;
      }

      // Validate notification message
      const validationResults = validateNotificationData(notificationMessage);

      // If validation fails, return error response
      if (!validationResults.isValid) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: validationResults.errors
        });
      }

      try {
        // Send notification to insurance provider
        const notificationDetails = await Hospital.sendNotificationToInsuranceProvider(hospitalId, insuranceProviderId, notificationMessage);

        // Return success response
        return res.status(200).json({
          status: "success",
          message: "Notification sent successfully",
          data: notificationDetails
        });
      } catch (error) {
        // Handle errors
        console.error("Error sending notification to insurance provider:", error);

        // Return appropriate error response
        if (error.message === "Hospital not found" || error.message === "Insurance Provider not found or not active") {
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
    // Handle unexpected errors
    console.error("Error in sendNotificationToInsuranceProvider controller:", error);
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
// HOSPITAL VIEW ALL PATIENTS
exports.viewAllPatients = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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

        // Token is valid, proceed to fetch all hospital patients
        try {
          const allPatients = await Hospital.viewAllPatients(hospitalId); // Using the model function to get all patients
          return res.status(200).json({
            status: "success",
            message: "All Hospital Patients retrieved successfully",
            data: allPatients,
          });
        } catch (error) {
          console.error("Error viewing all hospital patients:", error);
          if (error.message === "No patients found for this hospital.") {
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
//
// HOSPITAL VIEW ONE PATIENT
exports.viewOnePatient = async (req, res) => {
  const token = req.headers.token;
  const { patientId, hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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

  // Check if insuranceProviderId is missing
  if (!patientId) {
    return res.status(401).json({
      status: "failed",
      message: "Patient ID is missing"
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

        // Token is valid, proceed to fetch the patient
        try {
          const patient = await Hospital.viewOnePatient(patientId, hospitalId); // Using the model function to get one patient
          return res.status(200).json({
            status: "success",
            message: "Patient retrieved successfully",
            data: patient,
          });
        } catch (error) {
          console.error("Error viewing patient:", error);
          if (error.message === "No patient found for this hospital.") {
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
//
// HOSPITAL SEARCH PATIENTS
exports.searchPatients = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, searchQuery } = req.body;

  try {
    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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

        // Token is valid, proceed to search patients
        try {
          const searchResult = await Hospital.searchPatients(
            hospitalId,
            searchQuery
          );

          return res.status(200).json({
            status: "success",
            message: "Patients found successfully",
            data: searchResult,
          });
        } catch (error) {
          console.error("Error searching patients:", error);

          if (error.message === "Hospital not found") {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else if (error.message === "No patients found") {
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
    console.error("Error searching patients:", error);
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
// HOSPITAL SEND NOTIFICATION TO PATIENT
exports.sendNotificationToPatient = async (req, res) => {
  try {
    const token = req.headers.token;
    const { hospitalId, patientId, notificationMessage } = req.body;

    // Check if token is provided
    if (!token) {
      return res.status(403).json({
        status: "error",
        message: "Token is missing"
      });
    }

    // Check if hospitalId, patientId, and notificationMessage are provided
    if (!hospitalId) {
      return res.status(401).json({
        status: "error",
        message: "Hospital ID is missing"
      });
    }
    if (!patientId) {
      return res.status(401).json({
        status: "error",
        message: "Patient ID is missing"
      });
    }

    // Token verification
    jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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

      // Check if the decoded hospitalId matches the provided hospitalId
      if (decoded.hospitalId != hospitalId) {
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

        // Your validation logic here
        const messageValidation = dataValidator.isValidMessage(notificationMessage);
        if (!messageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["notificationMessage"] = [messageValidation.message];
        }

        return validationResults;
      }

      // Validate notification message
      const validationResults = validateNotificationData(notificationMessage);

      // If validation fails, return error response
      if (!validationResults.isValid) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: validationResults.errors
        });
      }

      try {
        // Send notification to patient
        const notificationDetails = await Hospital.sendNotificationToPatient(hospitalId, patientId, notificationMessage);

        // Return success response
        return res.status(200).json({
          status: "success",
          message: "Notification sent successfully",
          data: notificationDetails
        });
      } catch (error) {
        // Handle errors
        console.error("Error sending notification to patient:", error);

        // Return appropriate error response
        if (error.message === "Hospital not found" || error.message === "Patient not found or not active") {
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
    // Handle unexpected errors
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
// HOSPITAL VIEW ALL DISCHARGE REQUESTS
exports.viewAllDischargeRequests = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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

        // Token is valid, proceed to fetch all discharge requests
        try {
          const allDischargeRequests = await Hospital.viewAllDischargeRequests(hospitalId);
          return res.status(200).json({
            status: "success",
            message: "All Discharge Requests retrieved successfully",
            data: allDischargeRequests,
          });
        } catch (error) {
          console.error("Error viewing all discharge requests:", error);
          if (error.message === "Hospital not found" || error.message === "No discharge requests found for this hospital.") {
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
//
// HOSPITAL VIEW ONE DISCHARGE REQUEST
exports.viewOneDischargeRequestWithDetails = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, requestId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalId or requestId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }

  if (!requestId) {
    return res.status(401).json({
      status: "failed",
      message: "Request ID is missing"
    });
  }

  try {
    // Verifying the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_HOSPITAL,
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            status: "failed",
            message: err.name === "TokenExpiredError" ? "Token has expired" : "Invalid token"
          });
        }

        // Check if decoded token matches hospitalId from request body
        if (decoded.hospitalId != hospitalId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Token is valid, proceed to fetch the discharge request with details
        try {
          const dischargeRequestDetails = await Hospital.viewOneDischargeRequest(requestId, hospitalId);
          return res.status(200).json({
            status: "success",
            message: "Discharge Request retrieved successfully",
            data: dischargeRequestDetails,
          });
        } catch (error) {
          console.error("Error viewing discharge request details:", error);
          if (error.message === "Discharge request not found or not available." || error.message === "Hospital not found or not active.") {
            return res.status(422).json({
              status: "error",
              message: error.message,
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
// HOSPITAL APPROVE ONE DISCHARGE REQUEST
exports.approveOneDischargeRequest = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, requestId } = req.body;

  // Check if hospitalId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }

  // Check if requestId is missing
  if (!requestId) {
    return res.status(401).json({
      status: "failed",
      message: "Request ID is missing"
    });
  }

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Verifying the token
  jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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
      // Check if decoded token matches hospitalId from request body
      if (decoded.hospitalId != hospitalId) {
        return res.status(403).json({
          status: "error",
          message: "Unauthorized access"
        });
      }

      // Call the model function to approve the discharge request
      await Hospital.approveOneDischargeRequest(hospitalId, requestId);

      return res.status(200).json({
        status: "success",
        message: "Discharge request approved successfully",
        data: { requestId: requestId }
      });
    } catch (error) {
      console.error("Error approving discharge request:", error);

      if (error.message === "Discharge request not found or already approved" || error.message === "Hospital not found") {
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
  });
};
//
//
//
//
// HOSPITAL DELETE ONE DISCHARGE REQUEST
exports.deleteOneDischargeRequest = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, requestId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalId or requestId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }
  if (!requestId) {
    return res.status(401).json({
      status: "failed",
      message: "Request ID is missing"
    });
  }

  // Verifying the token
  jwt.verify(token, process.env.JWT_SECRET_KEY_HOSPITAL, async (err, decoded) => {
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

    // Check if decoded token matches hospitalId from request body
    if (decoded.hospitalId != hospitalId) {
      return res.status(403).json({
        status: "error",
        message: "Unauthorized access"
      });
    }

    // Proceed to delete the discharge request
    try {
      const deletedRequestId = await Hospital.deleteOneDischargeRequest(hospitalId, requestId);

      return res.status(200).json({
        status: "success",
        message: "Discharge request deleted successfully",
        requestId: deletedRequestId
      });
    } catch (error) {
      console.error("Error deleting discharge request:", error);

      if (error.message === "Discharge request not found or already deleted" || error.message === "Hospital not found") {
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
  });
};
//
//
//
// 
// HOSPITAL VIEW ALL MEDICAL RECORDS OF ALL PATIENTS
exports.viewAllMedicalRecords = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
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

  try {
    // Verifying the token
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

      // Token is valid, proceed to fetch all medical records
      const allMedicalRecords = await Hospital.viewAllMedicalRecords(hospitalId);
      return res.status(200).json({
        status: "success",
        message: "Medical records retrieved successfully",
        data: allMedicalRecords,
      });
    });
  } catch (error) {
    console.error("Error viewing all medical records:", error);
    // Handle specific errors from the model
    if (error.message === "Hospital not found or not active." || error.message === "No medical records found for this hospital.") {
      return res.status(422).json({
        status: "error",
        error: error.message
      });
    }
    // Handle unexpected errors
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
// HOSPITAL VIEW ONE MEDICAL RECORD OF ONE PATIENT
exports.viewOneMedicalRecord = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, recordId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalId or recordId is missing
  if (!hospitalId) {
    return res.status(401).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }
  if (!recordId) {
    return res.status(401).json({
      status: "failed",
      message: "Record ID is missing"
    });
  }

  try {
    // Verifying the token
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

      // Token is valid, proceed to fetch the medical record
      try {
        const medicalRecord = await Hospital.viewOneMedicalRecord(hospitalId, recordId);
        return res.status(200).json({
          status: "success",
          message: "Medical record retrieved successfully",
          data: medicalRecord,
        });
      } catch (error) {
        console.error("Error viewing one medical record:", error);

        if (error.message === "Medical record not found or does not belong to this hospital." || error.message === "Hospital not found or not active.") {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        }

        // Handle unexpected errors
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message,
        });
      }
    });
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
//
// HOSPITAL VIEW ALL MEDICAL RECORDS OF ONE PATIENT
exports.viewAllMedicalRecordsOfOnePatient = async (req, res) => {
  const token = req.headers.token;
  const { hospitalId, patientId } = req.body;

  // Check if token is missing
  if (!token) {
    return res.status(403).json({
      status: "failed",
      message: "Token is missing"
    });
  }

  // Check if hospitalId or patientId is missing
  if (!hospitalId) {
    return res.status(400).json({
      status: "failed",
      message: "Hospital ID is missing"
    });
  }
  if (!patientId) {
    return res.status(400).json({
      status: "failed",
      message: "Patient ID is missing"
    });
  }

  try {
    // Verifying the token
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

      // Token is valid, proceed to fetch all medical records for the patient
      try {
        const medicalRecords = await Hospital.viewAllMedicalRecordsOfOnePatient(hospitalId, patientId);
        return res.status(200).json({
          status: "success",
          message: "Medical records retrieved successfully",
          data: medicalRecords,
        });
      } catch (error) {
        console.error("Error viewing all medical records of one patient:", error);
        if (error.message === "Patient not found or not active in this hospital." || error.message === "Hospital not found or not active.") {
          return res.status(422).json({
            status: "error",
            error: error.message
          });
        }

        // Handle unexpected errors
        return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message,
        });
      }
    });
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
//





