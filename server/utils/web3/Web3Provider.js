import Web3 from "web3"

let web3 = null

module.exports.getWeb3 = (nodeUri) => {
    if (web3 === null) {
        web3 = new Web3(nodeUri)
    }
    return web3
}