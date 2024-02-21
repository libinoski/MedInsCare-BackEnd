// insuranceProvider.model.js
const bcrypt = require("bcrypt");
const db = require("../db");
const { promisify } = require("util");
const dbQuery = promisify(db.query.bind(db));

// Hospital Model
const Hospital = function (hospital) {
  this.hospitalId = hospital.hospitalId;
  this.hospitalName = hospital.hospitalName;
  this.hospitalEmail = hospital.hospitalEmail;
  this.hospitalWebSite = hospital.hospitalWebSite;
  this.hospitalAadhar = hospital.hospitalAadhar;
  this.hospitalMobile = hospital.hospitalMobile;
  this.hospitalAddress = hospital.hospitalAddress;
  this.hospitalImage = hospital.hospitalImage;
  this.hospitalPassword = hospital.hospitalPassword;
  this.registeredDate = hospital.registeredDate;
  this.isActive = hospital.isActive;
  this.deleteStatus = hospital.deleteStatus;
  this.updateStatus = hospital.updateStatus;
  this.passwordUpdatedStatus = hospital.passwordUpdatedStatus;
  this.updatedDate = hospital.updatedDate;
};

// Insurance Provider Model
const InsuranceProvider = function (insuranceProvider) {
  this.insuranceProviderId = insuranceProvider.insuranceProviderId;
  this.hospitalId = insuranceProvider.hospitalId;
  this.insuranceProviderName = insuranceProvider.insuranceProviderName;
  this.insuranceProviderEmail = insuranceProvider.insuranceProviderEmail;
  this.insuranceProviderAadhar = insuranceProvider.insuranceProviderAadhar;
  this.insuranceProviderMobile = insuranceProvider.insuranceProviderMobile;
  this.insuranceProviderProfileImage = insuranceProvider.insuranceProviderProfileImage;
  this.insuranceProviderIdProofImage = insuranceProvider.insuranceProviderIdProofImage;
  this.insuranceProviderAddress = insuranceProvider.insuranceProviderAddress;
  this.insuranceProviderPassword = insuranceProvider.insuranceProviderPassword;
  this.registeredDate = insuranceProvider.registeredDate;
  this.updatedDate = insuranceProvider.updatedDate;
  this.passwordUpdateStatus = insuranceProvider.passwordUpdateStatus;
  this.isActive = insuranceProvider.isActive;
  this.isSuspended = insuranceProvider.isSuspended;
  this.updateStatus = insuranceProvider.updateStatus;
  this.isApproved = insuranceProvider.isApproved;
};
//
//
//
//
// REGISTER
InsuranceProvider.register = async (newInsuranceProvider) => {
  try {
    const checkEmailQuery =
      "SELECT * FROM Insurance_Providers WHERE insuranceProviderEmail = ? AND deleteStatus=0 AND isActive=1";
    const checkAadharQuery =
      "SELECT * FROM Insurance_Providers WHERE insuranceProviderAadhar = ? AND deleteStatus=0 AND isActive=1";

    const errors = {};

    const emailRes = await dbQuery(checkEmailQuery, [
      newInsuranceProvider.insuranceProviderEmail,
    ]);
    if (emailRes.length > 0) {
      errors["Email"] = ["Email already exists"];
    }

    const aadharRes = await dbQuery(checkAadharQuery, [
      newInsuranceProvider.insuranceProviderAadhar,
    ]);
    if (aadharRes.length > 0) {
      errors["Aadhar"] = ["Aadhar number already exists"];
    }

    if (Object.keys(errors).length > 0) {
      throw { name: "ValidationError", errors: errors };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(
      newInsuranceProvider.insuranceProviderPassword,
      10
    );
    newInsuranceProvider.insuranceProviderPassword = hashedPassword;

    const insertQuery = "INSERT INTO Insurance_Providers SET ?";
    const insertRes = await dbQuery(insertQuery, newInsuranceProvider);

    return { insuranceProviderId: insertRes.insertId, ...newInsuranceProvider };
  } catch (error) {
    console.error("Error during insuranceProvider registration in model:", error);
    throw error;
  }
};
//
//
//
//
//
//INSURANCE PROVIDER LOGIN
InsuranceProvider.login = async (email, password) => {
    const query = "SELECT * FROM Insurance_Providers WHERE insuranceProviderEmail = ? AND isActive = 1 AND deleteStatus = 0";

    try {
        const result = await dbQuery(query, [email]);

        if (result.length === 0) {
            throw new Error("Insurance provider not found");
        }

        const insuranceProvider = result[0];

        const isMatch = await promisify(bcrypt.compare)(
            password,
            insuranceProvider.insuranceProviderPassword
        );

        if (!isMatch) {
            throw new Error("Wrong password");
        }

        return insuranceProvider;
    } catch (error) {
        console.error("Error during insurance provider login:", error);
        throw error;
    }
};
//
//
//
//
//

  







module.exports = { Hospital, InsuranceProvider };
