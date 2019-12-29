// Test framework libraries
const { expect } = require("chai");
//const sinon = require("sinon");

const { mockState } = require("../test-utils/express-shim");
const vet = require("../../middleware/vet");

describe("vet", () => {
  function buildState(schema, body) {
    const mockReq = {
      body
    };

    const [req, res, next] = mockState(mockReq);

    const middleware = vet(schema);
    middleware(req, res, next);

    return req;
  }

  describe("schema error checking", () => {
    describe("Basic checks", () => {
      it("should allow all supported types", () => {
        const schema = {
          bool: Boolean,
          num: Number,
          str: String,
          date: Date
        };
  
        expect(() => vet(schema)).to.not.throw();
      })
  
      it("constraints object should allow all supported types", () => {
        const schema = {
          bool: { type: Boolean },
          num: { type: Number },
          str: { type: String },
          date: { type: Date }
        };
  
        expect(() => vet(schema)).to.not.throw();
      })
  
      it("should throw error for undefined type", () => {
        const schema = {
          prop: undefined
        };
  
        expect(() => vet(schema)).to.throw("Invalid constraints for property prop.");
      });
  
      it("should throw error for null type", () => {
        const schema = {
          prop: null
        };
  
        expect(() => vet(schema)).to.throw("Invalid constraints for property prop.");
      });
  
      it("should throw error for unsupported types", () => {
        const schema = {
          prop: Symbol
        };
  
        expect(() => vet(schema)).to.throw("Property prop has unsupported type.");
      })
    });

    describe("constraints object", () => {
      describe("type property", () => {
        it("should throw error if type property is missing", () => {
          const schema = {
            prop: {}
          };
    
          expect(() => vet(schema)).to.throw("Constraints object for prop must have type property.");
        });
        
        it("should throw error if type property is null", () => {
          const schema = {
            prop: { type: null }
          };
    
          expect(() => vet(schema)).to.throw("Constraints object for property prop has invalid/unsupported type.");
        });
        
        it("should throw error if value for type property is invalid", () => {
          const schema = {
            prop: { type: 4 }
          };
    
          expect(() => vet(schema)).to.throw("Constraints object for property prop has invalid/unsupported type.");
        });
      });

      describe("default property", () => {
        it("should allow null for default value.", () => {
          const schema = {
            prop1: {
              type: Boolean,
              default: null
            },
            prop2: {
              type: Number,
              default: null
            },
            prop3: {
              type: String,
              default: null
            },
            prop4: {
              type: Date,
              default: null
            }
          };
    
          expect(() => vet(schema)).to.not.throw();
        });

        it("should throw error if default prop for Boolean is invalid type", () => {
          const schema = {
            prop: {
              type: Boolean,
              default: 22
            }
          };
    
          expect(() => vet(schema)).to.throw("Property prop has invalid value for default constraint.  Value must be a boolean.");
        });

        it("should throw error if default prop for Number is invalid type", () => {
          const schema = {
            prop: {
              type: Number,
              default: true
            }
          };
    
          expect(() => vet(schema)).to.throw("Property prop has invalid value for default constraint.  Value must be a number.");
        });

        it("should throw error if default prop for String is invalid type", () => {
          const schema = {
            prop: {
              type: String,
              default: 22
            }
          };
    
          expect(() => vet(schema)).to.throw("Property prop has invalid value for default constraint.  Value must be a string.");
        });

        it("should throw error if default prop for Date is not a string", () => {
          const schema = {
            prop: {
              type: Date,
              default: 22
            }
          };
    
          expect(() => vet(schema)).to.throw("Property prop has invalid value for default constraint.  Value must be a string.");
        });

        it("should throw error if default prop for Date is not a valid date string", () => {
          const schema = {
            prop: {
              type: Date,
              default: "Yeeeeet!"
            }
          };

          expect(() => vet(schema)).to.throw("Property prop has invalid value for default constraint.  Value must be a valid date string.");
        });        
      });

      describe("number min and max", () => {
        it("should throw an error if min is not a number", () => {
          const schema = {
            prop: {
              type: Number,
              min: "23"
            }
          };

          expect(() => vet(schema)).to.throw("Property prop has invalid value for min constraint.  Value must be a number.");
        });

        it("should throw an error if max is not a number", () => {
          const schema = {
            prop: {
              type: Number,
              max: "23"
            }
          };

          expect(() => vet(schema)).to.throw("Property prop has invalid value for max constraint.  Value must be a number.");
        });

        it("should throw an error if min > max", () => {
          const schema = {
            prop: {
              type: Number,
              min: 100,
              max: 0
            }
          };

          expect(() => vet(schema)).to.throw("Property prop has min constraint that is greater than max constraint.");
        });
      });

      describe("values array", () => {
        it("Should throw an error if values is not an array", () => {
          const schema = {
            prop: {
              type: Number,
              values: null
            }
          };

          expect(() => vet(schema)).to.throw("Property prop has invalid values constraint.  Expected an array of values.");
        });

        it("Should throw an error if values do not match type", () => {
          const schema = {
            prop: {
              type: Number,
              values: [ 123, 456, "hello" ]
            }
          };

          expect(() => vet(schema)).to.throw("Property prop has invalid value for values constraint.  Value must be a number.");
        });
      });
    });

    describe("schema for sub-document", () => {
      it("should throw an error if schema property is missing.", () => {
        const schema = {
          profile: { 
            type: Object
          }
        };

        expect(() => vet(schema)).to.throw("Constraints for property profile of type Object has missing schema.");
      });

      it("should throw an error if schema property is not an object.", () => {
        const schema = {
          profile: { 
            type: Object,
            schema: null
          }
        };

        expect(() => vet(schema)).to.throw("Constraints for property profile of type Object has invalid schema.");
      });

      it("should throw an error if default constraint is not null (default can only be null).", () => {
        const schema = {
          profile: { 
            type: Object,
            default: {},
            schema: {
              name: String,
              age: Number,
              isVeteran: Boolean
            }
          }
        };

        expect(() => vet(schema)).to.throw("Vet schema error for property profile: when type is Object, property default may only have a value of null.");
      });
    });

    describe("Arrays", () => {
      it("should throw an error if ofType property is missing.", () => {
        const schema = {
          fibonacci: { 
            type: Array,
          }
        };

        expect(() => vet(schema)).to.throw("Vet schema error for property fibonacci: when type is Array, property ofType is required");
      });
    });
  });

  describe.only("validation for individual props", () => {
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

      describe("with constraints", () => {
        it("should validate when only type constraint is given", () => {
          const schema = {
            isVeteran: {
              type: Boolean
            },
            isMale: {
              type: Boolean
            }
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

        it("should give a default value when property is missing", () => {
          const schema = {
            isVeteran: {
              type: Boolean,
              default: true
            },
            isMale: {
              type: Boolean,
              default: false
            }
          };
    
          const body = {
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(0);
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(2);
          expect(req.data.isVeteran).to.be.true;
          expect(req.data.isMale).to.be.false;
        });

        it("should give an error for a required property", () => {
          const schema = {
            isVeteran: {
              type: Boolean,
              required: true
            },
            isMale: {
              type: Boolean,
              required: true
            }
          };
    
          const body = {
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(2);
          expect(req.errors[0]).to.equal("Property \"isVeteran\" is required.")
          expect(req.errors[1]).to.equal("Property \"isMale\" is required.")
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("isVeteran")).to.be.false;
          expect(req.data.hasOwnProperty("isMale")).to.be.false;
        });
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

      describe("with constraints", () => {
        it("should validate when only type constraint is given", () => {
          const schema = {
            age: { 
              type: Number
            },
            weight: { 
              type: Number
            }
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

        it("should give a default value when property is missing", () => {
          const schema = {
            age: { 
              type: Number,
              default: 25
            },
            weight: { 
              type: Number,
              default: 123.45
            }
          };
    
          const body = {
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(0);
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(2);
          expect(req.data.age).to.be.equal(25);
          expect(req.data.weight).to.be.equal(123.45);
        });

        it("should give an error for a required property", () => {
          const schema = {
            age: { 
              type: Number,
              required: true
            },
            weight: { 
              type: Number,
              required: true
            }
          };
    
          const body = {
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(2);
          expect(req.errors[0]).to.equal("Property \"age\" is required.")
          expect(req.errors[1]).to.equal("Property \"weight\" is required.")
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("age")).to.be.false;
          expect(req.data.hasOwnProperty("weight")).to.be.false;
        });

        it("should give an error for a value below min constraint", () => {
          const schema = {
            age: { 
              type: Number,
              min: 18
            },
            weight: { 
              type: Number,
              min: 160
            }
          };
    
          const body = {
            age: 14,
            weight: 100
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(2);
          expect(req.errors[0]).to.equal("Property \"age\" is below the minimum value of 18.")
          expect(req.errors[1]).to.equal("Property \"weight\" is below the minimum value of 160.")
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("age")).to.be.false;
          expect(req.data.hasOwnProperty("weight")).to.be.false;
        });

        it("should give an error for a value above max constraint", () => {
          const schema = {
            age: { 
              type: Number,
              max: 18
            },
            weight: { 
              type: Number,
              max: 290
            }
          };
    
          const body = {
            age: 25,
            weight: 300
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(2);
          expect(req.errors[0]).to.equal("Property \"age\" is above the maximum value of 18.")
          expect(req.errors[1]).to.equal("Property \"weight\" is above the maximum value of 290.")
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("age")).to.be.false;
          expect(req.data.hasOwnProperty("weight")).to.be.false;
        });

        it("should validate an integer within the min and max values", () => {
          const schema = {
            age: {
              type: Number,
              min: 20,
              max: 30
            },
            weight: {
              type: Number,
              min: 100,
              max: 200
            }
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
  
        it("should give an error for a value not in the array of acceptable values", () => {
          const schema = {
            age: { 
              type: Number,
              values: [2, 4, 6, 8]
            },
            weight: { 
              type: Number,
              values: [2, 4, 6, 8]
            }
          };
    
          const body = {
            age: 25,
            weight: 300
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(2);
          expect(req.errors[0]).to.equal("Property \"age\" has an invalid value of 25.")
          expect(req.errors[1]).to.equal("Property \"weight\" has an invalid value of 300.")
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("age")).to.be.false;
          expect(req.data.hasOwnProperty("weight")).to.be.false;
        });

        it("should validate an integer within a set of values", () => {
          const schema = {
            prime: {
              type: Number,
              values: [2, 3, 5, 7, 11]
            },
            flag: {
              type: Number,
              values: [3, 128]
            }
          };
    
          const body = {
            prime: 7,
            flag: 128
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(0);
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(2);
          expect(req.data.prime).to.be.equal(7);
          expect(req.data.flag).to.be.equal(128);
        });
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

      describe("with constraints", () => {
        it("should validate a string from an array of values", () => {
          const schema = {
            weekend: { 
              type: String,
              values: ["Saturday", "Sunday"]
            },
            color: { 
              type: String,
              values: ["Red", "Green", "Blue"]
            }
          };

          const body = {
            weekend: "Sunday",
            color: "Red"
          };
  
          const req = buildState(schema, body);
  
          expect(req.errors.length).to.equal(0);
  
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(2);
          expect(req.data.weekend).to.be.equal("Sunday");
          expect(req.data.color).to.be.equal("Red");
        });
    
        it("should give an error for a value not in the array of acceptable values", () => {
          const schema = {
            weekend: { 
              type: String,
              values: ["Saturday", "Sunday"]
            },
            color: { 
              type: String,
              values: ["Red", "Green", "Blue"]
            }
          };
    
          const body = {
            weekend: "Monday",
            color: "Black"
          };
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(2);
          expect(req.errors[0]).to.equal("Property \"weekend\" has an invalid value of Monday.")
          expect(req.errors[1]).to.equal("Property \"color\" has an invalid value of Black.")
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("age")).to.be.false;
          expect(req.data.hasOwnProperty("weight")).to.be.false;
        });
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
        expect(req.data.startDate).to.be.equal("1990-03-20T12:00:00");
        expect(req.data.endDate).to.be.equal("2010-06-30T00:00:00");
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
  
    describe("Object", () => {
      it("should validate a property that contains a nested schema", () => {
        const schema = {
          profile: { 
            type: Object,

            schema: {
              name: String,
              age: Number,
              isVeteran: Boolean
            }
          }
        };
  
        const body = {
          profile: {
            name: "Billy Bob",
            age: 22,
            isVeteran: false
          }
        };
  
        const req = buildState(schema, body);
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.profile).to.be.ok;
        expect(req.data.hasOwnProperty("profile")).to.be.true;
        expect(req.data.profile.name).to.be.equal("Billy Bob");
        expect(req.data.profile.age).to.be.equal(22);
        expect(req.data.profile.isVeteran).to.be.equal(false);
      });

      it("should ignore missing nested document if property is not required", () => {
        const schema = {
          profile: { 
            type: Object,

            schema: {
              name: String,
              age: Number,
              isVeteran: Boolean
            }
          }
        };
  
        const body = {
        };
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("profile")).to.be.false;
      });

      it("should use null if { default: null } was specified.", () => {
        const schema = {
          profile: { 
            type: Object,
            default: null,
            schema: {
              name: String,
              age: Number,
              isVeteran: Boolean
            }
          }
        };
  
        const body = {
        };
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("profile")).to.be.true;
        expect(req.data.profile).to.be.null;
      });

      it("should allow null for nested document.", () => {
        const schema = {
          profile: { 
            type: Object,
            schema: {
              name: String,
              age: Number,
              isVeteran: Boolean
            }
          }
        };
  
        const body = {
          profile: null
        };
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("profile")).to.be.true;
        expect(req.data.profile).to.be.null;
      });

      it("should fail validation if required constraint is true", () => {
        const schema = {
          profile: { 
            type: Object,
            required: true,
            schema: {
              name: String,
              age: Number,
              isVeteran: Boolean
            }
          }
        };
  
        const body = {
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"profile\" is required.")

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("profile")).to.be.false;
      });

      it("should fail validation if required constraint is true, but null is given", () => {
        const schema = {
          profile: { 
            type: Object,
            required: true,
            schema: {
              name: String,
              age: Number,
              isVeteran: Boolean
            }
          }
        };
  
        const body = {
          profile: null
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"profile\" is required and may not be null.")

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("profile")).to.be.false;
      });

      it("should fail validation if nested document is not an object", () => {
        const schema = {
          profile: { 
            type: Object,
            schema: {
              name: String,
              age: Number,
              isVeteran: Boolean
            }
          }
        };
  
        const body = {
          profile: "wuuuut??"
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"profile\" must contain a nested object.")

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("isVeteran")).to.be.false;
        expect(req.data.hasOwnProperty("isMale")).to.be.false;
      });
    });
  
    describe("Array", () => { /*****/
      it("should validate a property that contains an array of values", () => {
        const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
        const schema = {
          fibonacci: { 
            type: Array,
            ofType: Number
          }
        };
  
        const body = {
          fibonacci: [...fibs]
        };
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.fibonacci).to.be.ok;
        expect(req.data.hasOwnProperty("fibonacci")).to.be.true;
        for (let i in req.data.fibonacci) {
          expect(req.data.fibonacci[i]).to.equal(fibs[i]);
        }
      });

      it("should fail validation if array contains an element of the wrong type.", () => {
        const schema = {
          fibonacci: { 
            type: Array,
            ofType: Number
          }
        };
  
        const body = {
          fibonacci: [1, 2, 3, "whaaaat??"]
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"fibonacci\" must have all elements of type number. See item at index 3.");

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("fibonacci")).to.be.false;
      });

      it("should ignore missing array if property is not required", () => {
        const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
        const schema = {
          fibonacci: { 
            type: Array,
            ofType: Number
          }
        };
  
        const body = {
        };
  
        const req = buildState(schema, body);
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("fibonacci")).to.be.false;
      });

      it("should fail validation if property value is not an array", () => {
        const schema = {
          fibonacci: { 
            type: Array,
            ofType: Number
          }
        };
  
        const body = {
          fibonacci: "whaaaat??"
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"fibonacci\" must contain an array.");

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("fibonacci")).to.be.false;
      });

      it("should fail validation if required constraint is true, but null is given", () => {
        const schema = {
          fibonacci: { 
            type: Array,
            ofType: Number,
            required: true
          }
        };
  
        const body = {
          fibonacci: null
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"fibonacci\" is required and may not be null.")

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("fibonacci")).to.be.false;
      });

      it("should allow null for array if no required constraint given.", () => {
        const schema = {
          fibonacci: { 
            type: Array,
            ofType: Number,
          }
        };
  
        const body = {
          fibonacci: null
        };
  
        const req = buildState(schema, body);
  
        expect(req.errors.length).to.equal(0);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("fibonacci")).to.be.true;
        expect(req.data.fibonacci).to.be.null;
      });
    });

    describe("general", () => {
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
    });
  });
});