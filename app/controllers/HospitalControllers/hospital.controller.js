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
              status: "validation failed",
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
              status: "validation failed",
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
                  status: "error",
                  message: "Failed to upload image to S3",
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
          validationResults.errors["hospitalName"] = nameValidation.message;
      }

      // Email validation
      const emailValidation = dataValidator.isValidEmail(hospitalData.hospitalEmail);
      if (!emailValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalEmail"] = emailValidation.message;
      }

      // Aadhar validation
      const aadharValidation = dataValidator.isValidAadharNumber(hospitalData.hospitalAadhar);
      if (!aadharValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalAadhar"] = aadharValidation.message;
      }

      // Mobile validation
      const mobileValidation = dataValidator.isValidMobileNumber(hospitalData.hospitalMobile);
      if (!mobileValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalMobile"] = mobileValidation.message;
      }

      // Website validation
      const websiteValidation = dataValidator.isValidWebsite(hospitalData.hospitalWebSite);
      if (!websiteValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalWebSite"] = websiteValidation.message;
      }

      // Address validation
      const addressValidation = dataValidator.isValidAddress(hospitalData.hospitalAddress);
      if (!addressValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalAddress"] = addressValidation.message;
      }

      // Image validation
      if (hospitalImageFile && hospitalImageFile.filename) {
          const imageValidation = dataValidator.isValidImageWith1MBConstraint(hospitalImageFile);
          if (!imageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["hospitalImage"] = imageValidation.message;
          }
      }

      // Password validation
      const passwordValidation = dataValidator.isValidPassword(hospitalData.hospitalPassword);
      if (!passwordValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalPassword"] = passwordValidation.message;
      }

      return validationResults;
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
            error: error.message
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
// UPDATE HOSPITAL IMAGE
exports.updateImage = async (req, res) => {
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
              results: { file: "File upload failed", details: err.message },
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
              message: ""
            };

            if (!file) {
              validationResults.isValid = false;
              validationResults.message = "Hospital image is required";
            } else {
              const imageValidation = dataValidator.isValidImageWith1MBConstraint(file);
              if (!imageValidation.isValid) {
                validationResults.isValid = false;
                validationResults.message = imageValidation.message;
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
              status: "validation failed",
              results: imageValidation.message,
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
          const imagePath = path.join("Files/HospitalImages", req.file.filename);
          fs.unlinkSync(imagePath);
        }
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `hospitalImages/${s3Url.split('/').pop()}`
        };
        await s3Client.send(new DeleteObjectCommand(params));
        
        if (error.message === "Hospital not found") {
          return res.status(422).json({
            status: "failed",
            error: error.message
          });
        } else {
          return res.status(500).json({
            status: "error",
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
// VIEW PROFILE
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
// REGISTER STAFF
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
          console.log(req.files);

          const hospitalStaffData = req.body;

          // Check if hospitalStaffData.hospitalId exists
          if (!decoded.hospitalId!=hospitalStaffData.hospitalId) {
              return res.status(403).json({
                  status: "failed",
                  message: "Unauthorized access"
              });
          }

          // Perform data cleanup
          hospitalStaffData.hospitalStaffAadhar = hospitalStaffData.hospitalStaffAadhar ? hospitalStaffData.hospitalStaffAadhar.replace(/\s/g, '') : '';
          hospitalStaffData.hospitalStaffMobile = hospitalStaffData.hospitalStaffMobile ? hospitalStaffData.hospitalStaffMobile.replace(/\s/g, '') : '';

          if (!req.files || !req.files["hospitalStaffIdProofImage"] || !req.files["hospitalStaffProfileImage"]) {
            return res.status(400).json({
                status: "validation failed",
                error: "Hospital staff ID proof image and profile image are required",
            });
        }



          const staffIdProofImageFile = req.files["hospitalStaffIdProofImage"][0];
          const staffProfileImageFile = req.files["hospitalStaffProfileImage"][0];

          const validationResults = validateStaffRegistration(hospitalStaffData, staffIdProofImageFile, staffProfileImageFile);

          if (!validationResults.isValid) {
              // Delete uploaded images from local storage
              if (staffIdProofImageFile && staffIdProofImageFile.filename) {
                  const idProofImagePath = path.join("Files/StaffImages", staffIdProofImageFile.filename);
                  fs.unlinkSync(idProofImagePath);
              }
              if (staffProfileImageFile && staffProfileImageFile.filename) {
                  const profileImagePath = path.join("Files/StaffImages", staffProfileImageFile.filename);
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
                  status: "validation failed",
                  results: validationResults.errors,
              });
          }

          // Upload staff images to S3
          const idProofFileName = `staffIdProof-${Date.now()}${path.extname(staffIdProofImageFile.originalname)}`;
          const profileImageFileName = `staffProfileImage-${Date.now()}${path.extname(staffProfileImageFile.originalname)}`;

          try {
              const idProofFileLocation = await uploadFileToS3(staffIdProofImageFile, idProofFileName, staffIdProofImageFile.mimetype);
              const profileImageFileLocation = await uploadFileToS3(staffProfileImageFile, profileImageFileName, staffProfileImageFile.mimetype);

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
          Key: `staffImages/${fileName}`,
          Body: fileBuffer.buffer,
          ACL: "public-read",
          ContentType: mimeType,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
  }

  function validateStaffRegistration(hospitalStaffData, staffIdProofImageFile, staffProfileImageFile) {
      const validationResults = {
          isValid: true,
          errors: {},
      };

      // Name validation
      const nameValidation = dataValidator.isValidName(hospitalStaffData.hospitalStaffName);
      if (!nameValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffName"] = nameValidation.message;
      }

      // Email validation
      const emailValidation = dataValidator.isValidEmail(hospitalStaffData.hospitalStaffEmail);
      if (!emailValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffEmail"] = emailValidation.message;
      }

      // Aadhar validation
      const aadharValidation = dataValidator.isValidAadharNumber(hospitalStaffData.hospitalStaffAadhar);
      if (!aadharValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffAadhar"] = aadharValidation.message;
      }

      // Mobile validation
      const mobileValidation = dataValidator.isValidMobileNumber(hospitalStaffData.hospitalStaffMobile);
      if (!mobileValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffMobile"] = mobileValidation.message;
      }

      // Password validation
      const passwordValidation = dataValidator.isValidPassword(hospitalStaffData.hospitalStaffPassword);
      if (!passwordValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffPassword"] = passwordValidation.message;
      }

      // Address validation
      const addressValidation = dataValidator.isValidAddress(hospitalStaffData.hospitalStaffAddress);
      if (!passwordValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffAddress"] = addressValidation.message;
      }

      const idProofImageValidation =  dataValidator.isValidImageWith1MBConstraint(staffIdProofImageFile);
      if (!idProofImageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffIdProofImage"] = idProofImageValidation.message;
      }

      // Validate staff profile image
      const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(staffProfileImageFile);
      if (!profileImageValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["hospitalStaffProfileImage"] = profileImageValidation.message;
      }

      return validationResults;
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
// SUSPEND STAFF
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
// UNSUSPEND STAFF
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
// VIEW ALL STAFFS
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
// VIEW ONE STAFF
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
// SEARCH STAFFS
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
// ADD NEWS
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

        const newsImageStorage = multer.memoryStorage();

        const uploadNewsImage = multer({ storage: newsImageStorage }).single(
          "hospitalNewsImage"
        );

        uploadNewsImage(req, res, async function (err) {
          if (err) {
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
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(401).json({
              status: "failed",
              message: "Hospital ID is missing"
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
            if (req.file && req.file.path) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
              status: "error",
              message: "Validation failed",
              results: validationResults.errors,
            });
          }

          const uploadToS3 = async (fileName, fileBuffer) => {
            try {
              const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fileName,
                Body: fileBuffer,
                ACL: "public-read",
              };

              const uploadResult = await s3.upload(params).promise();
              return uploadResult.Location;
            } catch (error) {
              if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
              }
              throw error;
            }
          };

          try {
            const newsImageFileName = `hospitalNewsImage-${Date.now()}${path.extname(newsImageFile.originalname)}`;

            const imageUrl = await uploadToS3(newsImageFileName, newsImageFile.buffer);

            const newHospitalNews = {
              hospitalNewsTitle: newsData.hospitalNewsTitle,
              hospitalNewsContent: newsData.hospitalNewsContent,
              hospitalNewsImage: imageUrl,
            };

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
              if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
              }
              return res.status(422).json({
                status: "error",
                error: error.message
              });
            } else {
              if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
              }
              throw error;
            }
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
// UPDATE NEWS
exports.updateNews = async (req, res) => {
  try {
    const token = req.headers.token;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
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
              return res.status(401).json({
                status: "failed",
                message: "Hospital ID is missing"
              });
            }

            // Check if hospitalNewsId is missing
            if (!hospitalNewsId) {
              cleanupUploadedFiles(req);
              return res.status(401).json({
                status: "failed",
                message: "Hospital News ID is missing"
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
// VIEW ONE NEWS
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
