const express = require('express');
const router = express.Router();
const InsuranceProviderController = require('../../controllers/InsuranceProviderControllers/insuranceProvider.controller');

// Route for insurance provider registration
router.post("/insuranceProviderRegister", InsuranceProviderController.register);

// Route for insurance provider login
router.post("/insuranceProviderLogin", InsuranceProviderController.login);

// Route for insurance provider to change their password
router.post("/insuranceProviderChangePassword", InsuranceProviderController.changePassword);

// Route for insurance provider to update their ID proof image
router.post("/insuranceProviderChangeIdProofImage", InsuranceProviderController.changeIdProofImage);

// Route for insurance provider to update their profile image
router.post("/insuranceProviderChangeProfileImage", InsuranceProviderController.changeProfileImage);

// Route for insurance provider to view their profile
router.post("/insuranceProviderViewProfile", InsuranceProviderController.viewProfile);

// Route for insurance provider to update their profile
router.post("/insuranceProviderUpdateProfile", InsuranceProviderController.updateProfile);

// Route for insurance provider to view all news
router.post("/insuranceProviderViewAllNews", InsuranceProviderController.viewAllNews);

// Route for insurance provider to view a specific news item
router.post("/insuranceProviderViewOneNews", InsuranceProviderController.viewOneNews);

// Route for insurance provider to send notifications to clients
router.post("/sendNotificationToClient", InsuranceProviderController.sendNotificationToClient);

module.exports = router;
