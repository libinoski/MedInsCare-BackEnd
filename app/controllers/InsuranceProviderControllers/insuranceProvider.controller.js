// insuranceProvider.controller.js
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const dataValidator = require("../../config/data.validate");
const fs = require("fs");
const { InsuranceProvider } = require("../../models/InsuranceProviderModels/insuranceProvider.model");
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
//
//INSURANCE PROVIDER REGISTER
exports.register = async (req, res) => {
    const uploadInsuraceProviderImages = multer({
      storage: multer.memoryStorage(),
    }).fields([
      { name: "insuranceProviderIdProofImage", maxCount: 1 },
      { name: "insuranceProviderProfileImage", maxCount: 1 }
    ]);
  
    uploadInsuraceProviderImages(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          status: "validation failed",
          results: { files: "File upload failed", details: err.message },
        });
      }
  
      const insuranceProviderData = req.body;
  
      // Perform data cleanup
      insuranceProviderData.insuranceProviderAadhar = insuranceProviderData.insuranceProviderAadhar ? insuranceProviderData.insuranceProviderAadhar.replace(/\s/g, '') : '';
      insuranceProviderData.insuranceProviderMobile = insuranceProviderData.insuranceProviderMobile ? insuranceProviderData.insuranceProviderMobile.replace(/\s/g, '') : '';
  
      const idProofImageFile = req.files["insuranceProviderIdProofImage"] ? req.files["insuranceProviderIdProofImage"][0] : null;
      const profileImageFile = req.files["insuranceProviderProfileImage"] ? req.files["insuranceProviderProfileImage"][0] : null;
  
      const validationResults = validateInsuranceProviderRegistration(insuranceProviderData, idProofImageFile, profileImageFile);
  
      if (!validationResults.isValid) {
        // Delete uploaded images from local storage
        if (idProofImageFile && idProofImageFile.filename) {
          const idProofImagePath = path.join("Files/InsuranceProviderImages", idProofImageFile.filename);
          fs.unlinkSync(idProofImagePath);
        }
        if (profileImageFile && profileImageFile.filename) {
          const profileImagePath = path.join("Files/InsuranceProviderImages", profileImageFile.filename);
          fs.unlinkSync(profileImagePath);
        }
        return res.status(400).json({
          status: "failed",
          message: "Validation failed",
          results: validationResults.errors,
        });
      }
  
      // Upload insurance provider images to S3
      const idProofFileName = `insuranceProviderIdProof-${Date.now()}${path.extname(idProofImageFile.originalname)}`;
      const profileImageFileName = `insuranceProviderProfileImage-${Date.now()}${path.extname(profileImageFile.originalname)}`;
  
      try {
        const idProofFileLocation = await uploadFileToS3(idProofImageFile, idProofFileName, idProofImageFile.mimetype);
        const profileImageFileLocation = await uploadFileToS3(profileImageFile, profileImageFileName, profileImageFile.mimetype);
  
        insuranceProviderData.insuranceProviderIdProofImage = idProofFileLocation;
        insuranceProviderData.insuranceProviderProfileImage = profileImageFileLocation;
  
        // Register insurance provider
        const registrationResponse = await InsuranceProvider.register(insuranceProviderData);
        return res.status(200).json({
          status: "success",
          message: "Insurance provider registered successfully",
          data: registrationResponse,
        });
      } catch (error) {
        // Handling errors from the model
        if (error.name === "ValidationError") {
          // Delete uploaded images from S3
          if (insuranceProviderData.insuranceProviderIdProofImage) {
            const idProofS3Key = insuranceProviderData.insuranceProviderIdProofImage.split('/').pop();
            const idProofParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `insuranceProviderImages/${idProofS3Key}`
            };
            try {
              await s3Client.send(new DeleteObjectCommand(idProofParams));
            } catch (s3Error) {
              console.error("Error deleting ID proof image from S3:", s3Error);
            }
          }
          if (insuranceProviderData.insuranceProviderProfileImage) {
            const profileS3Key = insuranceProviderData.insuranceProviderProfileImage.split('/').pop();
            const profileParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `insuranceProviderImages/${profileS3Key}`
            };
            try {
              await s3Client.send(new DeleteObjectCommand(profileParams));
            } catch (s3Error) {
              console.error("Error deleting profile image from S3:", s3Error);
            }
          }
          // Delete uploaded images from local storage
          if (idProofImageFile && idProofImageFile.filename) {
            const idProofImagePath = path.join("Files/InsuranceProviderImages", idProofImageFile.filename);
            fs.unlinkSync(idProofImagePath);
          }
          if (profileImageFile && profileImageFile.filename) {
            const profileImagePath = path.join("Files/InsuranceProviderImages", profileImageFile.filename);
            fs.unlinkSync(profileImagePath);
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
  
    async function uploadFileToS3(fileBuffer, fileName, mimeType) {
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `insuranceProviderImages/${fileName}`,
        Body: fileBuffer.buffer,
        ACL: "public-read",
        ContentType: mimeType,
      };
  
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
    }
  
    function validateInsuranceProviderRegistration(insuranceProviderData, idProofImageFile, profileImageFile) {
      const validationResults = {
        isValid: true,
        errors: {},
      };
  
  
      // Validate insurance provider name
      const nameValidation = dataValidator.isValidName(insuranceProviderData.insuranceProviderName);
      if (!nameValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["insuranceProviderName"] = [nameValidation.message];
      }
  
      // Validate insurance provider email
      const emailValidation = dataValidator.isValidEmail(insuranceProviderData.insuranceProviderEmail);
      if (!emailValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["insuranceProviderEmail"] = [emailValidation.message];
      }
  
      // Validate insurance provider Aadhar
      const aadharValidation = dataValidator.isValidAadharNumber(insuranceProviderData.insuranceProviderAadhar);
      if (!aadharValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["insuranceProviderAadhar"] = [aadharValidation.message];
      }
  
      // Validate insurance provider mobile number
      const mobileValidation = dataValidator.isValidMobileNumber(insuranceProviderData.insuranceProviderMobile);
      if (!mobileValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["insuranceProviderMobile"] = [mobileValidation.message];
      }
  
      // Validate insurance provider password
      const passwordValidation = dataValidator.isValidPassword(insuranceProviderData.insuranceProviderPassword);
      if (!passwordValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["insuranceProviderPassword"] = [passwordValidation.message];
      }
  
      // Validate insurance provider address
      const addressValidation = dataValidator.isValidAddress(insuranceProviderData.insuranceProviderAddress);
      if (!addressValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["insuranceProviderAddress"] = [addressValidation.message];
      }
  
      // Validate insurance provider ID proof image
      const idProofImageValidation = dataValidator.isValidImageWith1MBConstraint(idProofImageFile);
      if (!idProofImageValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["insuranceProviderIdProofImage"] = [idProofImageValidation.message];
      }
  
      // Validate insurance provider profile image
      const profileImageValidation = dataValidator.isValidImageWith1MBConstraint(profileImageFile);
      if (!profileImageValidation.isValid) {
        validationResults.isValid = false;
        validationResults.errors["insuranceProviderProfileImage"] = [profileImageValidation.message];
      }
  
      return validationResults;
    }
};
//
//
//
//
//INSURANCE PROVIDER LOGIN 
exports.login = async (req, res) => {
    const { insuranceProviderEmail, insuranceProviderPassword } = req.body;

    function validateInsuranceProviderLogin() {
        const validationResults = {
            isValid: true,
            errors: {},
        };

        const emailValidation = dataValidator.isValidEmail(insuranceProviderEmail);
        if (!emailValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["insuranceProviderEmail"] = [emailValidation.message];
        }

        const passwordValidation = dataValidator.isValidPassword(insuranceProviderPassword);
        if (!passwordValidation.isValid) {
            validationResults.isValid = false;
            validationResults.errors["insuranceProviderPassword"] = [passwordValidation.message];
        }

        return validationResults;
    }

    const validationResults = validateInsuranceProviderLogin();
    if (!validationResults.isValid) {
        return res.status(400).json({
            status: "failed",
            message: "Validation failed",
            results: validationResults.errors
        });
    }

    try {
        const insuranceProvider = await InsuranceProvider.login(insuranceProviderEmail, insuranceProviderPassword);

        const token = jwt.sign(
            {
                insuranceProviderId: insuranceProvider.insuranceProviderId,
                insuranceProviderEmail: insuranceProvider.insuranceProviderEmail,
            },
            process.env.JWT_SECRET_KEY_INSURANCE_PROVIDER,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: { token, insuranceProvider },
        });
    } catch (error) {
        console.error("Error during insurance provider login:", error);

        if (error.message === "Insurance provider not found" || error.message === "Wrong password") {
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
// INSURANCE PROVIDER CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  const token = req.headers.token;
  const { insuranceProviderId, oldPassword, newPassword } = req.body;

  // Check if token is missing
  if (!token) {
      return res.status(403).json({
          status: "failed",
          message: "Token is missing"
      });
  }

  // Check if hospitalId is missing
  if (!insuranceProviderId) {
      return res.status(401).json({
          status: "failed",
          message: "Insurance ProviderId ID is missing"
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

          if (decoded.insuranceProviderId != insuranceProviderId) {
              return res.status(403).json({
                  status: "failed",
                  message: "Unauthorized access"
              });
          }

          try {
              function validateInsuranceProviderChangePassword() {
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

              await InsuranceProvider.changePassword(insuranceProviderId, oldPassword, newPassword);
              return res.status(200).json({
                  status: "success",
                  message: "Password changed successfully"
              });
          } catch (error) {
              if (
                  error.message === "Insurance provider not found" ||
                  error.message === "Incorrect old password"
              ) {
                  return res.status(422).json({
                      status: "failed",
                      message: "Password change failed",
                      error: error.message
                  });
              } else {
                  console.error("Error changing insurance provider password:", error);
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
// INSURANCE PROVIDER UPDATE ID PROOF IMAGE
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
    process.env.JWT_SECRET_KEY_INSURANCE_PROVIDER,
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
      }).single("InsuranceProviderIdProofImage");

      uploadIdProofImage(req, res, async (err) => {
        if (err || !req.file) {
          return res.status(400).json({
            status: "error",
            message: "File upload failed",
            results: err ? err.message : "File is required.",
          });
        }

        const { insuranceProviderId } = req.body;

        if (!insuranceProviderId) {
          // Delete the uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(401).json({
            status: "failed",
            message: "Insurance provider id is missing",
          });
        }

        if (decoded.insuranceProviderId != insuranceProviderId) {
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
            validationResults.errors["insuranceProviderProofImage"] = [imageValidation.message];
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
          const fileName = `insuranceProviderIdProof-${Date.now()}${path.extname(file.originalname)}`;
          const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `insuranceProviderImages/${fileName}`,
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

          await InsuranceProvider.changeIdProofImage(
            insuranceProviderId,
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
            Key: `insuranceProviderImages/${key}` // Constructing the full key
          };
          await s3Client.send(new DeleteObjectCommand(params));

          // Delete the uploaded file
          fs.unlinkSync(req.file.path);

          if (error.message === "Insurance provider not found") {
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
// INSURANCE PROVIDER UPDATE PROFILE IMAGE
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
      process.env.JWT_SECRET_KEY_INSURANCE_PROVIDER,
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
          }).single("insuranceProviderProfileImage");

          uploadProfileImage(req, res, async (err) => {
              if (err || !req.file) {
                  return res.status(400).json({
                      status: "error",
                      message: "File upload failed",
                      results: err ? err.message : "File is required.",
                  });
              }

              const { insuranceProviderId } = req.body;

              if (!insuranceProviderId) {
                  // Delete the uploaded file
                  fs.unlinkSync(req.file.path);
                  return res.status(401).json({
                      status: "failed",
                      message: "Insurance Provider ID is missing",
                  });
              }

              if (decoded.insuranceProviderId != insuranceProviderId) {
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
                      validationResults.errors["insuranceProviderProfileImage"] = [imageValidation.message];
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
                  const fileName = `insuranceProviderProfile-${Date.now()}${path.extname(file.originalname)}`;
                  const uploadParams = {
                      Bucket: process.env.S3_BUCKET_NAME,
                      Key: `insuranceProviderImages/${fileName}`,
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

                  await InsuranceProvider.changeProfileImage(
                      insuranceProviderId,
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
                      Key: `insuranceProviderImages/${key}` // Constructing the full key
                  };
                  await s3Client.send(new DeleteObjectCommand(params));

                  // Delete the uploaded file
                  fs.unlinkSync(req.file.path);

                  if (error.message === "Insurance provider not found") {
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
// INSURANCE PROVIDER VIEW PROFILE
exports.viewProfile = async (req, res) => {
  try {
    const token = req.headers.token;
    const { insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if insuranceProviderId is missing
    if (!insuranceProviderId) {
      return res.status(400).json({
        status: "failed",
        results: "Insurance Provider ID is missing"
      });
    }

    // Verify the token
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY_INSURANCE_PROVIDER,
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

        // Check if decoded token matches insuranceProviderId from request body
        if (decoded.insuranceProviderId != insuranceProviderId) {
          return res.status(403).json({
            status: "failed",
            message: "Unauthorized access"
          });
        }

        // Fetch insurance provider data
        try {
          const insuranceProviderData = await InsuranceProvider.viewProfile(
            insuranceProviderId
          );
          return res.status(200).json({
            status: "success",
            message: "Insurance provider profile retrieved successfully",
            data: insuranceProviderData
          });
        } catch (error) {
          if (error.message === "Insurance provider not found") {
            return res.status(422).json({
              status: "error",
              error: error.message
            });
          } else {
            console.error("Error fetching insurance provider profile:", error);
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
    console.error("Error fetching insurance provider profile:", error);
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
//
// INSURANCE PROVIDER UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
      const token = req.headers.token;
      const {
          insuranceProviderId,
          insuranceProviderName,
          insuranceProviderMobile,
          insuranceProviderAddress,
          insuranceProviderAadhar,
      } = req.body;

      // Check if insuranceProviderId is missing
      if (!insuranceProviderId) {
          return res.status(401).json({
              status: "error",
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

      // Verify the token
      jwt.verify(
          token,
          process.env.JWT_SECRET_KEY_INSURANCE_PROVIDER,
          async (err, decoded) => {
              if (err) {
                  if (err.name === "JsonWebTokenError") {
                      return res.status(403).json({
                          status: "error",
                          message: "Invalid token",
                          error: "Token verification failed"
                      });
                  } else if (err.name === "TokenExpiredError") {
                      return res.status(403).json({
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

              // Check if decoded token matches insuranceProviderId from request body
              if (decoded.insuranceProviderId != insuranceProviderId) {
                  return res.status(403).json({
                      status: "failed",
                      message: "Unauthorized access"
                  });
              }

              // Clean Aadhar and mobile data
              const cleanedAadhar = insuranceProviderAadhar.replace(/\s/g, '');
              const cleanedMobile = insuranceProviderMobile.replace(/\s/g, '');

              // Validate insurance provider profile update data
              function validateInsuranceProviderUpdateProfile() {
                  const validationResults = {
                      isValid: true,
                      errors: {}
                  };

                  const nameValidation = dataValidator.isValidName(insuranceProviderName);
                  if (!nameValidation.isValid) {
                      validationResults.isValid = false;
                      validationResults.errors["insuranceProviderName"] = [nameValidation.message];
                  }

                  const aadharValidation = dataValidator.isValidAadharNumber(cleanedAadhar);
                  if (!aadharValidation.isValid) {
                      validationResults.isValid = false;
                      validationResults.errors["insuranceProviderAadhar"] = [aadharValidation.message];
                  }

                  const mobileValidation = dataValidator.isValidMobileNumber(cleanedMobile);
                  if (!mobileValidation.isValid) {
                      validationResults.isValid = false;
                      validationResults.errors["insuranceProviderMobile"] = [mobileValidation.message];
                  }

                  const addressValidation = dataValidator.isValidAddress(insuranceProviderAddress);
                  if (!addressValidation.isValid) {
                      validationResults.isValid = false;
                      validationResults.errors["insuranceProviderAddress"] = [addressValidation.message];
                  }

                  return validationResults;
              }

              const validationResults = validateInsuranceProviderUpdateProfile();

              if (!validationResults.isValid) {
                  return res.status(400).json({
                      status: "failed",
                      message: "Validation failed",
                      results: validationResults.errors,
                  });
              }

              // Update insurance provider profile
              try {
                  const updatedInsuranceProvider = {
                      insuranceProviderId,
                      insuranceProviderName,
                      insuranceProviderMobile: cleanedMobile,
                      insuranceProviderAddress,
                      insuranceProviderAadhar: cleanedAadhar,
                  };
                  const data = await InsuranceProvider.updateProfile(updatedInsuranceProvider);

                  return res.status(200).json({
                      status: "success",
                      message: "Insurance provider updated successfully",
                      data,
                  });
              } catch (error) {
                  if (error.message === "Insurance Provider not found" || error.message === "Aadhar Number Already Exists.") {
                      return res.status(422).json({
                          status: "error",
                          error: error.message,
                      });
                  } else {
                      console.error("Error updating insurance provider profile:", error);
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
// INSURANCE PROVIDER VIEW ALL NEWS
exports.viewAllNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if insuranceProviderId is missing
    if (!insuranceProviderId) {
      return res.status(401).json({
        status: "failed",
        message: "Insurance provider ID is missing"
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
          // Check if decoded token matches insuranceProviderId from request body
          if (decoded.insuranceProviderId != insuranceProviderId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const allNewsData = await InsuranceProvider.viewAllNews(insuranceProviderId); // Using the viewAllNews method from the model
          return res.status(200).json({
            status: "success",
            message: "All hospital news retrieved successfully",
            data: allNewsData,
          });
        } catch (error) {
          console.error("Error viewing all hospital news:", error);

          if (error.message === "Insurance provider not found" || error.message === "Hospital not found or inactive") {
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
// INSURANCE PROVIDER VIEW  ONE NEWS
exports.viewOneNews = async (req, res) => {
  try {
    const token = req.headers.token;
    const { insuranceProviderId, hospitalNewsId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if insuranceProviderId is missing
    if (!insuranceProviderId) {
      return res.status(401).json({
        status: "failed",
        message: "Insurance provider ID is missing"
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
          // Check if decoded token matches insuranceProviderId from request body
          if (decoded.insuranceProviderId != insuranceProviderId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const newsItemData = await InsuranceProvider.viewOneNews(
            hospitalNewsId,
            insuranceProviderId
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
            error.message === "Insurance provider not found" 
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
// INSURANCE PROVIDER SEND NOTIFICATION TO CLIENT
exports.sendNotificationToClient = async (req, res) => {
  try {
    const token = req.headers.token;
    const { insuranceProviderId, clientId, notificationMessage } = req.body;

    if (!token) {
      return res.status(403).json({
        status: "error",
        message: "Token is missing"
      });
    }

    if (!insuranceProviderId) {
      return res.status(401).json({
        status: "error",
        message: "Insurance Provider ID is missing"
      });
    }

    if (!clientId) {
      return res.status(401).json({
        status: "error",
        message: "Client ID is missing"
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

      if (decoded.insuranceProviderId != insuranceProviderId) {
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
          validationResults.errors["notificationMessage"] = [messageValidation.message];
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
        const notificationDetails = await InsuranceProvider.sendNotificationToClient(insuranceProviderId, clientId, notificationMessage);

        return res.status(200).json({
          status: "success",
          message: "Notification sent successfully",
          data: notificationDetails
        });
      } catch (error) {
        console.error("Error sending notification to client:", error);

        if (error.message === "Insurance Provider not found" || error.message === "Client not found or not active") {
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
    console.error("Error in sendNotificationToClient controller:", error);
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
// INSURANCE PROVIDER VIEW ALL CLIENTS
exports.viewAllClients = async (req, res) => {
  try {
    const token = req.headers.token;
    const { insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
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
      process.env.JWT_SECRET_KEY_INSURANCE,
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
          // Check if decoded token matches insuranceProviderId from request body
          if (decoded.insuranceProviderId != insuranceProviderId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const allClientsData = await InsuranceProvider.viewAllClients(insuranceProviderId);
          return res.status(200).json({
            status: "success",
            message: "All clients retrieved successfully",
            data: allClientsData,
          });
        } catch (error) {
          console.error("Error viewing all clients:", error);

          if (error.message === "No clients found for this insurance provider") {
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
    console.error("Error during viewAllClients:", error);
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
//INSURANCE PROVIDER VIEW ONE CLIENT
exports.viewOneClient = async (req, res) => {
  try {
    const token = req.headers.token;
    const { clientId, insuranceProviderId } = req.body;

    // Check if token is missing
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "Token is missing"
      });
    }

    // Check if clientId is missing
    if (!clientId) {
      return res.status(401).json({
        status: "failed",
        message: "Client ID is missing"
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
      process.env.JWT_SECRET_KEY_INSURANCE,
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
          // Check if decoded token matches insuranceProviderId from request body
          if (decoded.insuranceProviderId != insuranceProviderId) {
            return res.status(403).json({
              status: "error",
              message: "Unauthorized access"
            });
          }

          const clientData = await InsuranceProvider.viewOneClient(clientId, insuranceProviderId);
          return res.status(200).json({
            status: "success",
            message: "Client data retrieved successfully",
            data: clientData,
          });
        } catch (error) {
          console.error("Error viewing one client:", error);

          if (error.message === "Client not found for this insurance provider") {
            return res.status(404).json({
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
    console.error("Error during viewOneClient:", error);
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
// ADD INSURANCE PACKAGE
exports.addInsurancePackage = async (req, res) => {
  try {
      const token = req.headers.token;
      const {
          insuranceProviderId,
          packageTitle,
          packageDetails,
          packageDuration,
          packageAmount,
          packageTAndC
      } = req.body;

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

      // Verify the token
      jwt.verify(token, process.env.JWT_SECRET_KEY_INSURANCE_PROVIDER, async (err, decoded) => {
          if (err) {
              if (err.name === "JsonWebTokenError") {
                  return res.status(403).json({
                      status: "error",
                      message: "Invalid token",
                      error: "Token verification failed"
                  });
              } else if (err.name === "TokenExpiredError") {
                  return res.status(403).json({
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

          // Check if decoded token matches insuranceProviderId from request body
          if (decoded.insuranceProviderId != insuranceProviderId) {
              return res.status(403).json({
                  status: "failed",
                  message: "Unauthorized access"
              });
          }

          const uploadPackageImage = multer({ storage: multer.memoryStorage() }).single("packageImage");

          uploadPackageImage(req, res, async (err) => {
              if (err) {
                  return res.status(400).json({
                      status: "error",
                      message: "File upload error",
                      results: err.message
                  });
              }

              if (!req.file) {
                  return res.status(401).json({
                      status: "error",
                      message: "Package image is required."
                  });
              }

              const validationResults = validateMedicalPackageData({
                  packageTitle,
                  packageDetails,
                  packageDuration,
                  packageAmount,
                  packageTAndC,
                  packageImage: req.file
              });

              if (!validationResults.isValid) {
                  return res.status(400).json({
                      status: "failed",
                      message: "Validation failed",
                      results: validationResults.errors
                  });
              }

              try {
                  const packageImageFileLocation = await uploadFileToS3(req.file);

                  const packageData = {
                      packageTitle,
                      packageDetails,
                      packageDuration,
                      packageAmount,
                      packageTAndC,
                      packageImage: packageImageFileLocation
                  };

                  const packageRecord = await InsuranceProvider.addInsurancePackage(insuranceProviderId, packageData);

                  return res.status(200).json({
                      status: "success",
                      message: "Insurance package added successfully",
                      data: packageRecord
                  });
              } catch (error) {
                  console.error("Error adding insurance package:", error);

                  if (req.file) {
                      try {
                          await deleteFileFromS3(req.file);
                      } catch (s3Error) {
                          console.error("Error deleting package image from S3:", s3Error);
                      }
                  }

                  if (error.message === "Insurance provider not found, not active, or suspended.") {
                      if (packageImageFileLocation) {
                          const packageS3Key = packageImageFileLocation.split('/').pop();
                          const packageParams = {
                              Bucket: process.env.S3_BUCKET_NAME,
                              Key: `packageImages/${packageS3Key}`
                          };
                          try {
                              await s3Client.send(new DeleteObjectCommand(packageParams));
                          } catch (s3Error) {
                              console.error("Error deleting package image from S3:", s3Error);
                          }
                      }
                      return res.status(422).json({
                          status: "failed",
                          error: error.message
                      });
                  } else {
                      return res.status(500).json({
                          status: "error",
                          message: "Internal server error during package addition",
                          error: error.message,
                      });
                  }
              }
          });
      });
  } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
          status: "error",
          message: "Internal server error",
          error: error.message,
      });
  }

  function validateMedicalPackageData(data) {
      const validationResults = {
          isValid: true,
          errors: {}
      };

      // Validate packageTitle
      const packageTitleValidation = dataValidator.isValidTitle(data.packageTitle);
      if (!packageTitleValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["packageTitle"] = [packageTitleValidation.message];
      }

      // Validate packageDetails
      const packageDetailsValidation = dataValidator.isValidText(data.packageDetails);
      if (!packageDetailsValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["packageDetails"] = [packageDetailsValidation.message];
      }

      // Validate packageDuration
      const packageDurationValidation = dataValidator.isValidText(data.packageDuration);
      if (!packageDurationValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["packageDuration"] = [packageDurationValidation.message];
      }

      // Validate packageAmount
      const packageAmountValidation = dataValidator.isValidCost(data.packageAmount);
      if (!packageAmountValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["packageAmount"] = [packageAmountValidation.message];
      }

      // Validate packageTAndC
      const packageTAndCValidation = dataValidator.isValidText(data.packageTAndC);
      if (!packageTAndCValidation.isValid) {
          validationResults.isValid = false;
          validationResults.errors["packageTAndC"] = [packageTAndCValidation.message];
      }

      // Validate packageImage if it exists
      if (data.packageImage) {
          const packageImageValidation = dataValidator.isValidImageWith1MBConstraint(data.packageImage);
          if (!packageImageValidation.isValid) {
              validationResults.isValid = false;
              validationResults.errors["packageImage"] = [packageImageValidation.message];
          }
      }

      return validationResults;
  }

  async function uploadFileToS3(file) {
      const fileName = `packageImage-${Date.now()}${path.extname(file.originalname)}`;
      const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: `packageImages/${fileName}`,
          Body: file.buffer,
          ACL: "public-read",
          ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
  }
};



