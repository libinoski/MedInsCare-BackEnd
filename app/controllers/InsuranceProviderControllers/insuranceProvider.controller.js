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
