//hospitalStaff.routes.js
const express = require('express');
const router = express.Router();
const InsuranceProviderController = require('../../controllers/InsuranceProviderControllers/insuranceProvider.controller');



router.post("/insuranceProviderRegister", InsuranceProviderController.register);
router.post("/insuranceProviderLogin", InsuranceProviderController.login);










module.exports = router;