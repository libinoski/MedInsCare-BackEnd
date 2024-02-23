const express = require('express');
const router = express.Router();
const HospitalController = require('../../controllers/HospitalControllers/hospital.controller');

// Hospital registration route
router.post("/hospitalRegistration", HospitalController.register);

// Hospital login route
router.post("/hospitalLogin", HospitalController.login);

// Hospital change password route
router.post("/hospitalChangePassword", HospitalController.changePassword);

// Hospital change image route
router.post("/hospitalChangeImage", HospitalController.changeImage);

// Hospital view profile route
router.post("/hospitalViewProfile", HospitalController.viewProfile);

// Hospital update profile route
router.post("/hospitalUpdateProfile", HospitalController.updateProfile);

// Hospital staff registration route
router.post("/hospitalStaffRegister", HospitalController.registerStaff);

// Hospital staff deletion route
router.post("/deleteHospitalStaff", HospitalController.deleteStaff);

// Hospital staff update route
router.post("/updateHospitalStaff", HospitalController.updateStaff);

// Hospital staff suspension route
router.post("/suspendHospitalStaff", HospitalController.suspendStaff);

// Hospital staff unsuspension route
router.post("/unSuspendHospitalStaff", HospitalController.unsuspendStaff);

// View all suspended hospital staff route
router.post("/viewAllSuspendedHospitalStaffs", HospitalController.viewAllSuspendedStaffs);

// View one suspended hospital staff route
router.post("/viewOneSuspendedHospitalStaff", HospitalController.viewOneSuspendedStaff);

// View all hospital staff route
router.post("/viewAllHospitalStaffs", HospitalController.viewAllStaffs);

// View one hospital staff route
router.post("/viewOneHospitalStaff", HospitalController.viewOneStaff);

// Search hospital staff route
router.post("/searchHospitalStaff", HospitalController.searchStaffs);

// Send notification to staff route
router.post("/sendNotificationToStaff", HospitalController.sendNotificationToStaff);

// Add hospital news route
router.post("/addHospitalNews", HospitalController.addNews);

// Delete hospital news route
router.post("/deleteHospitalNews", HospitalController.deleteNews);

// Update hospital news route
router.post("/updateHospitalNews", HospitalController.updateNews);

// View all hospital news route
router.post("/viewAllHospitalNews", HospitalController.viewAllNews);

// View one hospital news route
router.post("/viewOneHospitalNews", HospitalController.viewOneNews);

// View all unapproved insurance providers route
router.post("/viewAllUnapprovedInsuranceProviders", HospitalController.viewAllUnapprovedInsuranceProviders);

// View one unapproved insurance provider route
router.post("/viewOneUnapprovedInsuranceProvider", HospitalController.viewOneUnapprovedInsuranceProvider);

// Approve one insurance provider route
router.post("/approveOneInsuranceProvider", HospitalController.approveOneInsuranceProvider);

// Delete one insurance provider route
router.post("/deleteOneInsuranceProvider", HospitalController.deleteOneInsuranceProvider);

// View all insurance providers route
router.post("/viewAllInsuranceProviders", HospitalController.viewAllInsuranceProviders);

// View one insurance provider route
router.post("/viewOneInsuranceProvider", HospitalController.viewOneInsuranceProvider);








module.exports = router;
