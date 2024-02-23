const express = require('express');
const router = express.Router();
const PatientController = require('../../controllers/PatientControllers/patient.controller');

// Patient login route
router.post("/patientLogin", PatientController.login);

// Change patient password route
router.post("/patientChangePassword", PatientController.changePassword);

// Change patient's ID proof image route
router.post("/patientChangeIdProofImage", PatientController.changeIdProofImage);

// Change patient's profile image route
router.post("/patientChangeProfileImage", PatientController.changeProfileImage);

// View patient's profile route
router.post("/patientViewProfile", PatientController.viewProfile);

// View patient's associated hospital profile route
router.post("/patientViewHospitalProfile", PatientController.viewHospitalProfile);

// Update patient's profile route
router.post("/patientUpdateProfile", PatientController.updateProfile);

// View all news available to the patient route
router.post("/patientViewAllNews", PatientController.viewAllNews);

// View a specific piece of news route
router.post("/patientViewOneNews", PatientController.viewOneNews);

// View all insurance providers available to the patient route
router.post("/patientViewAllInsuranceProviders", PatientController.viewAllInsuranceProviders);

// View details of a specific insurance provider route
router.post("/patientViewOneInsuranceProvider", PatientController.viewOneInsuranceProvider);

// View all insurance packages available to the patient route
router.post("/patientViewAllInsurancePackages", PatientController.viewAllInsurancePackages);

// View details of a specific insurance package route
router.post("/patientViewOneInsurancePackage", PatientController.viewOneInsurancePackage);

// Choose an insurance package route
router.post("/patientChooseInsurancePackage", PatientController.chooseOneInsurancePackage);





module.exports = router;
