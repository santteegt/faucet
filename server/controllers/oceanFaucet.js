var reload = require('require-reload')(require)
import { Ocean, Account } from '@oceanprotocol/squid';
import Faucet from '../models/faucet';
import logger from '../utils/logger';
import Web3Provider from '../utils/web3/Web3Provider';
import moment from 'moment';

const OceanFaucet = {

	/**
	 * Ocean Faucet request method
	 */
	request: (req, res) => {

		return new Promise((resolve, reject) => {

			let config = reload('../config').default
			Ocean.getInstance(config.oceanConfig).then((ocean) => {
				const web3 = Web3Provider.getWeb3(config.oceanConfig.nodeUri)
				const parameters = req.body
				const faucetAddress  = new Account(config.oceanConfig.address)
				const requestAddress = new Account(parameters.address)
				
				logger.log(`Request Account: ${parameters.address}`)

				faucetAddress.getBalance().then((balance) => {
					logger.log(`Faucet Current Ether Balance: ${balance.eth}`)
					logger.log(`Faucet Current Ocean Balance: ${balance.ocn}`)

					// verify that current ETH balance is greater than requested + 1ETH extra as threshold
					// An alert to admin should be included
					if(balance.eth < ((config.oceanConfig.faucetEth + 1) * 10**18)) {
						reject({
							sucess: false, 
							message: 'Faucet server is not available (Seed account does not have enought funds to process the request)'
						})
					}

					const faucet = new Faucet({
						'address': parameters.address.toUpperCase(),
						'ipaddress': req.clientIp,
						'tokenAmount': config.oceanConfig.faucetTokens,
						'ethAmount': config.oceanConfig.faucetEth,
						'agent': parameters.agent || 'server'
					})

					if(balance.ocn >= config.oceanConfig.faucetTokens) {

						OceanFaucet.transferTokens(
							ocean,
							web3,
							faucetAddress, 
							requestAddress, 
							config.oceanConfig.faucetTokens,
							config.oceanConfig.faucetEth * 10**18,
							faucet, 
							resolve, reject)

					} else {
					    ocean.keeper.market.requestTokens(
					    	config.oceanConfig.faucetTokens, faucetAddress.id).then((rs) => {

								logger.log(`Success requesting tokens to OceanMarket for faucet address ${faucetAddress.id}`)
								OceanFaucet.transferTokens(
									ocean,
									web3,
									faucetAddress, 
									requestAddress, 
									config.oceanConfig.faucetTokens,
									config.oceanConfig.faucetEth * 10**18,
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

	/**
	 * Function to transfer Ocean tokens and ETH to requestAddress
	 * @Param ocean Ocean Protocol instance
	 * @Param web3 Web3 instance
	 * @Param faucetAddress server faucet address
	 * @Param requestAddress faucet tokens recipient
	 * @Param tokenAmount Ocean tokens to be transfered
	 * @Param ethAmount ETH amount to transfer
	 * @Param faucet faucet record
	 * @Param resolve
	 * @Param reject
	 */
	transferTokens: (ocean, web3, faucetAddress, requestAddress, tokenAmount, ethAmount, faucet, resolve, reject) => {

		// sending Ocean tokens
		ocean.keeper.token.send('transfer', faucetAddress.id, [requestAddress.id, tokenAmount]).then((rs) => {
			logger.log(`Success sending ${tokenAmount} OceanTokens to ${requestAddress.id}`)

			faucet.save((error, record) => {
		    	// sending ETH
				web3.eth.sendTransaction({
				    from: faucetAddress.id,
				    to: requestAddress.id,
				    value: ethAmount
				}).on('transactionHash', (hash) => {
					logger.log(`ETH transaction hash ${hash}`)
					const newData = { ethTrxHash: hash }
					Faucet.findOneAndUpdate({_id: record._id}, newData, (err, rec) => {
						if(err) logger.log(`Failed updating faucet record ${err}`)
					})
				}).on('error', (err) => {
					console.log(`ETH transaction failed! ${err}`)
					const newData = { ethTrxHash: err }
					Faucet.findOneAndUpdate({_id: record._id}, newData, (err, rec) => {
						if(err) logger.log(`Failed updating faucet record ${err}`)
					})
				})
				requestAddress.getOceanBalance().then((balance) => logger.log(`Recipient Ocean Balance: ${balance}`))
					.catch((err) => logger.error(err))

				resolve({
					sucess: true,
					message: `${tokenAmount} Ocean Tokens and ${ethAmount / 10**18} ETH were successfully deposited into your account`,
					record: record._id
				})

			})
		}).catch((err) => {
			const errorMsg = `Error while tryng to send tokens to ${requestAddress.id}: ${err}`
			logger.error(errorMsg)
			reject({sucess: false, message: errorMsg})
		})
	},

	/**
	 * Check if faucet request can be processed
	 * @Param req http request
	 */
	isValidFaucetRequest: (req) => {
		return new Promise((resolve, reject) => {
			let config = reload('../config').default
			Faucet.find({$or: [{address: req.body.address.toUpperCase()}, {ipaddress: req.clientIp}]})
				.sort('-createdAt').exec((err, data) => {

				if(err)
					reject({statusCode: 500, result: {success: false, message: err}})
				if(data && data.length > 0) {
					const lastRequest = moment(data[0].createdAt, 'YYYY-MM-DD HH:mm:ss')
						.add(config.oceanConfig.faucetTimeSpan, 'h')
					const reqTimestamp = moment()
					const diff = lastRequest.diff(reqTimestamp)
					if(diff > 0) {
						const diffStr = moment.utc(lastRequest.diff(reqTimestamp)).format('HH:mm:ss')
						const errorMsg = `Tokens were last transferred to you ${diffStr} ago. `
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
	},

	/**
	 * Get Trx hash of ETH deposit
	 * @Param recordId faucet request ID
	 */
	getFaucetRequestEthTrxHash: (recordId) => {
		return new Promise((resolve, reject) => {
			Faucet.findOne({_id: recordId}).exec((err, data) => {
				if(err)
					reject({statusCode: 500, result: {success: false, message: err.message}})
				if(!data) {
					reject({statusCode: 400, result: {success: false, message: 'Faucet record not found'}})
				} else {
					resolve({statusCode: 200, result: {success: true, trxHash: data.ethTrxHash}})	
				}
			})	
		})
		
	}

}

module.exports = OceanFaucet