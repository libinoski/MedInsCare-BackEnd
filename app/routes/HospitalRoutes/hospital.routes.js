//hospital.routes.js
const express = require('express');
const router = express.Router();
const HospitalController = require('../../controllers/HospitalControllers/hospital.controller');





//routes
router.post("/hospitalRegistration", HospitalController.hospitalRegister);
router.post("/hospitalLogin", HospitalController.hospitalLogin);
router.post("/hospitalViewProfile", HospitalController.getHospitalProfile);
router.post("/hospitalUpdateProfile", HospitalController.hospitalUpdateProfile);
router.post("/addHospitalStaff", HospitalController.hospitalStaffRegister);
router.post("/deleteHospitalStaff", HospitalController.deleteHospitalStaff);
router.post("/updateHospitalStaff", HospitalController.updateHospitalStaff);
router.post("/viewAllHospitalStaffs", HospitalController.viewAllHospitalStaffs);




module.exports = router;
