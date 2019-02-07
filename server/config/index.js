import path from 'path';
require('dotenv').config({path: path.join(__dirname, '../.env')})
export default {
	env: process.env.NODE_ENV || 'development',
	server: {
		port: 3001
	},
	logger: {
		host: process.env.LOGGER_HOST, // Papertrail Logging Host
		port: process.env.LOGGER_PORT, // Papertrail Logging Port
	},
	database: {
		uri: process.env.MONGODB_URL || "mongodb://localhost:27017/faucetdb"
	},
	oceanConfig: {
		// tokens per request
		faucetTokens: process.env.FAUCET_TOKENS || 10,
		// ETH per request
		faucetEth: process.env.FAUCET_ETH || 3,
		// timespan between requests (in hours)
		faucetTimeSpan: process.env.FAUCET_TIMESPAN || 24,
		// the node of the blockchain to connect to, could also be infura
		nodeUri: process.env.KEEPER_URI || "http://localhost:8545",
		// the uri of aquarius
	    aquariusUri: process.env.AQUARIUS_URI || "http://localhost:5000",
		 // the uri of brizo
	    brizoUri: process.env.BRIZO_URI || "http://localhost:8030",
		// the uri to the parity node you want to use for encryption and decryption
	    parityUri: process.env.PARITY_URI || "http://localhost:8545",
		 // the uri of the secret store that holds the keys
	    secretStoreUri: process.env.SECRETSTORE_URI || "http://localhost:12001",
		// the threshold of nodes from the secret store that have to agree to the decrypt
	    threshold: process.env.SECRETSTORE_THRESHOLD || 0,
		// the password for the account (in the local parity node) used to sign messages for secret store
	    password: process.env.ACCOUNT_PWD || "node0",
		// the address of the account (in the local parity node) used to sign messages for secret store
	    address: process.env.ADDRESS || "0x00bd138abd70e2f00903268f3db08f2d25677c9e",
	}
};
