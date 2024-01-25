//hospital.routes.js
const express = require('express');
const router = express.Router();
const HospitalController = require('../../controllers/HospitalControllers/hospital.controller');





//routes
router.post("/hospitalRegistration", HospitalController.hospitalRegister);
router.post("/hospitalLogin", HospitalController.hospitalLogin);
router.post("/viewHospitalProfile", HospitalController.getHospitalProfile);


module.exports = router;
