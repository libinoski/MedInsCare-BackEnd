// insuranceProvider.model.js
const bcrypt = require("bcrypt");
const db = require("../db");
const { promisify } = require("util");
const dbQuery = promisify(db.query.bind(db));
//
//
//
//
//
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
//
//
//
//
// 
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
// VIEW ALL HOSPITALS
InsuranceProvider.viewAllHospitals = async () => {
  try {
    const viewAllHospitalsQuery = `
      SELECT *
      FROM Hospitals
      WHERE isActive = 1 AND deleteStatus = 0
    `;
    const allHospitals = await dbQuery(viewAllHospitalsQuery);

    if (allHospitals.length === 0) {
      throw new Error("No hospitals found");
    }

    return allHospitals;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
//
// INSURANCE PROVIDER REGISTER
// INSURANCE PROVIDER REGISTER
InsuranceProvider.register = async (newInsuranceProvider) => {
  try {
    const errors = {};

    // Check if hospitalId is present
    if (!newInsuranceProvider.hospitalId) {
      errors["hospital"] = ["Select a hospital to continue"];
    }

    const checkEmailQuery =
      "SELECT * FROM Insurance_Providers WHERE insuranceProviderEmail = ? AND deleteStatus=0 AND isActive=1";
    const checkAadharQuery =
      "SELECT * FROM Insurance_Providers WHERE insuranceProviderAadhar = ? AND deleteStatus=0 AND isActive=1";

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

    // Check if there are any validation errors
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
  const query = "SELECT * FROM Insurance_Providers WHERE insuranceProviderEmail = ? AND isActive = 1 AND deleteStatus = 0  AND isSuspended = 0";

  try {
    const result = await dbQuery(query, [email]);

    if (result.length === 0) {
      throw new Error("Insurance provider not found");
    }

    const insuranceProvider = result[0];

    if (insuranceProvider.isApproved !== 1) {
      throw new Error("Please wait for approval");
    }

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
// INSURANCE PROVIDER CHANGE PASSWORD
InsuranceProvider.changePassword = async (insuranceProviderId, oldPassword, newPassword) => {
  const checkProviderQuery =
    "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND deleteStatus = 0 AND isActive = 1 AND isSuspended = 0";

  try {
    const selectRes = await dbQuery(checkProviderQuery, [insuranceProviderId]);
    if (selectRes.length === 0) {
      throw new Error("Insurance provider not found");
    }

    const provider = selectRes[0];
    const isMatch = await promisify(bcrypt.compare)(
      oldPassword,
      provider.insuranceProviderPassword
    );

    if (!isMatch) {
      throw new Error("Incorrect old password");
    }

    const hashedNewPassword = await promisify(bcrypt.hash)(newPassword, 10);
    const updatePasswordQuery = `
            UPDATE Insurance_Providers
            SET
                updateStatus = 1,
                updatedDate = CURRENT_DATE(),
                deleteStatus = 0,
                isActive = 1,
                insuranceProviderPassword = ?,
                passwordUpdateStatus = 1
            WHERE insuranceProviderId = ? AND deleteStatus = 0 AND isActive = 1
        `;

    const updatePasswordValues = [hashedNewPassword, insuranceProviderId];

    await dbQuery(updatePasswordQuery, updatePasswordValues);

    console.log(
      "Insurance provider password updated successfully for insuranceProviderId:",
      insuranceProviderId
    );
    return { message: "Password updated successfully" };
  } catch (error) {
    throw error;
  }
};
//
//
//
//
//
//
// INSURANCE PROVIDER CHANGE ID PROOF IMAGE
InsuranceProvider.changeIdProofImage = async (insuranceProviderId, newIdProofImageFilename) => {
  const verifyQuery = `
        SELECT insuranceProviderId
        FROM Insurance_Providers
        WHERE insuranceProviderId = ? AND deleteStatus = 0 AND isSuspended = 0
    `;

  try {
    const verifyResult = await dbQuery(verifyQuery, [insuranceProviderId]);

    if (verifyResult.length === 0) {
      throw new Error("Insurance provider not found");
    }

    const updateQuery = `
            UPDATE Insurance_Providers
            SET 
                insuranceProviderIdProofImage = ?,
                updateStatus = 1, 
                updatedDate = CURRENT_TIMESTAMP()
            WHERE insuranceProviderId = ? AND deleteStatus = 0 AND isSuspended = 0
        `;

    await dbQuery(updateQuery, [newIdProofImageFilename, insuranceProviderId]);

    return true;
  } catch (error) {
    throw error;
  }
};

//
//
//
//
//
//
// INSURANCE PROVIDER CHANGE PROFILE IMAGE
InsuranceProvider.changeProfileImage = async (insuranceProviderId, newProfileImageFilename) => {
  const verifyQuery = `
        SELECT insuranceProviderId
        FROM Insurance_Providers
        WHERE insuranceProviderId = ? AND deleteStatus = 0 AND isSuspended = 0
    `;

  try {
    const verifyResult = await dbQuery(verifyQuery, [insuranceProviderId]);

    if (verifyResult.length === 0) {
      throw new Error("Insurance provider not found");
    }

    const updateQuery = `
            UPDATE Insurance_Providers
            SET 
                insuranceProviderProfileImage = ?,
                updateStatus = 1, 
                updatedDate = CURRENT_TIMESTAMP()
            WHERE insuranceProviderId = ? AND deleteStatus = 0 AND isSuspended = 0
        `;

    await dbQuery(updateQuery, [newProfileImageFilename, insuranceProviderId]);

    return true;
  } catch (error) {
    throw error;
  }
};
//
//
//
//
//
// INSURANCE PROVIDER VIEW PROFILE
InsuranceProvider.viewProfile = async (insuranceProviderId) => {
  const query =
    "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND isActive = 1 AND deleteStatus = 0 AND isApproved = 1 AND isSuspended = 0";
  try {
    const result = await dbQuery(query, [insuranceProviderId]);

    if (result.length === 0) {
      throw new Error("Insurance provider not found");
    }

    return result[0];
  } catch (error) {
    throw error;
  }
};
//
//
//
//
//
// INSURANCE PROVIDER UPDATE PROFILE
InsuranceProvider.updateProfile = async (updatedInsuranceProvider) => {
  const checkInsuranceProviderQuery =
    "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND isActive = 1 AND deleteStatus = 0 AND isApproved = 1 AND isSuspended = 0";

  try {
    const selectRes = await dbQuery(checkInsuranceProviderQuery, [
      updatedInsuranceProvider.insuranceProviderId,
    ]);

    if (selectRes.length === 0) {
      throw new Error("Insurance Provider not found");
    }

    // Check if insuranceProviderAadhar already exists for another provider member
    const checkAadharQuery =
      "SELECT * FROM Insurance_Providers WHERE insuranceProviderAadhar = ? AND insuranceProviderId != ? AND deleteStatus = 0 AND isSuspended = 0";
    const aadharRes = await dbQuery(checkAadharQuery, [
      updatedInsuranceProvider.insuranceProviderAadhar,
      updatedInsuranceProvider.insuranceProviderId,
    ]);

    if (aadharRes.length > 0) {
      throw new Error("Aadhar Number Already Exists.");
    }

    const updateQuery = `
            UPDATE Insurance_Providers
            SET
                updateStatus = 1,
                updatedDate = CURRENT_DATE(),
                insuranceProviderName = ?,
                insuranceProviderMobile = ?,
                insuranceProviderAddress = ?,
                insuranceProviderAadhar = ?
            WHERE insuranceProviderId = ? AND deleteStatus = 0 AND isSuspended = 0
        `;

    const updateValues = [
      updatedInsuranceProvider.insuranceProviderName,
      updatedInsuranceProvider.insuranceProviderMobile,
      updatedInsuranceProvider.insuranceProviderAddress,
      updatedInsuranceProvider.insuranceProviderAadhar,
      updatedInsuranceProvider.insuranceProviderId,
    ];

    await dbQuery(updateQuery, updateValues);

    console.log("Updated insurance provider details:", {
      id: updatedInsuranceProvider.insuranceProviderId,
      ...updatedInsuranceProvider,
    });
    return updatedInsuranceProvider; // Returning the updated data without additional status and message
  } catch (error) {
    throw error;
  }
};
//
//
//
//
//
// INSURANCE PROVIDER VIEW ALL NEWS
InsuranceProvider.viewAllNews = async (insuranceProviderId) => {
  try {
    // Fetch hospitalId associated with the insuranceProviderId
    const hospitalIdQuery = `
      SELECT hospitalId
      FROM Insurance_Providers
      WHERE insuranceProviderId = ? AND isActive = 1 AND deleteStatus = 0 AND isSuspended = 0
    `;
    const hospitalIdResult = await dbQuery(hospitalIdQuery, [insuranceProviderId]);

    if (hospitalIdResult.length === 0) {
      throw new Error("Insurance provider not found");
    }

    const hospitalId = hospitalIdResult[0].hospitalId;

    // Verify hospital existence and active status
    const verifyHospitalQuery = `
      SELECT hospitalId
      FROM Hospitals
      WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0
    `;
    const hospitalResult = await dbQuery(verifyHospitalQuery, [hospitalId]);

    if (hospitalResult.length === 0) {
      throw new Error("Hospital not found or inactive");
    }

    // Fetch all hospital news based on the retrieved hospitalId
    const viewAllNewsQuery = `
      SELECT *
      FROM Hospital_News
      WHERE hospitalId = ? AND deleteStatus = 0
    `;
    const allNews = await dbQuery(viewAllNewsQuery, [hospitalId]);

    return allNews;
  } catch (error) {
    console.error("Error viewing all hospital news:", error);
    throw error;
  }
};
//
//
//
//
//
// INSURANCE PROVIDER VIEW ONE NEWS
InsuranceProvider.viewOneNews = async (hospitalNewsId, insuranceProviderId) => {
  try {
    const hospitalIdQuery = "SELECT hospitalId FROM Insurance_Providers WHERE insuranceProviderId = ? AND isActive = 1 AND isSuspended = 0";
    const hospitalIdResult = await dbQuery(hospitalIdQuery, [insuranceProviderId]);

    if (hospitalIdResult.length === 0) {
      throw new Error("Insurance provider not found");
    }

    const hospitalId = hospitalIdResult[0].hospitalId;

    // Verify hospital existence and active status
    const verifyHospitalQuery = `
      SELECT hospitalId
      FROM Hospitals
      WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0
    `;
    const hospitalResult = await dbQuery(verifyHospitalQuery, [hospitalId]);

    if (hospitalResult.length === 0) {
      throw new Error("Hospital not found or inactive");
    }

    // Fetch the hospital news
    const query = `
      SELECT *
      FROM Hospital_News
      WHERE hospitalNewsId = ? AND hospitalId = ? AND deleteStatus = 0
    `;
    const result = await dbQuery(query, [hospitalNewsId, hospitalId]);

    if (result.length === 0) {
      throw new Error("Hospital news not found");
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching hospital news:", error);
    throw error;
  }
};
//
//
//
//
//
// INSURANCE PROVIDER SEND NOTIFICATION TO CLIENT
InsuranceProvider.sendNotificationToClient = async (insuranceProviderId, clientId, notificationMessage) => {
  try {
    const checkInsuranceProviderQuery = "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND isActive = 1 AND deleteStatus = 0 AND isApproved = 1 AND isSuspended = 0";
    const insuranceProviderCheckResult = await dbQuery(checkInsuranceProviderQuery, [insuranceProviderId]);
    if (insuranceProviderCheckResult.length === 0) {
      throw new Error("Insurance Provider not found");
    }

    const checkClientQuery = "SELECT clientId, patientId FROM Clients WHERE clientId = ? AND insuranceProviderId = ? AND isActive = 1 ";
    const checkClientResult = await dbQuery(checkClientQuery, [clientId, insuranceProviderId]);
    if (checkClientResult.length === 0) {
      throw new Error("Client not found or not active");
    }
    
    const clientData = checkClientResult[0];
    const patientId = clientData.patientId;

    const insertNotificationQuery = "INSERT INTO Notification_To_Clients (insuranceProviderId, clientId, patientId, message) VALUES (?, ?, ?, ?)";
    const result = await dbQuery(insertNotificationQuery, [insuranceProviderId, clientId, patientId, notificationMessage]);

    const notificationId = result.insertId;

    const notificationDetails = {
      notificationId: notificationId,
      insuranceProviderId: insuranceProviderId,
      clientId: clientId,
      patientId: patientId,
      message: notificationMessage,
    };

    return notificationDetails;
  } catch (error) {
    console.error("Error sending notification to clients:", error);
    throw error;
  }
};

//
//
//
//
//
// INSURANCE PROVIDER VIEW ALL CLIENTS
InsuranceProvider.viewAllClients = async (insuranceProviderId) => {
  const query = `
    SELECT *
    FROM Clients
    WHERE insuranceProviderId = ?
      AND isActive = 1
    ORDER BY clientId ASC;
  `;

  try {
    const clients = await dbQuery(query, [insuranceProviderId]);

    if (clients.length === 0) {
      throw new Error("No clients found for this insurance provider.");
    }

    return clients;
  } catch (error) {
    console.error("Error viewing all clients for insurance provider:", error);
    throw error;
  }
};

//
//
//
//
// INSURANCE PROVIDER VIEW ONE CLIENT
InsuranceProvider.viewOneClient = async (clientId, insuranceProviderId) => {
  const query = `
    SELECT *
    FROM Clients
    WHERE clientId = ?
      AND insuranceProviderId = ?
      AND isActive = 1
  `;

  try {
    const client = await dbQuery(query, [clientId, insuranceProviderId]);

    if (client.length === 0) {
      throw new Error("Client not found for this insurance provider.");
    }

    return client[0];
  } catch (error) {
    console.error("Error viewing one client for insurance provider:", error);
    throw error;
  }
};

//
//
//
//
//
// ADD INSURANCE PACKAGE
InsuranceProvider.addInsurancePackage = async (insuranceProviderId, packageData) => {
  try {
    // Fetch insurance provider details to verify existence and active status
    const providerQuery = `
      SELECT IP.insuranceProviderId, IP.hospitalId, IP.insuranceProviderName, IP.insuranceProviderEmail,
             IP.isActive, IP.isSuspended
      FROM Insurance_Providers IP
      WHERE IP.insuranceProviderId = ? AND IP.deleteStatus = 0
    `;
    const providerDetails = await dbQuery(providerQuery, [insuranceProviderId]);

    // Check if insurance provider exists and is active
    if (providerDetails.length === 0 || providerDetails[0].isSuspended || !providerDetails[0].isActive) {
      throw new Error("Insurance provider not found, not active, or suspended.");
    }

    // Prepare the insurance package data
    const { hospitalId } = providerDetails[0];
    const insurancePackage = {
      insuranceProviderId: insuranceProviderId,
      hospitalId: hospitalId,
      ...packageData, // Spread the rest of packageData which contains fields like packageTitle, packageDetails, etc.
    };

    // Insert insurance package into the database
    const insertQuery = "INSERT INTO Insurance_Packages SET ?";
    const insertRes = await dbQuery(insertQuery, insurancePackage);

    // Return the newly created package details along with its ID
    return { packageId: insertRes.insertId, ...insurancePackage };
  } catch (error) {
    throw error;
  }
};

















module.exports = { Hospital, InsuranceProvider };
