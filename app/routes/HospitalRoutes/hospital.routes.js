//hospital.routes.js
const express = require('express');
const router = express.Router();
const HospitalController = require('../../controllers/HospitalControllers/hospital.controller');





router.post("/hospitalRegistration", HospitalController.hospitalStaffRegister);
router.post("/hospitalLogin", HospitalController.hospitalLogin);
router.post("/hospitalChangePassword", HospitalController.hospitalChangePassword);
router.post("/hospitalChangeImage", HospitalController.hospitalChangeImage);
router.post("/hospitalViewProfile", HospitalController.hospitalViewProfile);
router.post("/hospitalUpdateProfile", HospitalController.hospitalUpdateProfile);
router.post("/hospitalStaffRegister", HospitalController.hospitalStaffRegister);
router.post("/deleteHospitalStaff", HospitalController.deleteHospitalStaff);
router.post("/updateHospitalStaff", HospitalController.updateHospitalStaff);
router.post("/suspendHospitalStaff", HospitalController.suspendHospitalStaff);
router.post("/unSuspendHospitalStaff", HospitalController.unSuspendHospitalStaff);
router.post("/viewAllHospitalStaffs", HospitalController.viewAllHospitalStaffs);
router.post("/viewOneHospitalStaff", HospitalController.viewOneHospitalStaff);
router.post("/searchHospitalStaff", HospitalController.searchHospitalStaff);
router.post("/addHospitalNews", HospitalController.addHospitalNews);
router.post("/deleteHospitalNews", HospitalController.deleteHospitalNews);
router.post("/updateHospitalNews", HospitalController.updateHospitalNews);
router.post("/viewAllHospitalNews", HospitalController.viewAllHospitalNews);
router.post("/viewOneHospitalNews", HospitalController.viewOneHospitalNews);








module.exports = router;
