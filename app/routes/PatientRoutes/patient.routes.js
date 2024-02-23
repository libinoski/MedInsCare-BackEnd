const express = require('express');
const router = express.Router();
const PatientControler = require('../../controllers/PatientControllers/patient.controller');

// Route for patient login
router.post("/patientLogin", PatientControler.login);

// Route for changing patient password
router.post("/patientChangePassword", PatientControler.changePassword);

// Route for changing patient's ID proof image
router.post("/patientchangeIdProofImage", PatientControler.changeIdProofImage);

// Route for changing patient's profile image
router.post("/patientchangeProfileImage", PatientControler.changeProfileImage);

// Route for viewing patient's profile
router.post("/patientViewProfile", PatientControler.viewProfile);

// Route for viewing patient's associated hospital profile
router.post("/patientViewHospitalProfile", PatientControler.viewHospitalProfile);

// Route for updating patient's profile
router.post("/patientUpdateProfile", PatientControler.updateProfile);

// Route for viewing all news available to the patient
router.post("/patientViewAllNews", PatientControler.viewAllNews);

// Route for viewing a specific piece of news
router.post("/patientViewOneNews", PatientControler.viewOneNews);

// Route for viewing all insurance providers available to the patient
router.post("/patientViewAllInsuranceProviders", PatientControler.viewAllInsuranceProviders);

// Route for viewing details of a specific insurance provider
router.post("/patientViewOneInsuranceProvider", PatientControler.viewOneInsuranceProvider);

// Route for viewing all insurance packages available to the patient
router.post("/patientViewAllInsurancePackages", PatientControler.viewAllInsurancePackages);

// Route for viewing details of a specific insurance package
router.post("/patientViewOneInsurancePackage", PatientControler.viewOneInsurancePackage);

// Route for choosing an insurance package
router.post("/patientChooseInsurancePackage", PatientControler.chooseOneInsurancePackage);

module.exports = router;
