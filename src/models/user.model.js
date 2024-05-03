const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema(
	{
		username: { type: Schema.Types.String, required: true },
		email: { type: Schema.Types.String, required: true },
		password: { type: Schema.Types.String, required: true },

		victories: { type: Schema.Types.Number, default: 0 },
		losses: { type: Schema.Types.Number, default: 0 },

		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date, default: Date.now },
	}, 
);

module.exports = mongoose.model('User', User);