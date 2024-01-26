// hospital.model.js
const bcrypt = require('bcrypt');
const db = require('../db');


//Hospital Model 
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


//Hospital Staff Model
const HospitalStaff = function (hospitalStaff) {
    this.hospitalId = hospitalStaff.hospitalId;
    this.hospitalStaffName = hospitalStaff.hospitalStaffName;
    this.hospitalStaffProfileImage = hospitalStaff.hospitalStaffProfileImage;
    this.hospitalStaffIdProofImage = hospitalStaff.hospitalStaffIdProofImage;
    this.hospitalStaffMobile = hospitalStaff.hospitalStaffMobile;
    this.hospitalStaffEmail = hospitalStaff.hospitalStaffEmail;
    this.hospitalStaffAddress = hospitalStaff.hospitalStaffAddress;
    this.hospitalStaffAadhar = hospitalStaff.hospitalStaffAadhar;
    this.hospitalStaffPassword = hospitalStaff.hospitalStaffPassword;
    this.addedDate = hospitalStaff.addedDate;
    this.updatedDate = hospitalStaff.updatedDate;
    this.isActive = hospitalStaff.isActive;
    this.deleteStatus = hospitalStaff.deleteStatus;
    this.updateStatus = hospitalStaff.updateStatus;
    this.passwordUpdateStatus = hospitalStaff.passwordUpdateStatus;
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


// Hospital Login
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


// Hospital Edit Profile
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
                            let updateQuery = "UPDATE Hospitals SET updateStatus = 1, updatedDate = CURRENT_DATE(), deleteStatus = 0, isActive = 1";

                            // Check if hospitalName is provided and different from the existing value
                            if (updatedHospital.hospitalName !== null && updatedHospital.hospitalName !== selectRes[0].hospitalName) {
                                updateQuery += ", hospitalName = '" + updatedHospital.hospitalName + "'";
                            }

                            // Check if hospitalEmail is provided and different from the existing value
                            if (updatedHospital.hospitalEmail !== null && updatedHospital.hospitalEmail !== selectRes[0].hospitalEmail) {
                                updateQuery += ", hospitalEmail = '" + updatedHospital.hospitalEmail + "'";
                            }

                            // Check if hospitalWebSite is provided and different from the existing value
                            if (updatedHospital.hospitalWebSite !== null && updatedHospital.hospitalWebSite !== selectRes[0].hospitalWebSite) {
                                updateQuery += ", hospitalWebSite = '" + updatedHospital.hospitalWebSite + "'";
                            }

                            // Check if hospitalAadhar is provided and different from the existing value
                            if (updatedHospital.hospitalAadhar !== null && updatedHospital.hospitalAadhar !== selectRes[0].hospitalAadhar) {
                                updateQuery += ", hospitalAadhar = '" + updatedHospital.hospitalAadhar + "'";
                            }

                            // Check if hospitalMobile is provided and different from the existing value
                            if (updatedHospital.hospitalMobile !== null && updatedHospital.hospitalMobile !== selectRes[0].hospitalMobile) {
                                updateQuery += ", hospitalMobile = '" + updatedHospital.hospitalMobile + "'";
                            }

                            // Check if hospitalAddress is provided and different from the existing value
                            if (updatedHospital.hospitalAddress !== null && updatedHospital.hospitalAddress !== selectRes[0].hospitalAddress) {
                                updateQuery += ", hospitalAddress = '" + updatedHospital.hospitalAddress + "'";
                            }

                            // Check if hospitalImage is provided and different from the existing value
                            if (updatedHospital.hospitalImage !== null && updatedHospital.hospitalImage !== selectRes[0].hospitalImage) {
                                updateQuery += ", hospitalImage = '" + updatedHospital.hospitalImage + "'";
                            }

                            // Check if hospitalPassword is provided and different from the existing value
                            if (updatedHospital.hospitalPassword !== null && updatedHospital.hospitalPassword !== selectRes[0].hospitalPassword) {
                                updateQuery += ", hospitalPassword = '" + updatedHospital.hospitalPassword + "'";
                            }

                            updateQuery += " WHERE hospitalId = " + updatedHospital.hospitalId + " AND deleteStatus = 0 AND isActive = 1";

                            db.query(updateQuery, (updateErr, updateRes) => {
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


//Add Hospital Staff:
HospitalStaff.addNewOne = (newHospitalStaff, result) => {
    if (newHospitalStaff.hospitalStaffName !== "" && newHospitalStaff.hospitalStaffName !== null) {
        db.query("SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus=0 AND isActive=1", [newHospitalStaff.hospitalId], (err, hospitalResult) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            } else {
                if (hospitalResult.length === 0) {
                    result("Hospital ID does not exist", null);
                    return;
                }
                db.query("SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar=? AND deleteStatus=0 AND isActive=1", [newHospitalStaff.hospitalStaffAadhar], (err, res) => {
                    if (err) {
                        result(null, err);
                        return;
                    } else {
                        if (res.length > 0) {
                            result("Aadhar already exists", null);
                            return;
                        } else {
                            db.query("SELECT * FROM Hospital_Staffs WHERE hospitalStaffEmail=? AND deleteStatus=0 AND isActive=1", [newHospitalStaff.hospitalStaffEmail], (err, res) => {
                                if (err) {
                                    result(null, err);
                                    return;
                                } else {
                                    if (res.length > 0) {
                                        result("Email already exists", null);
                                        return;
                                    } else {
                                        bcrypt.hash(newHospitalStaff.hospitalStaffPassword, 10, (hashErr, hashedPassword) => {
                                            if (hashErr) {
                                                return result(hashErr, null);
                                            }

                                            newHospitalStaff.hospitalStaffPassword = hashedPassword;

                                            db.query("INSERT INTO Hospital_Staffs SET ?", [newHospitalStaff], (err, res) => {
                                                if (err) {
                                                    result(err, null);
                                                    return;
                                                } else {
                                                    result(null, { id: res.insertId, ...newHospitalStaff });
                                                }
                                            });
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    } else {
        result({ "status": "Cannot be empty." }, null);
    }
};



module.exports = { Hospital, HospitalStaff };