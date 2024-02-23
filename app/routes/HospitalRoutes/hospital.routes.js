//hospital.routes.js
const express = require('express');
const router = express.Router();
const HospitalController = require('../../controllers/HospitalControllers/hospital.controller');

// Route for hospital registration
router.post("/hospitalRegistration", HospitalController.register);

// Route for hospital login
router.post("/hospitalLogin", HospitalController.login);

// Route for changing hospital password
router.post("/hospitalChangePassword", HospitalController.changePassword);

// Route for changing hospital image
router.post("/hospitalChangeImage", HospitalController.changeImage);

// Route for viewing hospital profile
router.post("/hospitalViewProfile", HospitalController.viewProfile);

// Route for updating hospital profile
router.post("/hospitalUpdateProfile", HospitalController.updateProfile);

// Route for registering hospital staff
router.post("/hospitalStaffRegister", HospitalController.registerStaff);

// Route for deleting hospital staff
router.post("/deleteHospitalStaff", HospitalController.deleteStaff);

// Route for updating hospital staff
router.post("/updateHospitalStaff", HospitalController.updateStaff);

// Route for suspending hospital staff
router.post("/suspendHospitalStaff", HospitalController.suspendStaff);

// Route for unsuspending hospital staff
router.post("/unSuspendHospitalStaff", HospitalController.unsuspendStaff);

// Route for viewing all suspended hospital staffs
router.post("/viewAllSuspendedHospitalStaffs", HospitalController.viewAllSuspendedStaffs);

// Route for viewing one suspended hospital staff
router.post("/viewOneSuspendedHospitalStaff", HospitalController.viewOneSuspendedStaff);

// Route for viewing all hospital staffs
router.post("/viewAllHospitalStaffs", HospitalController.viewAllStaffs);

// Route for viewing one hospital staff
router.post("/viewOneHospitalStaff", HospitalController.viewOneStaff);

// Route for searching hospital staff
router.post("/searchHospitalStaff", HospitalController.searchStaffs);

// Route for sending notification to staff
router.post("/sendnotificationToStaff", HospitalController.sendNotificationToStaff);

// Route for adding hospital news
router.post("/addHospitalNews", HospitalController.addNews);

// Route for deleting hospital news
router.post("/deleteHospitalNews", HospitalController.deleteNews);

// Route for updating hospital news
router.post("/updateHospitalNews", HospitalController.updateNews);

// Route for viewing all hospital news
router.post("/viewAllHospitalNews", HospitalController.viewAllNews);

// Route for viewing one hospital news
router.post("/viewOneHospitalNews", HospitalController.viewOneNews);

module.exports = router;
