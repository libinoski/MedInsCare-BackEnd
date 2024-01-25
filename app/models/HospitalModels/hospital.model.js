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

// Hospital register:
// Hospital register:
// Hospital register:
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



module.exports = Hospital;
