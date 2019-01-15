import Faucet from '../models/faucet';
import logger from '../utils/logger';
import config from '../config';
import { Account, Keeper } from '@oceanprotocol/squid';
import moment from 'moment';

const OceanFaucet = {
	request: (req, res, ocean) => {

		return new Promise((resolve, reject) => {
			// console.log(req);
			const params = req.body
			console.log(`Ocean instance ${ocean}`)
			console.log(`Account: ${params.address}`)

			const sender = new Account(params.address)
		    ocean.keeper.market.requestTokens(config.oceanConfig.faucetTokens, params.address).then((rs) => {
				console.log(`Success requesting tokens for ${params.address}`)
				new Faucet({
					'address': params.address,
					'ipaddress': req.clientIp,
					'agent': params.agent || 'server'
				}).save((error, record) => {
					resolve({
						sucess: true,
						message: `${config.oceanConfig.faucetTokens} Ocean Tokens were successfully deposited into your account`
					})	
				})
				sender.getOceanBalance().then((balance) => console.log(`Ocean Balance: ${balance}`))
		  		.catch((err) => console.log(err))
			}).catch((err) => reject({sucess: false, message: `Error while tryng to request tokens to OceanMarket ${err}`}))
		})

		// ocean.getAccounts().then((accounts) => {
		//     console.log(accounts)
		//     const consumer = accounts[1]
		//     console.log(`account that request tokens ${consumer.id}`)
		    
		    
		    
		//     consumer.requestTokens(5).then((some) => {
	 //    	// sender.requestTokens(5).then((some) => {
		//       console.log(some)
		//       consumer.getOceanBalance().then((balance) => console.log(`Ocean Balance: ${balance}`))
		//       // sender.getOceanBalance().then((balance) => console.log(`Ocean Balance: ${balance}`))
		//       .catch((err) => console.log(err))
		//     }).catch((err) => console.log(err))
		//     // consumer.getBalance().then((some) => console.log(some)).catch((err) => console.log(err))
	 //  	});
	},

	isValidFaucetRequest: (body) => {
		return new Promise((resolve, reject) => {
			Faucet.find({address: body.address}).sort('-createdAt').exec((err, data) => {
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