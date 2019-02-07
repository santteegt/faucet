var reload = require('require-reload')(require);
import chai from 'chai';
import chaiHttp from 'chai-http';
import mockedEnv from 'mocked-env';
import Faucet from '../models/faucet';

chai.use(chaiHttp)

const expect = chai.expect
let restore
let app

describe('Test Faucet server requests', () => {

    before(() => {
        restore = mockedEnv({
            ADDRESS: '0x00bd138abd70e2f00903268f3db08f2d25677c9e',
            NODE_ENV: 'test'
        })
        app = require('../server')
    })

    beforeEach(function(){
        Faucet.remove({}, function (err) {
            if (err) console.log('Error deleting faucet')
            console.log('Cleaned DB for testing')
        })
    })

    it('should not POST without an address', (done) => {
        let req = { address : '' }
        chai.request(app).post('/faucet').send(req).end(function(err, res) {
            expect(res).to.have.status(400)
            expect(res.body).not.equal(null)
            expect(res.body.errors).not.equal(null)
            expect(res.body.errors).to.have.lengthOf.at.least(1)
            expect(res.body.errors[0].msg).to.eql('Invalid Ethereum address')
            done()
        })
    })

    it('should not POST with an invalid address', (done) => {
        let req = { address: 'invalidaddress' }
        chai.request(app).post('/faucet').send(req).end(function(err, res) {
            expect(res).to.have.status(400)
            expect(res.body).not.equal(null)
            expect(res.body.errors).not.equal(null)
            expect(res.body.errors).to.have.lengthOf.at.least(1)
            expect(res.body.errors[0].msg).to.eql('Invalid Ethereum address')
            done()
        })
    })

    it('should Deposit 5 Ocean Tokens and 1 ETH', (done) => {
        let req = { address: '0x1F08a98e53b2bDd0E6aE8E1140017e26E935780D' }
        chai.request(app).post('/faucet').send(req).end(function(err, res) {
            expect(res).to.have.status(200)
            expect(res.body).to.not.be.null
            expect(res.body.message).to.eql('5 Ocean Tokens and 1 ETH were successfully deposited into your account')
            expect(res.body.record).to.not.be.null
            done()
        })
    })

    it('should not be able to requets tokens in less than 24 hours', (done) => {
        let req = { address: '0x1F08a98e53b2bDd0E6aE8E1140017e26E935780D' }
        chai.request(app).post('/faucet').send(req).end(function(err, res) {
            expect(res.body).not.equal(null)
            expect(res.body.message).to.eql('5 Ocean Tokens and 1 ETH were successfully deposited into your account')
            expect(res).to.have.status(200)

            chai.request(app).post('/faucet').send(req).end(function(err, res) {
                expect(res.body).not.equal(null)
                expect(res.body.message).to.include('Tokens were last transferred to you')
                expect(res).to.have.status(400)
                done()
            })
        })
    })

    after(() => {
        restore()
    })



})

describe('Test Faucet request using empty (no ETH funds) seed account', () => {

    before((done) => {

        Faucet.remove({}, function (err) {
            if (err) console.log('Error deleting faucet')
            console.log('Cleaned DB for testing')
            delete require.cache[require.resolve('../server')]
            restore = mockedEnv({
                ADDRESS: '0x10bd138abd70e2f00903268f3db08f2d25677c9d',
                NODE_ENV: 'test'
            })
            app = require('../server')
            done()
        })

        
    })

    it('should throw an error as faucet account address does not have enough ETH to transact', (done) => {
        let req = { address: '0x7E187af69973a66e049a15E763c97CB726765f87' }
        chai.request(app).post('/faucet').send(req).end(function(err, res) {
            expect(res.body).not.equal(null)
            expect(res.body.message).to.eql('Faucet server is not available (Seed account does not have enought funds to process the request)')
            expect(res).to.have.status(500)
            done()
        })
    })

})