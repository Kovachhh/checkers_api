const validators = require('../../build/Release/validators');

const { RESPONSES } = require("../const/response.const");

const validateEmail = (value) => {
  if (!value) {
    return RESPONSES.EMAIL_REQUIRED;
  }

  const isEmail = validators.validateEmail(value);

  if (!isEmail) {
    return 'Email is not valid';
  }
};

const validatePassword = (value) => {
  if (!value) {
    return RESPONSES.PASSWORD_REQUIRED;
  }

  const isValid = validators.validatePassword(value);

  if (!isValid) {
    return 'Password should contain: min 6 characters, 1 upper and 1 lower letters, 1 number';
  }
};

const validateUsername = (username) => {
  if (!username) {
    return RESPONSES.USERNAME_REQUIRED;
  }

  const normalizedUsername = username.trim();

  const isValid = validators.validateUsername(normalizedUsername);


  if (!isValid) {
    return 'Username should contain from 2 to 20 characters';
  }
};

module.exports = {
  ValidatorHelper: {
    validateEmail,
    validatePassword,
    validateUsername,
  },
};
