//hospitalStaff.routes.js
const express = require('express');
const router = express.Router();
const HospitalStaffController = require('../../controllers/HospitalStaffController/hospitalStaff.controller');



router.post("/hospitalStaffLogin", HospitalStaffController.login);
router.post("/hospitalStaffChangePassword", HospitalStaffController.changePassword);
router.post("/hospitalStaffViewProfile", HospitalStaffController.viewProfile);
router.post("/hospitalStaffUpdateProfile", HospitalStaffController.updateProfile);
router.post("/registerPatient", HospitalStaffController.registerPatient);
router.post("/hospitalStaffViewAllPatients", HospitalStaffController.viewAllPatients);
router.post("/hospitalStaffViewOnePatient", HospitalStaffController.viewOnePatient);
router.post("/hospitalStaffSearchPatient", HospitalStaffController.searchPatients);








module.exports = router;