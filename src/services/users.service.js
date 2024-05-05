const User = require('../models/User.model');

const findAll = async () => {
  return await User.find().lean();
};

const findOne = async (query) => {
  return await User.findOne(query).lean();
};

const create = async ({ email, username, password }) => {
  const user = new User({ email, username, password });
  await user.save();

  return user.toObject();
}

const normalize = ({ _id, email, username }) => {
  return {
    userId: _id,
    email,
    username,
  };
};

module.exports = {
  UsersService: {
    findAll,
    findOne,
    create,
    normalize,
  },
};
