// Test framework libraries
const { expect } = require("chai");
//const sinon = require("sinon");

const { mockState } = require("../test-utils/express-shim");
const vet = require("../../middleware/vet");

describe.only("vet", () => {
  function buildState(schema, body) {
    const mockReq = {
      body
    };

    const [req, res, next] = mockState(mockReq);

    const middleware = vet(schema);
    middleware(req, res, next);

    return req;
  }

  describe("primitive types", () => {
    describe("boolean", () => {
      it("should validate value of either true or false", () => {
        const schema = {
          isVeteran: Boolean,
          isMale: Boolean
        };
  
        const body = {
          isVeteran: true,
          isMale: false
        }
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(2);
        expect(req.data.isVeteran).to.be.true;
        expect(req.data.isMale).to.be.false;
      });

      it("should reject any value not a Boolean", () => {
        const schema = {
          isVeteran: Boolean,
          isMale: Boolean
        };
  
        const body = {
          isVeteran: 123,
          isMale: "Hello, world!"
        }
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(2);
        expect(req.errors[0]).to.equal("Property \"isVeteran\" must be either true or false.")
        expect(req.errors[1]).to.equal("Property \"isMale\" must be either true or false.")
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("isVeteran")).to.be.false;
        expect(req.data.hasOwnProperty("isMale")).to.be.false;
        });
    });
  
    describe("number", () => {
      it("should validate an integer or float value", () => {
        const schema = {
          age: Number,
          weight: Number
        };
  
        const body = {
          age: 25,
          weight: 123.45
        }
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(2);
        expect(req.data.age).to.be.equal(25);
        expect(req.data.weight).to.be.equal(123.45);
      });

      it("should reject any value not a Number", () => {
        const schema = {
          age: Number,
          weight: Number
        };
  
        const body = {
          age: true,
          weight: "Hello, world!"
        }
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(2);
        expect(req.errors[0]).to.equal("Property \"age\" must be a number.")
        expect(req.errors[1]).to.equal("Property \"weight\" must be a number.")
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("age")).to.be.false;
        expect(req.data.hasOwnProperty("weight")).to.be.false;
        });
    });
  
    describe("string", () => {
      it("should validate any string", () => {
        const schema = {
          firstName: String,
          lastName: String
        };
  
        const body = {
          firstName: "Leroy",
          lastName: "Jenkins"
        };
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(2);
        expect(req.data.firstName).to.be.equal("Leroy");
        expect(req.data.lastName).to.be.equal("Jenkins");
      });

      it("should reject any value not a Number", () => {
        const schema = {
          firstName: String,
          lastName: String
        };
  
        const body = {
          firstName: 123,
          lastName: true
        };
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(2);
        expect(req.errors[0]).to.equal("Property \"firstName\" must be a string.")
        expect(req.errors[1]).to.equal("Property \"lastName\" must be a string.")
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("firstName")).to.be.false;
        expect(req.data.hasOwnProperty("lastName")).to.be.false;
        });
    });
  
    describe("Date", () => {
      it("should validate any string containing a Date", () => {
        const schema = {
          startDate: Date,
          endDate: Date
        };
  
        const body = {
          startDate: "1990-03-20T12:00:00",
          endDate: "2010-06-30T00:00:00"
        };
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(2);
        expect(req.data.startDate.toDateString()).to.be.equal("Tue Mar 20 1990");
        expect(req.data.endDate.toDateString()).to.be.equal("Wed Jun 30 2010");
      });

      it("should reject any value not a Date string", () => {
        const schema = {
          startDate: Date,
          endDate: Date
        };
  
        const body = {
          startDate: 123,
          endDate: "Blarg!!!"
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(2);
        expect(req.errors[0]).to.equal("Property \"startDate\" must be a string containing a date.")
        expect(req.errors[1]).to.equal("Property \"endDate\" does not contain a valid date string.")
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("startDate")).to.be.false;
        expect(req.data.hasOwnProperty("endDate")).to.be.false;
        });
    });
  
    it("should only copy fields defined in the schema", () => {
      const schema = {
        isVeteran: Boolean,
        isMale: Boolean
      };

      const body = {
        name: "Tom",
        isVeteran: true,
        age: 25,
        isMale: false,
        birthDate: "1997-01-01T01-01-01"
      }

      const req = buildState(schema, body);

      expect(req.errors.length).to.equal(0);

      expect(req.data).to.be.ok;
      expect(Object.keys(req.data).length).to.equal(2);
      expect(req.data.name).to.be.undefined;
      expect(req.data.isVeteran).to.be.true;
      expect(req.data.age).to.be.undefined;
      expect(req.data.isMale).to.be.false;
      expect(req.data.birthDate).to.be.undefined;
    });
  
    it("should do nothing for fields that are missing", () => {
      const schema = {
        isVeteran: Boolean,
        isMale: Boolean
      };

      const body = {
        name: "Tom",
        age: 25,
        birthDate: "2019-12-25T05:35:18"
      }

      const req = buildState(schema, body);

      expect(req.errors.length).to.equal(0);

      expect(req.data).to.be.ok;
      expect(Object.keys(req.data).length).to.equal(0);
      expect(req.data.hasOwnProperty("isVeteran")).to.be.false;
      expect(req.data.hasOwnProperty("isMale")).to.be.false;
    });
  })
});