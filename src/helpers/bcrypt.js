const bcrypt = require('bcrypt');

const createHash = (password) => {
  return bcrypt.hash(password, Number(process.env.SALT));
};

const compare = async (password, hashedPassword) => {
  const isValid = await bcrypt.compare(password, hashedPassword);

  return isValid;
};

module.exports = {
  bcryptHelper: {
    createHash,
    compare,
  },
};
