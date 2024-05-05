const { RESPONSES } = require('../const/response.const');
const { ApiError } = require('../exceptions/api.error');
const { UsersService } = require('../services/users.service');

const getUsers = async (req, res) => {
  const users = await UsersService.findAll();

  const normalizedUsers = users.map((user) => UsersService.normalize(user));

  res.status(200);
  res.send(normalizedUsers);
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  const user = await UsersService.findOne({_id: id});

  if (!user) {
    ApiError.notFound(RESPONSES.USER_NOT_FOUND);
  }

  res.status(200);
  res.send(UsersService.normalize(user));
};

module.exports = {
  UsersController: {
    getUsers,
    getUserById,
  },
};
