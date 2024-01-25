//hospital.routes.js
const express = require('express');
const router = express.Router();
const HospitalController = require('../../controllers/HospitalControllers/hospital.controller');





//routes
router.post("/hospitalRegistration", HospitalController.hospitalRegister);
router.post("/hospitalLogin", HospitalController.hospitalLogin);
router.post("/hospitalViewProfile", HospitalController.getHospitalProfile);
router.post("/hospitalEditProfile", HospitalController.hospitalEditProfile);


module.exports = router;
