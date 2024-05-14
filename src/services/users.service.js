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

const getBestUsers = async () => {
  return await User
      .aggregate()
      .project({
          "_id": "$_id",
          "username": "$username",
          "createdAt": "$createdAt",
          "victories": "$victories",
          "losses": "$losses",
      })
      .limit(10);
}

const normalize = ({ _id, email, username, victories, losses, createdAt, updatedAt }) => {
  return {
    userId: _id,
    email,
    username,
    victories,
    losses,
    createdAt,
    updatedAt
  };
};

module.exports = {
  UsersService: {
    findAll,
    findOne,
    create,
    normalize,
    getBestUsers,
  },
};
