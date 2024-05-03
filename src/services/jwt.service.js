const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../configs/env');

const sign = (user) => {
  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
  });

  return token;
};

const verify = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  JwtService: {
    sign,
    verify,
  },
};
