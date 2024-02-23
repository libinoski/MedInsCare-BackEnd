// hospitalStaff.routes.js
const express = require('express');
const router = express.Router();
const HospitalStaffController = require('../../controllers/HospitalStaffController/hospitalStaff.controller');

// Login route for hospital staff
router.post("/hospitalStaffLogin", HospitalStaffController.login);

// Change password route for hospital staff
router.post("/hospitalStaffChangePassword", HospitalStaffController.changePassword);

// Change ID proof image route for hospital staff
router.post("/hospitalStaffChangeIdProofImage", HospitalStaffController.changeIdProofImage);

// Change profile image route for hospital staff
router.post("/hospitalStaffChangeProfileImage", HospitalStaffController.changeProfileImage);

// View profile route for hospital staff
router.post("/hospitalStaffViewProfile", HospitalStaffController.viewProfile);

// Update profile route for hospital staff
router.post("/hospitalStaffUpdateProfile", HospitalStaffController.updateProfile);

// View all hospital news route for hospital staff
router.post("/hospitalStaffViewAllHospitalNews", HospitalStaffController.viewAllNews);

// View one hospital news item route for hospital staff
router.post("/hospitalStaffViewOneHospitalNews", HospitalStaffController.viewOneNews);

// Register patient route
router.post("/registerPatient", HospitalStaffController.registerPatient);

// View all patients route for hospital staff
router.post("/hospitalStaffViewAllPatients", HospitalStaffController.viewAllPatients);

// View one patient route for hospital staff
router.post("/hospitalStaffViewOnePatient", HospitalStaffController.viewOnePatient);

// Search patients route for hospital staff
router.post("/hospitalStaffSearchPatient", HospitalStaffController.searchPatients);

// Add medical record route for hospital staff
router.post("/hospitalStaffAddMedicalRecord", HospitalStaffController.addMedicalRecord);

module.exports = router;
