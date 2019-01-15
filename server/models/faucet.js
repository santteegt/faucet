import mongoose, { Schema } from 'mongoose';
import timestamps from 'mongoose-timestamp';

import logger from '../utils/logger';

export const FaucetSchema = new Schema(
	{
		address: {
			type: String,
			index: true,
			trim: true,
			required: true
		},
		ipaddress: {
			type: String,
			trim: true,
			required: true,
		},
		agent: {
			type: String,
			trim: true,
			required: false
		}
	},
	{ collection: 'faucets' }
);

FaucetSchema.pre('save', function(next) {

	if (!this.isNew) {
		next();
	}
	next()

	// email({
	// 	type: 'welcome',
	// 	email: this.email
	// })
	// 	.then(() => {
	// 		next();
	// 	})
	// 	.catch(err => {
	// 		logger.error(err);
	// 		next();
	// 	});
});

FaucetSchema.pre('findOneAndUpdate', function(next) {
	// if (!this._update.recoveryCode) {
	// 	return next();
	// }

	// email({
	// 	type: 'password',
	// 	email: this._conditions.email,
	// 	passcode: this._update.recoveryCode
	// })
	// 	.then(() => {
	// 		next();
	// 	})
	// 	.catch(err => {
	// 		logger.error(err);
	// 		next();
	// 	});
	next();
});

// UserSchema.plugin(bcrypt);
FaucetSchema.plugin(timestamps);
// UserSchema.plugin(mongooseStringQuery);

FaucetSchema.index({ address: 1, ipaddress: 1, createdAt: 1 });

module.exports = exports = mongoose.model('Faucet', FaucetSchema);