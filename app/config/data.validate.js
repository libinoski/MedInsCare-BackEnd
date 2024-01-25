// data.validate.js

const path = require('path');

function isNullOrUndefined(value) {
    return value === null || value === undefined;
}

const ID_REGEX = /^[0-9]+$/;
const INVALID_ID_MESSAGE = `Must be a valid numeric ID.`;

function isEmpty(value, fieldName) {
    if (!value || value.trim() === "") {
        return {
            isValid: false,
            message: `Field cannot be empty`
        };
    }
    return {
        isValid: true,
    };
}

function isValidId(id, idName) {
    if (isNullOrUndefined(id)) {
        return {
            isValid: false,
            message: `ID can't be empty`
        };
    }

    if (!ID_REGEX.test(id)) {
        return {
            isValid: false,
            message: INVALID_ID_MESSAGE
        };
    }

    return {
        isValid: true,
        fieldName: idName,
        message: `ID is valid.`
    };
}

function isValidPhoneNumber(phoneNumber) {
    if (isNullOrUndefined(phoneNumber)) {
        return {
            isValid: true,
        };
    }

    return {
        isValid: /^\d{4,5}\s?\d{6,7}$/.test(phoneNumber),
        message: "Phone number is invalid"
    };
}

function isValidImageWith1MBConstraint(file) {
    if (!file) {
        return {
            isValid: false,
            message: 'File is required'
        };
    }

    const allowedExtensions = /\.(jpg|jpeg|png|webp|heif)$/;
    const extensionIsValid = allowedExtensions.test(path.extname(file.filename.replace(/[^\w\-.]/g, '')).toLowerCase());
    const maxFileSize = 1 * 1024 * 1024; // Updated size constraint to 1 MB
    const sizeIsValid = file.size <= maxFileSize;

    if (!extensionIsValid && !sizeIsValid) {
        return {
            isValid: false,
            message: 'Invalid file format and size exceeds the limit of 1 MB.'
        };
    } else if (!extensionIsValid) {
        return {
            isValid: false,
            message: 'Invalid file format. Only JPG, JPEG, PNG, WEBP, and HEIF files are allowed.'
        };
    } else if (!sizeIsValid) {
        return {
            isValid: false,
            message: 'File size exceeds the limit of 1 MB.'
        };
    }

    return {
        isValid: true,
        message: 'File is valid'
    };
}

function isValidMobileNumber(mobileNumber) {
    return {
        isValid: /^\+91[6-9]\d{9}$|^\+91\s?[6-9]\d{9}$|^[6-9]\d{9}$/.test(mobileNumber),
        message: "Invalid Mobile Number"
    };
}

function isValidAmount(amount) {
    return {
        isValid: amount > 0,
        message: "Value must be greater than zero"
    };
}

function isValidAddress(address) {
    if (!address || address.trim() === "") {
        return {
            isValid: false,
            message: "Address cannot be empty"
        };
    }

    return {
        isValid: address.trim().length <= 100,
        message: "Address should not exceed 100 characters"
    };
}

function isValidWebsite(website) {
    if (isNullOrUndefined(website)) {
        return {
            isValid: false,
            message: "Website is empty or null."
        };
    }

    const regex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.([a-zA-Z]{2,})$/;

    return {
        isValid: regex.test(website),
        message: "Website must be in a valid format (e.g., http://www.example.com)"
    };
}


