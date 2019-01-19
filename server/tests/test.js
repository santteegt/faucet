// Import the dependencies for testing
import chai from 'chai'
import chaiHttp from 'chai-http'
import mongoose from 'mongoose';
import app from '../server'
// Configure chai
chai.use(chaiHttp)
chai.should()

const expect = chai.expect

describe('Testing Ocean Instance at startup', () => {

    it('should not be null', (done) => {
        chai.request(app).get('/').end(function(err, res) {
            console.log(`ERROR ${err}`)
            console.log(`RES ${res}`)
            // res.should.have.status(200);
            expect(res).to.have.status(200)
            done();
        });
    });
});