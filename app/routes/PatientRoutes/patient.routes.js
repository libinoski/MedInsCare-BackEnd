//patient.routes.js
const express = require('express');
const router = express.Router();
const PatientControler = require('../../controllers/PatientControllers/patient.controller');





router.post("/patientLogin", PatientControler.login);


module.exports = router;