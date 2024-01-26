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


// Hospital View Profile
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


// Hospital update Profile
Hospital.updateProfile = (updatedHospital, result) => {
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1";

    db.query(checkHospitalQuery, [updatedHospital.hospitalId], (selectErr, selectRes) => {
        if (selectErr) {
            return result(selectErr, null);
        }

        if (selectRes.length === 0) {
            return result("Hospital not found", null);
        }

        const checkAadharQuery = "SELECT * FROM Hospitals WHERE hospitalAadhar = ? AND hospitalId != ? AND deleteStatus = 0 AND isActive = 1";

        db.query(checkAadharQuery, [updatedHospital.hospitalAadhar, updatedHospital.hospitalId], (aadharErr, aadharRes) => {
            if (aadharErr) {
                return result(aadharErr, null);
            }

            if (aadharRes.length > 0) {
                return result("Aadhar Number Already Exists.", null);
            }

            const updateQuery = `
                UPDATE Hospitals
                SET
                    updateStatus = 1,
                    updatedDate = CURRENT_DATE(),
                    deleteStatus = 0,
                    isActive = 1,
                    hospitalName = ?,
                    hospitalWebSite = ?,
                    hospitalAadhar = ?,
                    hospitalMobile = ?,
                    hospitalAddress = ?
                WHERE hospitalId = ? AND deleteStatus = 0 AND isActive = 1
            `;

            const updateValues = [
                updatedHospital.hospitalName,
                updatedHospital.hospitalWebSite,
                updatedHospital.hospitalAadhar,
                updatedHospital.hospitalMobile,
                updatedHospital.hospitalAddress,
                updatedHospital.hospitalId,
            ];

            db.query(updateQuery, updateValues, (updateErr, updateRes) => {
                if (updateErr) {
                    console.error("Error updating hospital details:", updateErr);
                    return result(updateErr, null);
                }

                const responseData = { ...updatedHospital };
                console.log("Updated hospital details:", { id: updatedHospital.hospitalId, ...updatedHospital });
                return result(null, responseData);
            });
        });
    });
};


// Add Hospital Staff:
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
                                                    // Modify the response to include hospitalStaffId
                                                    result(null, { hospitalStaffId: res.insertId, ...newHospitalStaff });
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


// Delete Hospital Staff
Hospital.deleteStaff = (hospitalStaffId, hospitalId, result) => {
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    db.query(checkHospitalQuery, [hospitalId], (checkHospitalErr, checkHospitalRes) => {
        if (checkHospitalErr) {
            result(checkHospitalErr, null);
            return;
        }

        if (checkHospitalRes.length === 0) {
            result("Hospital not found, is not active, or has been deleted", null);
            return;
        }

        const checkStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";

        db.query(checkStaffQuery, [hospitalStaffId, hospitalId], (checkStaffErr, checkStaffRes) => {
            if (checkStaffErr) {
                result(checkStaffErr, null);
                return;
            }

            if (checkStaffRes.length === 0) {
                result("Hospital Staff not found, is not active, or has been deleted", null);
                return;
            }

            const deleteQuery = "UPDATE Hospital_Staffs SET deleteStatus = 1, isActive = 0 WHERE hospitalStaffId = ? AND hospitalId = ?";
            db.query(deleteQuery, [hospitalStaffId, hospitalId], (deleteErr, deleteRes) => {
                if (deleteErr) {
                    result(deleteErr, null);
                    return;
                }

                result(null, "Hospital Staff deleted successfully");
            });
        });
    });
};


// Update Hospital Staff
Hospital.updateStaff = (updatedHospitalStaff, result) => {
    const checkHospitalQuery = "SELECT * FROM Hospitals WHERE hospitalId = ? AND isActive = 1 AND deleteStatus = 0";
    
    db.query(checkHospitalQuery, [updatedHospitalStaff.hospitalId], (checkHospitalErr, checkHospitalRes) => {
        if (checkHospitalErr) {
            return result(checkHospitalErr, null);
        }

        if (checkHospitalRes.length === 0) {
            return result("Hospital not found, is not active, or has been deleted", null);
        }

        const checkStaffQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ? AND isActive = 1 AND deleteStatus = 0";

        db.query(checkStaffQuery, [updatedHospitalStaff.hospitalStaffId, updatedHospitalStaff.hospitalId], (checkStaffErr, checkStaffRes) => {
            if (checkStaffErr) {
                return result(checkStaffErr, null);
            }

            if (checkStaffRes.length === 0) {
                return result("Hospital Staff not found, is not active, or has been deleted", null);
            }
            const checkAadharQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffAadhar = ? AND hospitalId = ? AND hospitalStaffId != ? AND deleteStatus = 0 AND isActive = 1";

            db.query(checkAadharQuery, [updatedHospitalStaff.hospitalStaffAadhar, updatedHospitalStaff.hospitalId, updatedHospitalStaff.hospitalStaffId], (aadharErr, aadharRes) => {
                if (aadharErr) {
                    return result(aadharErr, null);
                }

                if (aadharRes.length > 0) {
                    return result("Aadhar Number Already Exists.", null);
                }

                const updateQuery = `
                    UPDATE Hospital_Staffs 
                    SET 
                        hospitalStaffName = ?,
                        hospitalStaffMobile = ?,
                        hospitalStaffAddress = ?,
                        hospitalStaffAadhar = ?,
                        updateStatus = 1,
                        updatedDate = CURRENT_DATE(),
                        deleteStatus = 0,
                        isActive = 1
                    WHERE hospitalStaffId = ? AND hospitalId = ? AND deleteStatus = 0 AND isActive = 1
                `;

                const updateValues = [
                    updatedHospitalStaff.hospitalStaffName,
                    updatedHospitalStaff.hospitalStaffMobile,
                    updatedHospitalStaff.hospitalStaffAddress,
                    updatedHospitalStaff.hospitalStaffAadhar,
                    updatedHospitalStaff.hospitalStaffId,
                    updatedHospitalStaff.hospitalId
                ];

                db.query(updateQuery, updateValues, (updateErr, updateRes) => {
                    if (updateErr) {
                        return result(updateErr, null);
                    }
                    const fetchUpdatedDataQuery = "SELECT * FROM Hospital_Staffs WHERE hospitalStaffId = ? AND hospitalId = ?";
                    db.query(fetchUpdatedDataQuery, [updatedHospitalStaff.hospitalStaffId, updatedHospitalStaff.hospitalId], (fetchErr, fetchRes) => {
                        if (fetchErr) {
                            return result(fetchErr, null);
                        }
                        return result(null, { message: "Hospital Staff updated successfully", updatedData: fetchRes[0] });
                    });
                });
            });
        });
    });
};




module.exports = { Hospital, HospitalStaff };