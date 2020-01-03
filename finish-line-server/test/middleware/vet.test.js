// Test framework libraries
const { expect } = require("chai");
//const sinon = require("sinon");

const { mockState, executeMiddleware } = require("../test-utils/express-shim");
const vet = require("../../middleware/vet");
const repartee = require("../../middleware/repartee");

describe("vet", () => {
  function buildState(schema, body) {
    const mockReq = {
      body
    };

    const state = mockState(mockReq);

    const middleware = vet(schema, { autoRespond: false });
    executeMiddleware(state, middleware);

    return state[0];
  }

  function buildMountedMiddleware(schema, body, vetOptions) {
    const mockReq = {
      body
    };

    const reparteeMiddleware = repartee.responses();
    const vetMiddleware = vet(schema, vetOptions);

    const state = mockState(mockReq);
    executeMiddleware(state, reparteeMiddleware, vetMiddleware);

    return state;
  }

  function expectZeroErrors(errors) {
    for (err of errors) {
      console.log("Spurious error: " + err);
    }

    expect(errors.length).to.equal(0);
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
          testProp: undefined
        };
  
        expect(() => vet(schema)).to.throw("Vet schema error for property testProp: constraints object expected.");
      });
  
      it("should throw error for null type", () => {
        const schema = {
          testProp: null
        };
  
        expect(() => vet(schema)).to.throw("Vet schema error for property testProp: constraints object expected.");
      });
  
      it("should throw error for unsupported types", () => {
        const schema = {
          testProp: Symbol
        };
  
        expect(() => vet(schema)).to.throw("Vet schema error for property testProp: expected primitive type, or Date, or constraints object.");
      })
    });

    describe("constraints object", () => {
      describe("type property", () => {
        it("should throw error if type property is missing", () => {
          const schema = {
            testProp: {}
          };
    
          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: constraints object must have property \"type\".");
        });
        
        it("should throw error if type property is null", () => {
          const schema = {
            testProp: { type: null }
          };
    
          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: constraints object has invalid/unsupported value for constraint \"type\".");
        });
        
        it("should throw error if value for type property is invalid", () => {
          const schema = {
            testProp: { type: 4 }
          };
    
          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: constraints object has invalid/unsupported value for constraint \"type\".");
        });
      });

      describe("default property", () => {
        it("should allow null for default value", () => {
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

        it("should throw error if default testProp for Boolean is invalid type", () => {
          const schema = {
            testProp: {
              type: Boolean,
              default: 22
            }
          };
    
          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"default\" must be a boolean.");
        });

        it("should throw error if default testProp for Number is invalid type", () => {
          const schema = {
            testProp: {
              type: Number,
              default: true
            }
          };
    
          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"default\" must be a number.");
        });

        it("should throw error if default testProp for String is invalid type", () => {
          const schema = {
            testProp: {
              type: String,
              default: 22
            }
          };
    
          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"default\" must be a string.");
        });

        it("should throw error if default testProp for Date is not a string", () => {
          const schema = {
            testProp: {
              type: Date,
              default: 22
            }
          };
    
          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"default\" must be a string.");
        });

        it("should throw error if default testProp for Date is not a valid date string", () => {
          const schema = {
            testProp: {
              type: Date,
              default: "Yeeeeet!"
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"default\" must be a valid date string.");
        });        
      });

      describe("type: Number", () => {
        it("should throw an error if trunc is not a boolean", () => {
          const schema = {
            testProp: {
              type: Number,
              trunc: "23"
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value must be either true or false");
        });

        it("should throw an error if min is not a number", () => {
          const schema = {
            testProp: {
              type: Number,
              min: "23"
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"min\" must be a number");
        });

        it("should throw an error if max is not a number", () => {
          const schema = {
            testProp: {
              type: Number,
              max: "23"
            }
          };

          expect(() => vet(schema)).to.throw("et schema error for property testProp: value for constraint \"max\" must be a number.");
        });

        it("should throw an error if min > max", () => {
          const schema = {
            testProp: {
              type: Number,
              min: 100,
              max: 0
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: min constraint cannot be greater than max constraint.");
        });
      });

      describe("type: String", () => {
        it("should throw an error if toLowerCase is not a boolean", () => {
          const schema = {
            testProp: {
              type: String,
              toLowerCase: "23"
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"toLowerCase\" must be either true or false");
        });

        it("should throw an error if toUpperCase is not a boolean", () => {
          const schema = {
            testProp: {
              type: String,
              toUpperCase: null
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"toUpperCase\" must be either true or false");
        });

        it("should throw an error if both toLowerCase and toUpperCase are specified", () => {
          const schema = {
            testProp: {
              type: String,
              toUpperCase: true,
              toLowerCase: true
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: cannot have both toLowerCase and toUpperCase set to true.");
        });

        it("should throw an error if trim is not a boolean", () => {
          const schema = {
            testProp: {
              type: String,
              trim: 1234
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"trim\" must be either true or false");
        });

        it("should throw an error if minLength is not a number", () => {
          const schema = {
            testProp: {
              type: String,
              minLength: "wurt?"
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"minLength\" must be a number.");
        });

        it("should throw an error if maxLength is not a number", () => {
          const schema = {
            testProp: {
              type: String,
              maxLength: {}
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"maxLength\" must be a number.");
        });

        it("should throw an error if minLength > maxLength", () => {
          const schema = {
            testProp: {
              type: String,
              minLength: 44,
              maxLength: 43
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"minLength\" cannot be greater than \"maxLength\".");
        });

        it("should throw an error if match property is not a regex (use number)", () => {
          const schema = {
            testProp: {
              type: String,
              match: 23
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: Value for constraint \"match\" must be a regular expression.");
        });

        it("should throw an error if match property is not a regex (use null)", () => {
          const schema = {
            testProp: {
              type: String,
              match: null
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: Value for constraint \"match\" must be a regular expression.");
        });

        it("should throw an error if match property is not a regex (use number)", () => {
          const schema = {
            testProp: {
              type: String,
              match: {}
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: Value for constraint \"match\" must be a regular expression.");
        });
      });

      describe("type: Date", () => {
        it("should throw an error if min is not a date string", () => {
          const schema = {
            testProp: {
              type: Date,
              min: "aga"
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"min\" must be a valid date string");
        });

        it("should throw an error if max is not a date string", () => {
          const schema = {
            testProp: {
              type: Date,
              max: "aerg"
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"max\" must be a valid date string.");
        });

        it("should throw an error if min > max", () => {
          const schema = {
            testProp: {
              type: Date,
              min: "2020-01-02T12:00:00",
              max: "1975-01-01T12:00:00"
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: min constraint cannot be greater than max constraint.");
        });
      });

      describe("values array", () => {
        it("Should throw an error if values is not an array", () => {
          const schema = {
            testProp: {
              type: Number,
              values: null
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: property \"values\" must be an array.");
        });

        it("Should throw an error if values do not match type", () => {
          const schema = {
            testProp: {
              type: Number,
              values: [ 123, 456, "hello" ]
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property testProp: value for constraint \"values\" must be a number.");
        });
      });

      describe("validation function", () => {
        it("should fail validation if validate constraint is not a function", () => {
          const schema = {
            test: { 
              type: Array,
              ofType: Number,
              validate: null
            }
          };

          expect(() => vet(schema)).to.throw("Vet schema error for property test: value for constraint \"validate\" must be a function.");
        });
      });
    });

    describe("schema for sub-document", () => {
      it("should throw an error if schema property is missing", () => {
        const schema = {
          profile: { 
            type: Object
          }
        };

        expect(() => vet(schema)).to.throw("Vet schema error for property profile: when type is Object, property \"schema\" is required.");
      });

      it("should throw an error if schema property is null", () => {
        const schema = {
          profile: { 
            type: Object,
            schema: null
          }
        };

        expect(() => vet(schema)).to.throw("Vet schema error for property profile: Invalid schema definition, schema must be an object.");
      });

      it("should throw an error if schema property is an array", () => {
        const schema = {
          profile: { 
            type: Object,
            schema: []
          }
        };

        expect(() => vet(schema)).to.throw("Vet schema error for property profile: Invalid schema definition, schema must be an object.");
      });

      it("should throw an error if schema property is a string", () => {
        const schema = {
          profile: { 
            type: Object,
            schema: "blarg, whatever"
          }
        };

        expect(() => vet(schema)).to.throw("Vet schema error for property profile: Invalid schema definition, schema must be an object.");
      });

      it("should throw an error if default constraint is not null (default can only be null)", () => {
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

        expect(() => vet(schema)).to.throw("Vet schema error for property profile: when type is Object, property \"default\" may only have a value of null.");
      });
    });

    describe("Arrays", () => {
      it("should allow arrays of all basic types", () => {
        const schema = {
          bools: {
            type: Array,
            ofType: Boolean
          },
          numbers: {
            type: Array,
            ofType: Number
          },
          strings: {
            type: Array,
            ofType: String
          },
          dates: {
            type: Array,
            ofType: Date
          }
        };

        expect(() => vet(schema)).to.not.throw();
      });

      it("should throw an error if ofType property is missing", () => {
        const schema = {
          fibonacci: { 
            type: Array,
          }
        };

        expect(() => vet(schema)).to.throw("Vet schema error for property fibonacci: when type is Array, property \"ofType\" is required.");
      });

      it ("should allow ofType: Object, with a schema property", () => {
        const schema = {
          colors: { 
            type: Array,
            ofType: Object,
            schema: {
              r: Number,
              g: Number,
              b: Number
            }
          }
        };
  
        expect(() => vet(schema)).to.not.throw();
      });

      it ("should reject maxLength property if type is not number", () => {
        const schema = {
          primes: { 
            type: Array,
            ofType: Number,
            maxLength: true
          }
        };
  
        expect(() => vet(schema)).to.throw("Vet schema error for property primes: property \"maxLength\" must be a number.");
      });

      it ("should reject maxLength property if value < 0", () => {
        const schema = {
          primes: { 
            type: Array,
            ofType: Number,
            maxLength: -22
          }
        };
  
        expect(() => vet(schema)).to.throw("Vet schema error for property primes: property \"maxLength\" cannot be less than zero.");
      });

      it ("should reject minLength property if type is not number", () => {
        const schema = {
          primes: { 
            type: Array,
            ofType: Number,
            minLength: true
          }
        };
  
        expect(() => vet(schema)).to.throw("Vet schema error for property primes: property \"minLength\" must be a number.");
      });

      it ("should reject minLength property if value < 0", () => {
        const schema = {
          primes: { 
            type: Array,
            ofType: Number,
            minLength: -22
          }
        };
  
        expect(() => vet(schema)).to.throw("Vet schema error for property primes: property \"minLength\" cannot be less than zero.");
      });

      it ("should reject minLength if value > maxLength", () => {
        const schema = {
          primes: { 
            type: Array,
            ofType: Number,
            maxLength: 10,
            minLength: 11
          }
        };
  
        expect(() => vet(schema)).to.throw("Vet schema error for property primes: property \"minLength\" cannot be greater than maxLength.");
      });
    });
  });

  describe("validation for individual props", () => {
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
  
        expectZeroErrors(req.errors);
  
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
    
          expectZeroErrors(req.errors);
    
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
    
          expectZeroErrors(req.errors);
    
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
  
        expectZeroErrors(req.errors);
  
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
    
          expectZeroErrors(req.errors);
    
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
    
          expectZeroErrors(req.errors);
    
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

        it("should truncate a real number to an integer", () => {
          const schema = {
            intVal: {
              type: Number,
              trunc: true
            },
            floatVal: {
              type: Number,
              trunc: false
            },
            untouchedVal: {
              type: Number
            }
          };
    
          const body = {
            intVal: 3.14159,
            floatVal: 3.14159,
            untouchedVal: 3.14159
          };
    
          const req = buildState(schema, body);
    
          expectZeroErrors(req.errors);
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(3);
          expect(req.data.intVal).to.be.equal(3.0);
          expect(req.data.floatVal).to.be.equal(3.14159);
          expect(req.data.untouchedVal).to.be.equal(3.14159);
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
    
          expectZeroErrors(req.errors);
    
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
    
          expectZeroErrors(req.errors);
    
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

        expectZeroErrors(req.errors);

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
        it("should handle the toLowerCase property", () => {
          const schema = {
            test1: { 
              type: String,
              toLowerCase: true
            },
            test2: { 
              type: String,
              toLowerCase: false
            },
            test3: { 
              type: String
            }
          };

          const body = {
            test1: "AaBbCcDd",
            test2: "AaBbCcDd",
            test3: "AaBbCcDd"
          };
  
          const req = buildState(schema, body);
  
          expectZeroErrors(req.errors);
  
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(3);
          expect(req.data.test1).to.be.equal("aabbccdd");
          expect(req.data.test2).to.be.equal("AaBbCcDd");
          expect(req.data.test3).to.be.equal("AaBbCcDd");
        });

        it("should handle the toUpperCase property", () => {
          const schema = {
            test1: { 
              type: String,
              toUpperCase: true
            },
            test2: { 
              type: String,
              toUpperCase: false
            },
            test3: { 
              type: String
            }
          };

          const body = {
            test1: "AaBbCcDd",
            test2: "AaBbCcDd",
            test3: "AaBbCcDd"
          };
  
          const req = buildState(schema, body);
  
          expectZeroErrors(req.errors);
  
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(3);
          expect(req.data.test1).to.be.equal("AABBCCDD");
          expect(req.data.test2).to.be.equal("AaBbCcDd");
          expect(req.data.test3).to.be.equal("AaBbCcDd");
        });

        it("should handle the trim property", () => {
          const schema = {
            test1: { 
              type: String,
              trim: true
            },
            test2: { 
              type: String,
              trim: false
            },
            test3: { 
              type: String
            }
          };

          const body = {
            test1: "\t test\r\n ",
            test2: "\t test\r\n ",
            test3: "\t test\r\n ",
          };
  
          const req = buildState(schema, body);
  
          expectZeroErrors(req.errors);
  
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(3);
          expect(req.data.test1).to.be.equal("test");
          expect(req.data.test2).to.be.equal("\t test\r\n ");
          expect(req.data.test3).to.be.equal("\t test\r\n ");
        });

        it("should reject a string shorter than the minLength property", () => {
          const schema = {
            test: { 
              type: String,
              minLength: 10
            },
          };

          const body = {
            test: "Tom",
          };
  
          const req = buildState(schema, body);
  
          expect(req.errors.length).to.equal(1);
          expect(req.errors[0]).to.equal("Property \"test\" must be at least 10 characters long.")

          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("test")).to.be.false;
        });

        it("should reject a string longer than the maxLength property", () => {
          const schema = {
            test: { 
              type: String,
              maxLength: 10
            },
          };

          const body = {
            test: "The quick brown fox jumps over the lazy dogs.",
          };
  
          const req = buildState(schema, body);
  
          expect(req.errors.length).to.equal(1);
          expect(req.errors[0]).to.equal("Property \"test\" must be no more than 10 characters long.")

          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("test")).to.be.false;
        });

        it("should reject a string that does not match a regular expression", () => {
          const schema = {
            test: { 
              type: String,
              match: /^\d+$/
            },
          };

          const body = {
            test: "blarg",
          };
  
          const req = buildState(schema, body);
  
          expect(req.errors.length).to.equal(1);
          expect(req.errors[0]).to.equal("Value for property \"test\" is invalid.")

          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("test")).to.be.false;
        });

        it("should accept a string that matches a regular expression", () => {
          const schema = {
            test: { 
              type: String,
              match: /^\d+$/
            },
          };

          const body = {
            test: "12345",
          };
  
          const req = buildState(schema, body);
  
          expectZeroErrors(req.errors);
  
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(1);
          expect(req.data.test).to.be.equal("12345");
        });

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
  
          expectZeroErrors(req.errors);
  
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
    
        expectZeroErrors(req.errors);
  
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

      describe("With constraints", () => {
        it("should give an error for a date occurring before the min constraint", () => {
          const schema = {
            test: { 
              type: Date,
              min: "1980-01-01T00:00:00"
            }
          };
    
          const body = {
            test: "1977-01-01T12:00:00"
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(1);
          expect(req.errors[0]).to.equal("Value for property \"test\" cannot have date earlier than \"1980-01-01T00:00:00\".")
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("test")).to.be.false;
        });

        it("should give an error for a date occurring after max constraint", () => {
          const schema = {
            test: { 
              type: Date,
              max: "2100-01-01T00:00:00"
            }
          };
    
          const body = {
            test: "2101-01-01T12:00:00"
          }
    
          const req = buildState(schema, body);
    
          expect(req.errors.length).to.equal(1);
          expect(req.errors[0]).to.equal("Value for property \"test\" cannot have date later than \"2100-01-01T00:00:00\".")
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(0);
          expect(req.data.hasOwnProperty("test")).to.be.false;
        });

        it("should validate an date within the min and max values", () => {
          const schema = {
            test: { 
              type: Date,
              min: "1980-01-01T00:00:00",
              max: "2100-01-01T00:00:00"
            }
          };
    
          const body = {
            test: "2010-07-04T22:00:00"
          }
    
          const req = buildState(schema, body);
    
          expectZeroErrors(req.errors);
    
          expect(req.data).to.be.ok;
          expect(Object.keys(req.data).length).to.equal(1);
          expect(req.data.test).to.be.equal("2010-07-04T22:00:00");
        });
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
        expectZeroErrors(req.errors);
  
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
  
        expectZeroErrors(req.errors);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("profile")).to.be.false;
      });

      it("should use null if { default: null } was specified", () => {
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
  
        expectZeroErrors(req.errors);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("profile")).to.be.true;
        expect(req.data.profile).to.be.null;
      });

      it("should allow null for nested document", () => {
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
  
        expectZeroErrors(req.errors);
  
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
  
        expectZeroErrors(req.errors);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.fibonacci).to.be.ok;
        expect(req.data.hasOwnProperty("fibonacci")).to.be.true;
        for (let i in req.data.fibonacci) {
          expect(req.data.fibonacci[i]).to.equal(fibs[i]);
        }
      });

      it("should fail validation if array contains an element of the wrong type", () => {
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
        expectZeroErrors(req.errors);
  
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

      it("should allow null for array if no required constraint given", () => {
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
  
        expectZeroErrors(req.errors);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("fibonacci")).to.be.true;
        expect(req.data.fibonacci).to.be.null;
      });

      it("should validate a property that contains an array of objects", () => {
        const colors = [{ r: 255, g: 255, b: 255}, { r: 0, g: 0, b: 0 }];
        const schema = {
          colors: { 
            type: Array,
            ofType: Object,
            schema: {
              r: Number,
              g: Number,
              b: Number
            }
          }
        };
  
        const body = {
          colors: [...colors]
        };

        const req = buildState(schema, body);
  
        expectZeroErrors(req.errors);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("colors")).to.be.true;
        expect(req.data.colors).to.be.ok;
        expect(Array.isArray(req.data.colors)).to.be.true;
        expect(req.data.colors.length).to.equal(colors.length);
        for (let i = 0; i < req.data.colors.length; i++) {
          expect(req.data.colors[i].r).to.equal(colors[i].r);
          expect(req.data.colors[i].g).to.equal(colors[i].g);
          expect(req.data.colors[i].b).to.equal(colors[i].b);
        }
      });

      // it("should validate a property that contains an array of arrays (n-dimensional array)", () => {
      //   const cubeData = [
      //     [
      //       [1, 2, 3],
      //       [2, 4, 6],
      //       [3, 6, 9]
      //     ],
      //     [
      //       [2, 4, 6],
      //       [4, 8, 12],
      //       [3, 12, 18]
      //     ],
      //     [
      //       [3, 6, 9],
      //       [6, 12, 18],
      //       [9, 18, 27]
      //     ],
      //   ];

      //   const schema = {
      //     cube: { 
      //       type: Array,
      //       maxLength: 3,
      //       ofType: {
      //         type: Array,
      //         maxLength: 3,
      //         ofType: {
      //           type: Array,
      //           ofType: Number,
      //           maxLength: 3
      //         }
      //       }
      //     }
      //   };
  
      //   const body = {
      //     cube: [...cubeData]
      //   };

      //   const req = buildState(schema, body);

      //   expectZeroErrors(req.errors);
  
      //   expect(req.data).to.be.ok;
      //   expect(Object.keys(req.data).length).to.equal(1);
      //   expect(req.data.hasOwnProperty("cube")).to.be.true;
      //   expect(req.data.cube).to.be.ok;
      //   expect(Array.isArray(req.data.cube)).to.be.true;
      //   expect(req.data.cube.length).to.equal(cube.length);
      //   for (let i = 0; i < req.data.cube.length; i++) {
      //     expect(req.data.cube[i].length).to.equal(cubeData[i].length);
      //     for (let j = 0; j < req.data.cube[i].length; j++) {
      //       expect(req.data.cube[i][j].length).to.equal(cubeData[i][j].length);
      //       for (let k = 0; k < req.data.cube[i][j].length; k++) {
      //         expect(req.data.cube[i][j][k]).to.equal(cubeData[i][j][k]);
      //       }
      //     }
      //   }
      // });

      it("should fail validation if array longer than maxLength is given", () => {
        const schema = {
          primes: { 
            type: Array,
            ofType: Number,
            maxLength: 3
          }
        };
  
        const body = {
          primes: [2, 3, 5, 7, 11]
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"primes\" cannot have more than 3 elments in its array.")

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("primes")).to.be.false;
      });

      it("should fail validation if array shorter than minLength is given", () => {
        const schema = {
          primes: { 
            type: Array,
            ofType: Number,
            minLength: 10
          }
        };

        const body = {
          primes: [2, 3, 5, 7, 11]
        };

        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"primes\" must have at least 10 elments in its array.")

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("primes")).to.be.false;
      });

      it("should allow array size between minLength and maxLength", () => {
        const schema = {
          primes: { 
            type: Array,
            ofType: Number,
            minLength: 2,
            maxLength: 10
          }
        };

        const body = {
          primes: [2, 3, 5, 7, 11]
        };
  
        const req = buildState(schema, body);
  
        expectZeroErrors(req.errors);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("primes")).to.be.true;
        expect(req.data.primes.length).to.equal(5);
      });
    });

    describe("validation function", () => {
      it("should call function to validate input", () => {
        let called = false;
        const schema = {
          test: { 
            type: Array,
            ofType: Number,
            validate: (data) => {
              called = true;
              data.forEach(d => {
                if (d / 2 !== Math.trunc(d/2))
                  throw new Error("All values must be even.");
              });
            }
          }
        };
  
        const body = {
          test: [2, 4, 6, 8]
        };
  
        const req = buildState(schema, body);

        expectZeroErrors(req.errors);
  
        expect(called).to.be.true;
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("test")).to.be.true;
        expect(req.data.test.length).to.equal(4);
      });

      it("should catch an exception thrown by a validation fundtion and return it as an error", () => {
        let called = false;
        const schema = {
          test: { 
            type: Array,
            ofType: Number,
            validate: (data) => {
              called = true;
              data.forEach(d => {
                if (d / 2 !== Math.trunc(d/2))
                  throw new Error("All values must be even.");
              });
            }
          }
        };
  
        const body = {
          test: [2, 4, 5, 8]
        };
  
        const req = buildState(schema, body);

        expect(req.errors.length).to.equal(1);
        expect(req.errors[0]).to.equal("Property \"test\" has an invalid value. All values must be even.")

        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("test")).to.be.false;
      });

      it("Should allow validation function to return a mutated value", () => {
        let called = false;
        const schema = {
          test: { 
            type: String,
            validate: (data) => {
              called = true;
              return data.toUpperCase();
            }
          }
        };
  
        const body = {
          test: "lowercase"
        };
  
        const req = buildState(schema, body);

        expectZeroErrors(req.errors);
  
        expect(called).to.be.true;
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("test")).to.be.true;
        expect(req.data.test).to.equal("LOWERCASE");
      });

      it("Should perform validation LAST, after all other validation", () => {
        let called = false;
        const schema = {
          test: { 
            type: String,
            validate: (data) => {
              called = true;
              if (data !== data.toUpperCase()) {
                throw new Error("value should be upper case.");
              }
            },
            toUpperCase: true
          }
        };
  
        const body = {
          test: "lowercase"
        };
  
        const req = buildState(schema, body);

        expectZeroErrors(req.errors);
  
        expect(called).to.be.true;
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(1);
        expect(req.data.hasOwnProperty("test")).to.be.true;
        expect(req.data.test).to.equal("LOWERCASE");
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
  
        expectZeroErrors(req.errors);
  
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
  
        expectZeroErrors(req.errors);
  
        expect(req.data).to.be.ok;
        expect(Object.keys(req.data).length).to.equal(0);
        expect(req.data.hasOwnProperty("isVeteran")).to.be.false;
        expect(req.data.hasOwnProperty("isMale")).to.be.false;
      });
    });
  });

  describe("Vet options", () => {
    it("should auto-respond with 400 if validation fails", () => {
      const schema = {
        isVeteran: Boolean,
        isMale: Boolean
      };

      const body = {
        isVeteran: "blarg",
        isMale: 123
      };

      const [mockReq, mockRes] = buildMountedMiddleware(schema, body);
    
      expect(mockRes.finalResponse.status).to.equal(400);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.badRequest);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });

    it("should auto-respond with 400 options.autoRespond=true", () => {
      const schema = {
        isVeteran: Boolean,
        isMale: Boolean
      };

      const body = {
        isVeteran: "blarg",
        isMale: 123
      };

      const options = {
        autoRespond: true
      };

      const [mockReq, mockRes] = buildMountedMiddleware(schema, body, options);
    
      expect(mockRes.finalResponse.status).to.equal(400);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.badRequest);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });

    it("should set reason phrase if failMsg is set", () => {
      const schema = {
        isVeteran: Boolean,
        isMale: Boolean
      };

      const body = {
        isVeteran: "blarg",
        isMale: 123
      };

      const options = {
        failMsg: "There was a failure"
      };

      const [mockReq, mockRes] = buildMountedMiddleware(schema, body, options);
    
      expect(mockRes.finalResponse.status).to.equal(400);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal("There was a failure");
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });

    it("should not auto-respond if options.autoRespond=false", () => {
      const schema = {
        isVeteran: Boolean,
        isMale: Boolean
      };

      const body = {
        isVeteran: "blarg",
        isMale: 123
      };

      const options = {
        autoRespond: false
      };

      const [mockReq, mockRes] = buildMountedMiddleware(schema, body, options);
    
      expect(mockRes.finalResponse.status).to.be.undefined;
      expect(mockRes.finalResponse.body).to.be.undefined;
      expect(mockReq.errors.length).to.equal(2);
      expect(mockReq.errors[0]).to.equal("Property \"isVeteran\" must be either true or false.")
      expect(mockReq.errors[1]).to.equal("Property \"isMale\" must be either true or false.")
    });
  });
});
