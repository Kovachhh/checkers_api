const { RESPONSES } = require('../const/response.const');
const { UsersService } = require('../services/users.service');
const { JwtService } = require('../services/jwt.service');
const { ValidatorHelper } = require('../helpers/validator');
const { ApiError } = require('../exceptions/api.error');
const { bcryptHelper } = require('../helpers/bcrypt');

const register = async (req, res) => {
  const { username, email, password } = req.body;

  const errors = {
    username: ValidatorHelper.validateName(username),
    email: ValidatorHelper.validateEmail(email),
    password: ValidatorHelper.validatePassword(password),
  };

  if (errors.email || errors.password || errors.name) {
    throw ApiError.badRequest('Bad request', errors);
  }

  const hashedPassword = await bcryptHelper.createHash(password);

  const newUser = await UsersService.create({email, password: hashedPassword, username});

  res.status(201);
  res.send(UsersService.normalize(newUser));
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw ApiError.badRequest(RESPONSES.EMAIL_REQUIRED);
  }

  if (!password) {
    throw ApiError.badRequest(RESPONSES.PASSWORD_REQUIRED);
  }

  const user = await UsersService.findOne({ email });

  if (!user) {
    throw ApiError.badRequest(RESPONSES.INCORRECT_EMAIL_PASSWORD);
  }

  const isPasswordValid = await bcryptHelper.compare(password, user.password);

  if (!isPasswordValid) {
    throw ApiError.badRequest(RESPONSES.INCORRECT_EMAIL_PASSWORD);
  }

  const normalizedUser = UsersService.normalize(user);

  const accessToken = JwtService.sign(normalizedUser);

  res.send({
    user: normalizedUser,
    accessToken,
  });
};

module.exports = {
  AuthController: {
    register,
    login,
  },
};
