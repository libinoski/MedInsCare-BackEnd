//hospitalStaff.routes.js
const express = require('express');
const router = express.Router();
const HospitalStaffController = require('../../controllers/HospitalStaffController/hospitalStaff.controller');



router.post("/hospitalStaffLogin", HospitalStaffController.login);
router.post("/hospitalStaffChangePassword", HospitalStaffController.changePassword);
router.post("/hospitalStaffChangeIdProofImage", HospitalStaffController.changeIdProofImage);
router.post("/hospitalStaffChangeProfileImage", HospitalStaffController.changeProfileImage);
router.post("/hospitalStaffViewProfile", HospitalStaffController.viewProfile);
router.post("/hospitalStaffUpdateProfile", HospitalStaffController.updateProfile);
router.post("/hospitalStaffViewAllHospitalNews", HospitalStaffController.viewAllNews);
router.post("/hospitalStaffViewOneHospitalNews", HospitalStaffController.viewOneNews);
router.post("/registerPatient", HospitalStaffController.registerPatient);
router.post("/hospitalStaffViewAllPatients", HospitalStaffController.viewAllPatients);
router.post("/hospitalStaffViewOnePatient", HospitalStaffController.viewOnePatient);
router.post("/hospitalStaffSearchPatient", HospitalStaffController.searchPatients);
router.post("/hospitalStaffAddMedicalRecord", HospitalStaffController.addMedicalRecord);








module.exports = router;