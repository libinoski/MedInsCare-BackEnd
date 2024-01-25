// hospital.model.js
const bcrypt = require('bcrypt');
const db = require('../db');



const Hospital = function (hospital) {
    this.hospitalId = hospital.hospitalId;
    this.hospitalName = hospital.hospitalName;
    this.hospitalEmail = hospital.hospitalEmail;
    this.hospitalWebSite = hospital.hospitalWebSite;
    this.hospitalAadhar = hospital.hospitalAadhar;
    this.hospitalMobile = hospital.hospitalMobile;
    this.hospitalAddress = hospital.hospitalAddress;
    this.hospitalImage = hospital.hospitalImage;
    this.hospitalPassword = hospital.hospitalPassword;
    this.registeredDate = hospital.registeredDate;
    this.isActive = hospital.isActive;
    this.deleteStatus = hospital.deleteStatus;
    this.updateStatus = hospital.updateStatus;
    this.passwordUpdatedStatus = hospital.passwordUpdatedStatus;
    this.updatedDate = hospital.updatedDate;
};



// Hospital Registration
Hospital.register = (newHospital, result) => {
    const checkEmailQuery = "SELECT * FROM Hospitals WHERE hospitalEmail = ? AND deleteStatus=0 AND isActive=1";
    const checkAadharQuery = "SELECT * FROM Hospitals WHERE hospitalAadhar = ? AND deleteStatus=0 AND isActive=1";

    db.query(checkEmailQuery, [newHospital.hospitalEmail], (emailErr, emailRes) => {
        if (emailErr) {
            return result(emailErr, null);
        }

        if (emailRes.length > 0) {
            return result("Hospital email already exists", null);
        }

        db.query(checkAadharQuery, [newHospital.hospitalAadhar], (aadharErr, aadharRes) => {
            if (aadharErr) {
                return result(aadharErr, null);
            }

            if (aadharRes.length > 0) {
                return result("Aadhar number already exists", null);
            }

            bcrypt.hash(newHospital.hospitalPassword, 10, (hashErr, hashedPassword) => {
                if (hashErr) {
                    return result(hashErr, null);
                }

                newHospital.hospitalPassword = hashedPassword;

                const insertQuery = "INSERT INTO Hospitals SET ?";
                db.query(insertQuery, newHospital, (insertErr, insertRes) => {
                    if (insertErr) {
                        return result(insertErr, null);
                    }

                    return result(null, { id: insertRes.insertId, ...newHospital });
                });
            });
        });
    });
};



// Hospital login
Hospital.login = (email, password, result) => {
    const query = "SELECT * FROM Hospitals WHERE BINARY hospitalEmail = ?";
    db.query(query, [email], (err, res) => {
        if (err) {
            return result(err, null);
        }

        if (res.length === 0) {
            return result("Hospital not found", null);
        }

        const hospital = res[0];

        // Check if the hospital is active and not deleted
        if (hospital.isActive !== 1 || hospital.deleteStatus !== 0) {
            return result("Hospital is not active or has been deleted", null);
        }

        bcrypt.compare(password, hospital.hospitalPassword, (compareErr, isMatch) => {
            if (compareErr) {
                return result(compareErr, null);
            }

            if (!isMatch) {
                return result("Invalid password", null);
            }

            return result(null, hospital);
        });
    });
};


  //Hospital View Profile
  Hospital.getProfile = (hospitalId, result) => {
    const query = "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";
    db.query(query, [hospitalId], (err, res) => {
        if (err) {
            return result(err, null);
        }

        if (res.length === 0) {
            return result("Hospital not found", null);
        }

        return result(null, res[0]);
    });
};



// Hospital edit profile
Hospital.editProfile = (updatedHospital, result) => {
    db.query("SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1", [updatedHospital.hospitalId], (selectErr, selectRes) => {
        if (selectErr) {
            console.log("Error Checking Hospital: ", selectErr);
            result(selectErr, null);
            return;
        } else {
            if (selectRes.length === 0) {
                console.log("Hospital Not Found");
                result("Hospital Not Found", null);
                return;
            } else {
                db.query("SELECT * FROM Hospitals WHERE hospitalAadhar = ? AND hospitalId != ? AND deleteStatus = 0 AND isActive = 1", [updatedHospital.hospitalAadhar, updatedHospital.hospitalId], (aadharErr, aadharRes) => {
                    if (aadharErr) {
                        console.log("Error Checking Aadhar: ", aadharErr);
                        result(aadharErr, null);
                        return;
                    } else {
                        if (aadharRes.length > 0) {
                            console.log("Aadhar Number Already Exists.");
                            result("Aadhar Number Already Exists.", null);
                            return;
                        } else {
                            db.query("UPDATE Hospitals SET hospitalName = ?, hospitalAadhar = ?, hospitalMobile = ?, hospitalAddress = ?, hospitalWebSite = ?, hospitalImage = ?, updateStatus = 1, updatedDate = CURRENT_DATE() WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1",
                                [updatedHospital.hospitalName, updatedHospital.hospitalAadhar, updatedHospital.hospitalMobile, updatedHospital.hospitalAddress, updatedHospital.hospitalWebSite, updatedHospital.hospitalImage, updatedHospital.hospitalId],
                                (updateErr, updateRes) => {
                                    if (updateErr) {
                                        console.log("Error Updating Hospital Details: ", updateErr);
                                        result(updateErr, null);
                                        return;
                                    }
                                    console.log("Updated Hospitals Details: ", { id: updatedHospital.hospitalId, ...updatedHospital });
                                    result(null, { id: updatedHospital.hospitalId, ...updatedHospital });
                                });
                        }
                    }
                });
            }
        }
    });
};





module.exports = Hospital;
