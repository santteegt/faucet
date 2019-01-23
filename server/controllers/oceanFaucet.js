var reload = require('require-reload')(require)
import Faucet from '../models/faucet';
import logger from '../utils/logger';
import { Ocean, Account, Keeper } from '@oceanprotocol/squid';
import moment from 'moment';

const OceanFaucet = {
	request: (req, res) => {

		return new Promise((resolve, reject) => {

			let config = reload('../config').default
			Ocean.getInstance(config.oceanConfig).then((ocean) => {

				const parameters = req.body
				const faucetAddress  = new Account(config.oceanConfig.address)
				const requestAddress = new Account(parameters.address)
				
				logger.log(`Request Account: ${parameters.address}`)

				faucetAddress.getBalance().then((balance) => {
					logger.log(`Faucet Current Ether Balance: ${balance.eth}`)
					logger.log(`Faucet Current Ocean Balance: ${balance.ocn}`)

					if(balance.eth == 0) {
						reject({
							sucess: false, 
							message: 'Faucet server is not available (Seed account does not have enought funds to process request)'
						})
					}

					const faucet = new Faucet({
						'address': parameters.address.toUpperCase(),
						'ipaddress': req.clientIp,
						'agent': parameters.agent || 'server'
					})

					if(balance.ocn >= config.oceanConfig.faucetTokens) {

						OceanFaucet.transferTokens(
							ocean, 
							faucetAddress, 
							requestAddress, 
							config.oceanConfig.faucetTokens, 
							faucet, 
							resolve, reject)

					} else {
					    ocean.keeper.market.requestTokens(
					    	config.oceanConfig.faucetTokens, faucetAddress.id).then((rs) => {

								logger.log(`Success requesting tokens to OceanMarket for faucet address ${faucetAddress.id}`)
								OceanFaucet.transferTokens(
									ocean, 
									faucetAddress, 
									requestAddress, 
									config.oceanConfig.faucetTokens, 
									faucet, 
									resolve, reject)
								
						}).catch((err) => {
							const errorMsg = `Error while tryng to request tokens to OceanMarket ${err}`
							logger.error(errorMsg)
							reject({sucess: false, message: errorMsg})
						})
					}
				}).catch((error) => {
					const errorMsg = `Error when trying to connect to Ocean Protocol: ${error}`
					logger.error(errorMsg)
					reject({sucess: false, message: errorMsg})
				})
			}).catch((error) => {
				const errorMsg = `Error when trying to connect to Ocean Protocol: ${error}`
				logger.error(errorMsg)
				reject({sucess: false, message: errorMsg})
			})
		})
	},

	transferTokens: (ocean, faucetAddress, requestAddress, amount, faucet, resolve, reject) => {

		ocean.keeper.token.send('transfer', faucetAddress.id, [requestAddress.id, amount]).then((rs) => {
			logger.log(`Success sending ${amount} OceanTokens to ${requestAddress.id}`)

			faucet.save((error, record) => {
				resolve({
					sucess: true,
					message: `${amount} Ocean Tokens were successfully deposited into your account`
				})	
			})
			requestAddress.getOceanBalance().then((balance) => logger.log(`Recipient Ocean Balance: ${balance}`))
				.catch((err) => logger.error(err))

		}).catch((err) => {
			const errorMsg = `Error while tryng to send tokens to ${requestAddress.id}: ${err}`
			logger.error(errorMsg)
			reject({sucess: false, message: errorMsg})
		})
	},

	isValidFaucetRequest: (body) => {
		return new Promise((resolve, reject) => {
			let config = reload('../config').default
			Faucet.find({address: body.address.toUpperCase()}).sort('-createdAt').exec((err, data) => {
				if (err)
					reject({statusCode: 500, result: {success: false, message: err}})
				if(data && data.length > 0) {
					const lastRequest = moment(data[0].createdAt, 'YYYY-MM-DD HH:mm:ss')
						.add(config.oceanConfig.faucetTimeSpan, 'h')
					const reqTimestamp = moment()
					const diff = lastRequest.diff(reqTimestamp)
					if(diff > 0) {
						const diffStr = moment.utc(lastRequest.diff(reqTimestamp)).format('HH:mm:ss')
						const errorMsg = `Tokens were last transferred to this account ${diffStr} ago. ` 
						+ `Faucet requests can be done every ${config.oceanConfig.faucetTimeSpan} hours`
						reject({statusCode: 400, result: {success: false, message: errorMsg}})
					} else {
						resolve()
					}
				} else {
					resolve()
				}
			})
		})
	}
}

module.exports = OceanFaucet