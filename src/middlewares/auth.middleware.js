const { ApiError } = require('../exceptions/api.error');
const { JwtService } = require('../services/jwt.service');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'] || '';

  if (!token) {
    throw ApiError.unauthorized();
  }

  const userData = JwtService.verify(token);

  if (!userData) {
    throw ApiError.unauthorized();
  }

  req.user = userData;

  next();
};

module.exports = {
  authMiddleware,
};
