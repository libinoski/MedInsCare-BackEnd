const express = require('express');
const router = express.Router();
const InsuranceProviderController = require('../../controllers/InsuranceProviderControllers/insuranceProvider.controller');

// Insurance provider registration route
router.post("/insuranceProviderRegister", InsuranceProviderController.register);

// Insurance provider login route
router.post("/insuranceProviderLogin", InsuranceProviderController.login);

// Insurance provider change password route
router.post("/insuranceProviderChangePassword", InsuranceProviderController.changePassword);

// Insurance provider change ID proof image route
router.post("/insuranceProviderChangeIdProofImage", InsuranceProviderController.changeIdProofImage);

// Insurance provider change profile image route
router.post("/insuranceProviderChangeProfileImage", InsuranceProviderController.changeProfileImage);

// Insurance provider view profile route
router.post("/insuranceProviderViewProfile", InsuranceProviderController.viewProfile);

// Insurance provider update profile route
router.post("/insuranceProviderUpdateProfile", InsuranceProviderController.updateProfile);

// Insurance provider view all news route
router.post("/insuranceProviderViewAllNews", InsuranceProviderController.viewAllNews);

// Insurance provider view one news item route
router.post("/insuranceProviderViewOneNews", InsuranceProviderController.viewOneNews);

// Insurance provider send notification to client route
router.post("/sendNotificationToClient", InsuranceProviderController.sendNotificationToClient);






module.exports = router;
