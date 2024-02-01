//hospitalStaff.routes.js
const express = require('express');
const router = express.Router();
const HospitalStaffController = require('../../controllers/HospitalStaffController/hospitalStaff.controller');


router.post("/hospitalStaffLogin", HospitalStaffController.hospitalStaffLogin);
router.post("/hospitalStaffChangePassword", HospitalStaffController.hospitalStaffChangePassword);
router.post("/hospitalStaffViewProfile", HospitalStaffController.hospitalStaffViewProfile);
router.post("/hospitalStaffUpdateProfile", HospitalStaffController.hospitalStaffUpdateProfile);



module.exports = router;