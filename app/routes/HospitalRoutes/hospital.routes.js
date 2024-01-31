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
router.post("/suspendHospitalStaff", HospitalController.suspendHospitalStaff);
router.post("/unSuspendHospitalStaff", HospitalController.unSuspendHospitalStaff);
router.post("/viewAllHospitalStaffs", HospitalController.viewAllHospitalStaffs);
router.post("/viewOneHospitalStaff", HospitalController.viewOneHospitalStaff);
router.post("/searchHospitalStaff", HospitalController.searchHospitalStaff);
router.post("/addHospitalNews", HospitalController.addHospitalNews);
router.post("/deleteHospitalNews", HospitalController.deleteHospitalNews);
router.post("/hideHospitalNews", HospitalController.hideHospitalNews);
router.post("/unhideHospitalNews", HospitalController.unhideHospitalNews);
router.post("/updateHospitalNews", HospitalController.updateHospitalNews);




module.exports = router;
