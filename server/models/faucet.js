import mongoose, { Schema } from 'mongoose';
import timestamps from 'mongoose-timestamp';

export const FaucetSchema = new Schema(
	{
		address: {
			type: String,
			index: true,
			trim: true,
			required: true
		},
		tokenAmount: {
			type: Number,
			required: true
		},
		ethAmount: {
			type: Number,
			required: true
		},
		ethTrxHash: {
			type: String,
			trim: true,
			required: false
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

FaucetSchema.plugin(timestamps);
FaucetSchema.index({ address: 1, ipaddress: 1, createdAt: 1 });

module.exports = exports = mongoose.model('Faucet', FaucetSchema);