function isValidEmail(email) {
    return {
        isValid: /^[a-z0-9._!#$%&'*+/=?^_`{|}~-]+@[a-z]+(\.[a-z]+)+$/.test(email),
        message: "Email cannot be empty or Invalid Email! "
    };
}




function isValidPassword(password) {
    if (!password) {
        return {
            isValid: false,
            message: ["Password can't be empty."]
        };
    }

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[\W_]/.test(password);
    const isLengthValid = /^[a-zA-Z\d\W_]{8,12}$/.test(password);

    const messages = [];

    if (!hasLowerCase) {
        messages.push("Password must contain at least one lowercase letter.");
    }

    if (!hasUpperCase) {
        messages.push("Password must contain at least one uppercase letter.");
    }

    if (!hasDigit) {
        messages.push("Password must contain at least one digit.");
    }

    if (!hasSpecialChar) {
        messages.push("Password must contain at least one special character.");
    }

    if (!isLengthValid) {
        messages.push("Password must be between 8 and 12 characters long.");
    }

    return {
        isValid: messages.length === 0,
        message: messages
    };
}








function isValidName(name) {
    return {
        isValid: /^[a-zA-Z\s]*$/.test(name),
        message: "Name must contain only alphabets"
    };
}

function isValidDate(date) {
    return {
        isValid: /^([0-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/.test(date),
        message: "Date must be in the format DD/MM/YYYY"
    };
}

function isDateGreaterThanToday(date) {
    const inputDate = new Date(date.split('/').reverse().join('-'));
    const currentDate = new Date();

    return {
        isValid: inputDate > currentDate,
        message: "Select a date greater than today."
    };
}

function isValidTime(time) {
    return {
        isValid: /^\d{2}:\d{2}:\d{2}$/.test(time),
        message: "Time must be in the format HH:MM:SS"
    };
}

function isValidAadharNumber(aadharNumber) {
    return {
        isValid: /^\d{12}$/.test(aadharNumber),
        message: "Aadhar Number cannot be empty and must be of 12 digits"
    };
}

function isValidFile(file) {
    const allowedExtensions = /\.(pdf|docx)$/;
    const extensionIsValid = allowedExtensions.test(path.extname(file.filename.replace(/[^\w\-.]/g, '')).toLowerCase());
    const maxFileSize = 2 * 1024 * 1024;
    const sizeIsValid = file.size <= maxFileSize;

    if (!extensionIsValid && !sizeIsValid) {
        return {
            isValid: false,
            message: 'Invalid file format and size exceeds the limit of 2 MB.'
        };
    } else if (!extensionIsValid) {
        return {
            isValid: false,
            message: 'Invalid file format. Only PDF and DOCX files are allowed.'
        };
    } else if (!sizeIsValid) {
        return {
            isValid: false,
            message: 'File size exceeds the limit of 2 MB.'
        };
    }

    return {
        isValid: true,
        message: 'File is valid'
    };
}

function isDate1GreaterThanDate2(date1, date2) {
    const [day1, month1, year1] = date1.split('/').map(Number);
    const inputDate1 = new Date(year1, month1 - 1, day1);

    const [day2, month2, year2] = date2.split('/').map(Number);
    const inputDate2 = new Date(year2, month2 - 1, day2);

    const oneYearLater = new Date(inputDate1);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    return {
        isValid: inputDate2 >= oneYearLater,
        message: "Select a date greater than or equal to one year after the previous date."
    };
}

function isValidAadharNumberUpdate(aadharNumber) {
    if (isNullOrUndefined(aadharNumber)) {
        return {
            isValid: true,
        };
    }
    return {
        isValid: /^\d{12}$/.test(aadharNumber),
        message: "Aadhar Number must be 12 digits"
    };
}

function acceptOnlyCapitalLetters(value) {
    return {
        isValid: /^[A-Z]*$/.test(value),
        message: "Invalid Code. It must contain only CAPITAL letters."
    };
}

module.exports = {
    isEmpty,
    isValidId,
    isValidPhoneNumber,
    isValidMobileNumber,
    isValidAddress,
    isValidWebsite,
    isValidEmail,
    isValidPassword,
    isValidName,
    isValidDate,
    isValidTime,
    isValidImageWith1MBConstraint,
    isValidAadharNumber,
    isValidAmount,
    isDateGreaterThanToday,
    isValidFile,
    isDate1GreaterThanDate2,
    isValidAadharNumberUpdate,
    acceptOnlyCapitalLetters
};
