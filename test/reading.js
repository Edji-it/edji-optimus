var chai = require("chai");
var chaiHttp = require("chai-http");
var server = require("./../index");
var should = chai.should();

var Reading = require("./../models/Reading");
var db = require("./db");

chai.use(chaiHttp);

describe("Readings", () => {
  beforeEach(db.seedDB);

  describe('POST /readings', () => {
    it("it should create a new reading", (done) => {
      chai.request(server)
        .post("/readings")
        .send({ reading: db.readings.newReading })
        .end((err, res) => {
          //initial validation
          res.should.have.status(200);

          done();
        });
    });
  });
});