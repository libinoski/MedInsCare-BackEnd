const express = require('express');
const router = express.Router();
const HospitalController = require('../../controllers/HospitalControllers/hospital.controller');

// -------------------
// Hospital Authentication and Profile Management
// -------------------

//DASHBOARD
router.post("/dashboard", HospitalController.dashboardDetails);

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

// -------------------
// Hospital Staff Management
// -------------------

// Hospital staff registration route
router.post("/hospitalStaffRegister", HospitalController.registerStaff);

// Hospital staff update route
router.post("/updateHospitalStaff", HospitalController.updateStaff);

// Hospital staff deletion route
router.post("/deleteHospitalStaff", HospitalController.deleteStaff);

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

// -------------------
// Hospital News Management
// -------------------

// Add hospital news route
router.post("/addHospitalNews", HospitalController.addNews);

// Update hospital news route
router.post("/updateHospitalNews", HospitalController.updateNews);

// Delete hospital news route
router.post("/deleteHospitalNews", HospitalController.deleteNews);

// View all hospital news route
router.post("/viewAllHospitalNews", HospitalController.viewAllNews);

// View one hospital news route
router.post("/viewOneHospitalNews", HospitalController.viewOneNews);

// -------------------
// Insurance Providers Management
// -------------------

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

// Hospital search insurance providers route
router.post("/searchInsuranceProviders", HospitalController.searchInsuranceProviders);

// Hospital suspend insurance provider route
router.post("/suspendInsuranceProvider", HospitalController.suspendInsuranceProvider);

// Hospital unsuspend insurance provider route
router.post("/unsuspendInsuranceProvider", HospitalController.unsuspendInsuranceProvider);

// Hospital view all suspended insurance providers route
router.post("/viewAllSuspendedInsuranceProviders", HospitalController.viewAllSuspendedInsuranceProviders);

// Hospital view one suspended insurance provider route
router.post("/viewOneSuspendedInsuranceProvider", HospitalController.viewOneSuspendedInsuranceProvider);

// Send notification to insurance provider route
router.post("/sendNotificationToInsuranceProvider", HospitalController.sendNotificationToInsuranceProvider);

// View review abou all insurance providers route
router.post("/viewAllReviews", HospitalController.viewAllReviews);

// -------------------
// Patient Management
// -------------------
// Route to update one patient
router.post("/hospitalUpdatePatient", HospitalController.updatePatient);

// Route to view all patients
router.post("/viewAllPatients", HospitalController.viewAllPatients);

// Route to view one patient
router.post("/viewOnePatient", HospitalController.viewOnePatient);

// Route to delete one patient
router.post("/deleteOnePatient", HospitalController.deleteOnePatient);


// Route to search patients
router.post("/searchPatients", HospitalController.searchPatients);

// Route to send notification to patient
router.post("/sendNotificationToPatient", HospitalController.sendNotificationToPatient);

// -------------------
// Discharge and Medical Records Management
// -------------------

// Route to view all discharge requests
router.post("/viewAllDischargeRequests", HospitalController.viewAllDischargeRequests);

// Route to view one discharge request with details
router.post("/viewOneDischargeRequestWithDetails", HospitalController.viewOneDischargeRequestWithDetails);

// Route to approve one discharge request
router.post("/approveOneDischargeRequest", HospitalController.approveOneDischargeRequest);

// Route to delete one discharge request
router.post("/deleteOneDischargeRequest", HospitalController.deleteOneDischargeRequest);

// Route to view all medical records
router.post("/viewAllMedicalRecords", HospitalController.viewAllMedicalRecords);

// Route to view one medical record
router.post("/viewOneMedicalRecord", HospitalController.viewOneMedicalRecord);

// Route to view all medical records of one patient
router.post("/viewAllMedicalRecordsOfOnePatient", HospitalController.viewAllMedicalRecordsOfOnePatient);

module.exports = router;
