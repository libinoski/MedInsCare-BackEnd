//patient.routes.js
const express = require('express');
const router = express.Router();
const PatientControler = require('../../controllers/PatientControllers/patient.controller');





router.post("/patientLogin", PatientControler.login);
router.post("/patientChangePassword", PatientControler.changePassword );
router.post("/changeIdProofImage", PatientControler.changeIdProofImage );
router.post("/changeProfileImage", PatientController.changeProfileImage);

// router.post("/changeProfileImage", PatientController.changeProfileImage);
// router.post("/viewProfile", PatientController.viewProfile);
// router.post("/viewHospitalProfile", PatientController.viewHospitalProfile);
// router.post("/updateProfile", PatientController.updateProfile);
// router.post("/viewAllNews", PatientController.viewAllNews);
// router.post("/viewOneNews", PatientController.viewOneNews);
// router.post("/viewAllInsuranceProviders", PatientController.viewAllInsuranceProviders);
// router.post("/viewOneInsuranceProvider", PatientController.viewOneInsuranceProvider); 
// router.post("/viewAllInsurancePackages", PatientController.viewAllInsurancePackages);
// router.post("/viewOneInsurancePackage", PatientController.viewOneInsurancePackage);
// router.post("/chooseInsurancePackage", PatientController.chooseInsurancePackage);

module.exports = router;