//hospital.routes.js
const express = require('express');
const router = express.Router();
const HospitalController = require('../../controllers/HospitalControllers/hospital.controller');





router.post("/hospitalRegistration", HospitalController.register);
router.post("/hospitalLogin", HospitalController.login);
router.post("/hospitalChangePassword", HospitalController.changePassword);
router.post("/hospitalChangeImage", HospitalController.changeImage);
router.post("/hospitalViewProfile", HospitalController.viewProfile);
router.post("/hospitalUpdateProfile", HospitalController.updateProfile);
router.post("/hospitalStaffRegister", HospitalController.registerStaff);
router.post("/deleteHospitalStaff", HospitalController.deleteStaff);
router.post("/updateHospitalStaff", HospitalController.updateStaff);
router.post("/suspendHospitalStaff", HospitalController.suspendStaff);
router.post("/unSuspendHospitalStaff", HospitalController.unsuspendStaff);
router.post("/viewAllHospitalStaffs", HospitalController.viewAllStaffs);
router.post("/viewOneHospitalStaff", HospitalController.viewOneStaff);
router.post("/searchHospitalStaff", HospitalController.searchStaffs);
router.post("/addHospitalNews", HospitalController.addNews);
router.post("/deleteHospitalNews", HospitalController.deleteNews);
router.post("/updateHospitalNews", HospitalController.updateNews);
router.post("/viewAllHospitalNews", HospitalController.viewAllNews);
router.post("/viewOneHospitalNews", HospitalController.viewOneNews);








module.exports = router;
