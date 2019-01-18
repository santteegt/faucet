import OceanFaucet from '../controllers/oceanFaucet';
import config from '../config';
import { check, body, validationResult } from 'express-validator/check';
import Eth from 'ethjs';

module.exports = (app, ocean) => {

	app.get('/', (req, res) => {
		res.render('index', {
			page:'Home',
			faucetURL: req.protocol + '://' + req.get('host') + '/faucet', 
			faucetTokens: config.oceanConfig.faucetTokens,
			faucetTimeSpan: config.oceanConfig.faucetTimeSpan
		})
	})

	app.post('/faucet', [
		check('address', 'Ethereum address not sent').exists(),
		body('address').custom((value) => {
			if(!Eth.isAddress(value)) {
				return Promise.reject('Invalid Ethereum address')
			} else {
				return Promise.resolve()
			}
		})], (req, res) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({ 
					success: false,
					message: 'Bad Request',
					errors: errors.array() 
				});
			} else {
				OceanFaucet.isValidFaucetRequest(req.body).then(() => {
					OceanFaucet.request(req, res, ocean)
						.then((response) => res.status(200).json(response))
						.catch((err) => res.status(500).json(err))
				}).catch((err) => res.status(err.statusCode).json(err.result))
			}
		}
	)
}