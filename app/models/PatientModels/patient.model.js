// patient.model.js
const bcrypt = require("bcrypt");
const db = require("../db");
const { promisify } = require("util");
const dbQuery = promisify(db.query.bind(db));
//
//
//
//
//
// Patient Model
const Patient = function (patient) {
    this.patientId = patient.patientId;
    this.hospitalStaffId = patient.hospitalStaffId;
    this.hospitalId = patient.hospitalId;
    this.patientName = patient.patientName;
    this.patientEmail = patient.patientEmail;
    this.patientAadhar = patient.patientAadhar;
    this.patientMobile = patient.patientMobile;
    this.patientProfileImage = patient.patientProfileImage;
    this.patientIdProofImage = patient.patientIdProofImage;
    this.patientAddress = patient.patientAddress;
    this.patientGender = patient.patientGender;
    this.patientAge = patient.patientAge;
    this.patientPassword = patient.patientPassword;
    this.patientRegisteredDate = patient.patientRegisteredDate;
    this.updatedDate = patient.updatedDate;
    this.patientDischargedDate = patient.patientDischargedDate;
    this.passwordUpdateStatus = patient.passwordUpdateStatus;
    this.dischargeStatus = patient.dischargeStatus;
    this.updateStatus = patient.updateStatus;
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
//
//
const InsurancePackage = function (insurancePackage) {
    this.packageId = insurancePackage.packageId;
    this.insuranceProviderId = insurancePackage.insuranceProviderId;
    this.hospitalId = insurancePackage.hospitalId;
    this.packageTitle = insurancePackage.packageTitle;
    this.packageDetails = insurancePackage.packageDetails;
    this.packageImage = insurancePackage.packageImage;
    this.packageDuration = insurancePackage.packageDuration;
    this.packageAmount = insurancePackage.packageAmount;
    this.packageTAndC = insurancePackage.packageTAndC;
    this.addedDate = insurancePackage.addedDate;
    this.updatedDate = insurancePackage.updatedDate;
    this.updateStatus = insurancePackage.updateStatus;
    this.deleteStatus = insurancePackage.deleteStatus;
    this.isActive = insurancePackage.isActive;
};
//
//
//
//
// 
const HospitalStaff = function (hospitalStaff) {
    this.hospitalId = hospitalStaff.hospitalId;
    this.hospitalStaffName = hospitalStaff.hospitalStaffName;
    this.hospitalStaffProfileImage = hospitalStaff.hospitalStaffProfileImage;
    this.hospitalStaffIdProofImage = hospitalStaff.hospitalStaffIdProofImage;
    this.hospitalStaffMobile = hospitalStaff.hospitalStaffMobile;
    this.hospitalStaffEmail = hospitalStaff.hospitalStaffEmail;
    this.hospitalStaffAddress = hospitalStaff.hospitalStaffAddress;
    this.hospitalStaffAadhar = hospitalStaff.hospitalStaffAadhar;
    this.hospitalStaffPassword = hospitalStaff.hospitalStaffPassword;
    this.addedDate = hospitalStaff.addedDate;
    this.updatedDate = hospitalStaff.updatedDate;
    this.isActive = hospitalStaff.isActive;
    this.deleteStatus = hospitalStaff.deleteStatus;
    this.isSuspended = hospitalStaff.isSuspended;
    this.updateStatus = hospitalStaff.updateStatus;
    this.passwordUpdateStatus = hospitalStaff.passwordUpdateStatus;
};
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
const Client = function (client) {
    this.clientId = client.clientId;
    this.patientId = client.patientId;
    this.packageId = client.packageId;
    this.insuranceProviderId = client.insuranceProviderId;
    this.hospitalId = client.hospitalId;
    this.packageTitle = client.packageTitle;
    this.packageDetails = client.packageDetails;
    this.packageImage = client.packageImage;
    this.packageDuration = client.packageDuration;
    this.packageAmount = client.packageAmount;
    this.packageTAndC = client.packageTAndC;
};
//
//
//
//
const Review = function (review) {
    this.reviewId = review.reviewId;
    this.hospitalId = review.hospitalId;
    this.insuranceProviderId = review.insuranceProviderId;
    this.patientId = review.patientId;
    this.reviewContent = review.reviewContent;
    this.sendDate = review.sendDate;
    this.isActive = review.isActive;
    this.deleteStatus = review.deleteStatus;
};
//
//
//
//
// PATIENT LOGIN
Patient.login = async (email, password) => {
    const query = "SELECT * FROM Patients WHERE patientEmail = ? AND isActive = 1 AND deleteStatus = 0 ";

    try {
        const result = await dbQuery(query, [email]);

        if (result.length === 0) {
            throw new Error("Insurance provider not found");
        }

        const patient = result[0];


        const isMatch = await promisify(bcrypt.compare)(
            password,
            patient.patientPassword
        );

        if (!isMatch) {
            throw new Error("Wrong password");
        }

        return patient;
    } catch (error) {
        console.error("Error during patient login:", error);
        throw error;
    }
};
//
//
//
//
// PATIENT CHANGE PASSWORD
Patient.changePassword = async (patientId, oldPassword, newPassword) => {
    const checkPatientQuery =
        "SELECT * FROM Patients WHERE patientId = ? AND deleteStatus = 0 AND isActive = 1";

    try {
        const selectRes = await dbQuery(checkPatientQuery, [patientId]);
        if (selectRes.length === 0) {
            throw new Error("Patient not found");
        }

        const patient = selectRes[0];
        const isMatch = await promisify(bcrypt.compare)(
            oldPassword,
            patient.patientPassword
        );

        if (!isMatch) {
            throw new Error("Incorrect old password");
        }

        const hashedNewPassword = await promisify(bcrypt.hash)(newPassword, 10);
        const updatePasswordQuery = `
              UPDATE Patients
              SET
                  updateStatus = 1,
                  updatedDate = CURRENT_DATE(),
                  deleteStatus = 0,
                  isActive = 1,
                  patientPassword = ?,
                  passwordUpdateStatus = 1
              WHERE patientId = ? AND deleteStatus = 0 AND isActive = 1
          `;

        const updatePasswordValues = [hashedNewPassword, patientId];

        await dbQuery(updatePasswordQuery, updatePasswordValues);

        console.log(
            "Patient password updated successfully for patientId:",
            patientId
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
// PATIENT CHANGE ID PROOF IMAGE
Patient.changeIdProofImage = async (patientId, newIdProofImageFilename) => {
    const verifyQuery = `
          SELECT patientId
          FROM Patients
          WHERE patientId = ? AND isActive = 1
      `;

    try {
        const verifyResult = await dbQuery(verifyQuery, [patientId]);

        if (verifyResult.length === 0) {
            throw new Error("Patient not found");
        }

        const updateQuery = `
              UPDATE Patients
              SET 
                  patientIdProofImage = ?,
                  updateStatus = 1, 
                  updatedDate = CURRENT_TIMESTAMP()
              WHERE patientId = ? AND isActive = 1
          `;

        await dbQuery(updateQuery, [newIdProofImageFilename, patientId]);

        return true;
    } catch (error) {
        throw error;
    }
};
//
//
//
//
// PATIENT CHANGE PROFILE IMAGE
Patient.changeProfileImage = async (patientId, newProfileImageFilename) => {
    const verifyQuery = `
          SELECT patientId
          FROM Patients
          WHERE patientId = ? AND isActive = 1
      `;

    try {
        const verifyResult = await dbQuery(verifyQuery, [patientId]);

        if (verifyResult.length === 0) {
            throw new Error("Patient not found");
        }

        const updateQuery = `
              UPDATE Patients
              SET 
                  patientProfileImage = ?,
                  updateStatus = 1, 
                  updatedDate = CURRENT_TIMESTAMP()
              WHERE patientId = ? AND isActive = 1
          `;

        await dbQuery(updateQuery, [newProfileImageFilename, patientId]);

        return true;
    } catch (error) {
        throw error;
    }
};
//
//
//
//
// PATIENT VIEW PROFILE
Patient.viewProfile = async (patientId) => {
    const query =
        "SELECT * FROM Patients WHERE patientId = ? AND isActive = 1";
    try {
        const result = await dbQuery(query, [patientId]);

        if (result.length === 0) {
            throw new Error("Patient not found");
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
// PATIENT VIEW HOSPITAL PROFILE
Patient.viewHospitalProfile = async (patientId) => {
    try {
        // Fetch hospitalId associated with the patientId
        const hospitalIdQuery = `
        SELECT hospitalId
        FROM Patients
        WHERE patientId = ? AND isActive = 1 AND deleteStatus = 0 
      `;
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
        }

        const hospitalId = hospitalIdResult[0].hospitalId;

        // Query hospital profile using the fetched hospitalId
        const profileQuery = `
        SELECT *
        FROM Hospitals
        WHERE hospitalId = ? AND isActive = 1
      `;
        const profileResult = await dbQuery(profileQuery, [hospitalId]);

        if (profileResult.length === 0) {
            throw new Error("Hospital not found");
        }

        return profileResult[0];
    } catch (error) {
        throw error;
    }
};
//
//
//
//
// PATIENT UPDATE PROFILE
Patient.updateProfile = async (updatedPatient) => {
    const checkPatientQuery =
        "SELECT * FROM Patients WHERE patientId = ? AND isActive = 1";

    try {
        const selectRes = await dbQuery(checkPatientQuery, [
            updatedPatient.patientId,
        ]);

        if (selectRes.length === 0) {
            throw new Error("Patient not found");
        }

        // Check if patientAadhar already exists for another patient
        const checkAadharQuery =
            "SELECT * FROM Patients WHERE patientAadhar = ? AND patientId != ? AND isActive = 1";
        const aadharRes = await dbQuery(checkAadharQuery, [
            updatedPatient.patientAadhar,
            updatedPatient.patientId,
        ]);

        if (aadharRes.length > 0) {
            throw new Error("Aadhar Number Already Exists.");
        }

        const updateQuery = `
              UPDATE Patients
              SET
                  updateStatus = 1,
                  updatedDate = CURRENT_DATE(),
                  patientName = ?,
                  patientMobile = ?,
                  patientAddress = ?,
                  patientAadhar = ?
              WHERE patientId = ? AND isActive = 1
          `;

        const updateValues = [
            updatedPatient.patientName,
            updatedPatient.patientMobile,
            updatedPatient.patientAddress,
            updatedPatient.patientAadhar,
            updatedPatient.patientId,
        ];

        await dbQuery(updateQuery, updateValues);

        console.log("Updated patient details:", {
            id: updatedPatient.patientId,
            ...updatedPatient,
        });
        return updatedPatient; // Returning the updated data without additional status and message
    } catch (error) {
        throw error;
    }
};
//
//
//
//
// PATIENT VIEW ALL NEWS
Patient.viewAllNews = async (patientId) => {
    try {
        // Fetch hospitalId associated with the patientId
        const hospitalIdQuery = `
        SELECT hospitalId
        FROM Patients
        WHERE patientId = ? AND isActive = 1 AND deleteStatus = 0 
      `;
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
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
// PATIENT VIEW ONE NEWS
Patient.viewOneNews = async (hospitalNewsId, patientId) => {
    try {
        const hospitalIdQuery = "SELECT hospitalId FROM Patients WHERE patientId = ? AND isActive = 1 AND deleteStatus = 0";
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
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
// PATIENT VIEW ALL INSURANCE PROVIDERS
Patient.viewAllInsuranceProviders = async (patientId) => {
    try {
        const hospitalIdQuery = "SELECT hospitalId FROM Patients WHERE patientId = ? AND isActive = 1";
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
        }

        const hospitalId = hospitalIdResult[0].hospitalId;

        const viewAllInsuranceProvidersQuery =
            "SELECT * FROM Insurance_Providers WHERE hospitalId = ? AND isActive = 1 AND isSuspended = 0 AND isApproved = 1";
        const allInsuranceProviders = await dbQuery(viewAllInsuranceProvidersQuery, [hospitalId]);

        return allInsuranceProviders;
    } catch (error) {
        console.error("Error viewing all insurance providers:", error);
        throw error;
    }
};
//
//
//
//
//
// PATIENT VIEW ONE INSURANCE PROVIDER
Patient.viewOneInsuranceProvider = async (patientId, insuranceProviderId) => {
    try {
        const hospitalIdQuery = "SELECT hospitalId FROM Patients WHERE patientId = ? AND isActive = 1";
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
        }

        const hospitalId = hospitalIdResult[0].hospitalId;

        const viewInsuranceProviderQuery =
            "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND hospitalId = ? AND isActive = 1 AND isSuspended = 0 AND isApproved = 1";
        const insuranceProvider = await dbQuery(viewInsuranceProviderQuery, [insuranceProviderId, hospitalId]);

        if (insuranceProvider.length === 0) {
            throw new Error("Insurance provider not found for this patient");
        }

        return insuranceProvider[0];
    } catch (error) {
        console.error("Error viewing insurance provider:", error);
        throw error;
    }
};
//
//
//
//
//
// PATIENT VIEW ALL INSURANCE PACKAGES
Patient.viewAllInsurancePackages = async (patientId) => {
    try {
        // Fetch hospitalId associated with the patientId
        const hospitalIdQuery = "SELECT hospitalId FROM Patients WHERE patientId = ? AND isActive = 1";
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
        }

        const hospitalId = hospitalIdResult[0].hospitalId;

        // Fetch all insurance packages under the same hospitalId
        const viewAllInsurancePackagesQuery =
            "SELECT * FROM Insurance_Packages WHERE hospitalId = ? AND isActive = 1";
        const allInsurancePackages = await dbQuery(viewAllInsurancePackagesQuery, [hospitalId]);

        return allInsurancePackages;
    } catch (error) {
        console.error("Error viewing all insurance packages:", error);
        throw error;
    }
};
//
//
//
//
// PATIENT VIEW ALL INSURANCE PACKAGES OF ONE PROVIDER
Patient.viewAllInsurancePackagesOfOneProvider = async (patientId, insuranceProviderId) => {
    try {
        // Fetch hospitalId associated with the patientId to ensure context
        const hospitalIdQuery = "SELECT hospitalId FROM Patients WHERE patientId = ? AND isActive = 1";
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
        }

        const hospitalId = hospitalIdResult[0].hospitalId;

        // Ensure the insurance provider is associated with the same hospital and is approved
        const providerCheckQuery = `
            SELECT insuranceProviderId FROM Insurance_Providers 
            WHERE insuranceProviderId = ? 
            AND hospitalId = ? 
            AND isActive = 1 
            AND isApproved = 1`;
        const providerCheckResult = await dbQuery(providerCheckQuery, [insuranceProviderId, hospitalId]);

        if (providerCheckResult.length === 0) {
            throw new Error("Insurance provider not found or not approved in this hospital");
        }

        // Fetch all insurance packages offered by the insurance provider within the hospital context
        const viewAllPackagesQuery = `
            SELECT * FROM Insurance_Packages 
            WHERE insuranceProviderId = ? 
            AND hospitalId = ? 
            AND isActive = 1`;
        const allPackagesResult = await dbQuery(viewAllPackagesQuery, [insuranceProviderId, hospitalId]);

        if (allPackagesResult.length === 0) {
            throw new Error("No insurance packages found for this provider in the hospital");
        }

        return allPackagesResult;
    } catch (error) {
        console.error("Error viewing all insurance packages of provider:", error);
        throw error;
    }
};
//
//
//
//
// PATIENT VIEW ONE INSURANCE PACKAGE OF ONE PROVIDER
Patient.viewOneInsurancePackage = async (patientId, insurancePackageId) => {
    try {
        // Fetch hospitalId associated with the patientId
        const hospitalIdQuery = "SELECT hospitalId FROM Patients WHERE patientId = ? AND isActive = 1";
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
        }

        const hospitalId = hospitalIdResult[0].hospitalId;

        const viewInsurancePackageQuery =
            "SELECT * FROM Insurance_Packages WHERE hospitalId = ? AND insurancePackageId = ? AND isActive = 1";
        const insurancePackage = await dbQuery(viewInsurancePackageQuery, [hospitalId, insurancePackageId]);

        if (insurancePackage.length === 0) {
            throw new Error("Insurance package not found");
        }

        return insurancePackage[0]; // Return the found insurance package
    } catch (error) {
        console.error("Error viewing insurance package:", error);
        throw error;
    }
};
//
//
//
//
// PATIENT CHOOSE ONE INSURANCE PACKAGE
Patient.chooseOneInsurancePackage = async (patientId, packageId) => {
    try {
        // Fetch hospitalId associated with the patientId
        const hospitalIdQuery = `
            SELECT hospitalId
            FROM Patients
            WHERE patientId = ? AND isActive = 1 AND deleteStatus = 0 
        `;
        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);

        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found");
        }

        const hospitalId = hospitalIdResult[0].hospitalId;

        // Fetch insuranceProviderId associated with the packageId
        const insuranceProviderIdQuery = `
            SELECT insuranceProviderId
            FROM Insurance_Packages
            WHERE packageId = ? AND hospitalId = ? AND isActive = 1
        `;
        const insuranceProviderIdResult = await dbQuery(insuranceProviderIdQuery, [packageId, hospitalId]);

        if (insuranceProviderIdResult.length === 0) {
            throw new Error("Insurance package not found for this hospital");
        }

        const insuranceProviderId = insuranceProviderIdResult[0].insuranceProviderId;

        // Insert into Clients table
        const insertClientQuery = `
            INSERT INTO Clients (patientId, packageId, insuranceProviderId, hospitalId)
            VALUES (?, ?, ?, ?)
        `;
        const insertResult = await dbQuery(insertClientQuery, [patientId, packageId, insuranceProviderId, hospitalId]);

        // Retrieve the generated clientId
        const clientId = insertResult.insertId;

        // Return the clientId
        return { clientId, patientId, packageId, insuranceProviderId, hospitalId };
    } catch (error) {
        console.error("Error choosing insurance package:", error);
        throw error;
    }
};
//
//
//
//
// PATIENT SEARCH INSURANCE PROVIDERS
Patient.searchInsuranceProviders = async (patientId, searchQuery) => {
    try {
        // Fetch hospitalId associated with the patientId
        const hospitalIdQuery = `
        SELECT hospitalId
        FROM Patients 
        WHERE patientId = ? 
          AND isActive = 1 
          AND deleteStatus = 0
      `;

        const hospitalIdResult = await dbQuery(hospitalIdQuery, [patientId]);
        if (hospitalIdResult.length === 0) {
            throw new Error("Patient not found or not active");
        }

        const hospitalId = hospitalIdResult[0].hospitalId;

        // Now that we have the hospitalId, we can proceed with the search
        const query = `
        SELECT 
          insuranceProviderId, 
          hospitalId,
          insuranceProviderName, 
          insuranceProviderEmail, 
          insuranceProviderAadhar, 
          insuranceProviderMobile, 
          insuranceProviderAddress, 
          insuranceProviderProfileImage, 
          insuranceProviderIdProofImage
        FROM Insurance_Providers 
        WHERE hospitalId = ? 
          AND isApproved = 1 
          AND deleteStatus = 0 
          AND isSuspended = 0 
          AND isActive = 1
          AND (
            insuranceProviderId LIKE ? OR
            insuranceProviderName LIKE ? OR
            insuranceProviderAadhar LIKE ? OR
            insuranceProviderMobile LIKE ? OR
            insuranceProviderEmail LIKE ? OR
            insuranceProviderAddress LIKE ?
          )
      `;

        const searchParams = [
            hospitalId,
            `%${searchQuery}%`,
            `%${searchQuery}%`,
            `%${searchQuery}%`,
            `%${searchQuery}%`,
            `%${searchQuery}%`,
            `%${searchQuery}%`,
        ];

        const result = await dbQuery(query, searchParams);

        if (result.length === 0) {
            throw new Error("No insurance providers found matching the criteria");
        }

        return result;
    } catch (error) {
        console.error("Error searching insurance providers:", error);
        throw error;
    }
};
//
//
//
//
// PATIENT REVIEW ONE INSURANCE PROVIDER
Patient.reviewOneInsuranceProvider = async function (hospitalId, insuranceProviderId, patientId, reviewContent) {
    try {
        // Validate hospital
        const hospitalExistsQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
        const hospitalResult = await dbQuery(hospitalExistsQuery, [hospitalId]);
        if (hospitalResult.length === 0) throw new Error("Hospital not found");

        // Validate insurance provider
        const providerExistsQuery = "SELECT * FROM Insurance_Providers WHERE insuranceProviderId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
        const providerResult = await dbQuery(providerExistsQuery, [insuranceProviderId, hospitalId]);
        if (providerResult.length === 0) throw new Error("Insurance Provider not found or not active in this hospital");

        // Validate patient
        const patientExistsQuery = "SELECT * FROM Patients WHERE patientId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
        const patientResult = await dbQuery(patientExistsQuery, [patientId, hospitalId]);
        if (patientResult.length === 0) throw new Error("Patient not found or not active in this hospital");

        // Insert review
        const insertReviewQuery = "INSERT INTO Reviews (hospitalId, insuranceProviderId, patientId, reviewContent) VALUES (?, ?, ?, ?)";
        const insertResult = await dbQuery(insertReviewQuery, [hospitalId, insuranceProviderId, patientId, reviewContent]);
        const reviewId = insertResult.insertId;

        // Fetch sendDate for accuracy
        const fetchReviewQuery = "SELECT sendDate FROM Reviews WHERE reviewId = ?";
        const reviewResult = await dbQuery(fetchReviewQuery, [reviewId]);
        const sendDate = reviewResult[0].sendDate;

        // Return the relevant review details
        return {
            reviewId: reviewId,
            hospitalId: hospitalId,
            patientId: patientId,
            insuranceProviderId: insuranceProviderId,
            reviewContent: reviewContent,
            sendDate: sendDate,
        };
    } catch (error) {
        console.error("Error submitting review by patient:", error);
        throw error;
    }
};
//
//
//
//
//
















module.exports = { Hospital, InsuranceProvider, Patient, HospitalStaff, Client, InsurancePackage, Review };
