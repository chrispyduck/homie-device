import { expect } from "chai";
import * as faker from "faker";
import _ from "lodash";
import { IHomieDeviceConfiguration } from "../src/HomieDevice";
import { IHomieNodeConfiguration } from "../src/HomieNode";
import HomieProperty, { DefaultConfiguration as DefaultPropertyConfiguration, IHomiePropertyConfiguration, PropertyDataType } from "../src/HomieProperty";
import { IHomieNodeTest, makeNode } from "./2-HomieNode";

export const makePropertyConfig = (config?: IHomiePropertyConfiguration): IHomiePropertyConfiguration => {
  return _.merge({}, DefaultPropertyConfiguration, {
    datatype: faker.random.arrayElement([
      PropertyDataType.boolean,
      PropertyDataType.color,
      PropertyDataType.enum,
      PropertyDataType.float,
      PropertyDataType.integer,
      PropertyDataType.string,
    ]),
    format: faker.random.alphaNumeric(),
    friendlyName: faker.name.jobDescriptor(),
    name: faker.name.firstName(),
    settable: faker.random.boolean(),
    unit: faker.random.alphaNumeric(2),
  }, config);
};
export interface IHomiePropertyTest extends IHomieNodeTest {
  property: HomieProperty;
  propertyConfig: IHomiePropertyConfiguration;
}

export const makeProperty = (args: {
  deviceConfig?: IHomieDeviceConfiguration,
  nodeConfig?: IHomieNodeConfiguration,
  propertyConfig?: IHomiePropertyConfiguration,
} = {}): IHomiePropertyTest => {
  const test = makeNode(args) as IHomiePropertyTest;
  const config = makePropertyConfig(args.propertyConfig);
  test.property = test.node.addProperty(config);
  test.propertyConfig = config;
  return test;
};

describe("Homie Property (non-indexed)", () => {

  it("Create non-settable property", () => {
    const test = makeProperty({
      propertyConfig: {
        settable: false,
      } as unknown as IHomiePropertyConfiguration,
    });
    expect(test.property).to.be.an.instanceOf(HomieProperty);
    expect(test.property).to.have.property("name").to.equal(test.propertyConfig.name);
    expect(test.property).to.have.property("friendlyName").to.equal(test.propertyConfig.friendlyName);
    expect(test.property).to.have.property("datatype").to.equal(test.propertyConfig.dataType);
    expect(test.property).to.have.property("settable").to.equal(false);
    expect(() => test.property.invokeSetter({ isRange: false }, "123")).to.throw();
    expect(() => test.property.invokeSetter({ isRange: true, index: 2 }, "123")).to.throw();
  });

  it("Create settable property", () => {
    const test = makeProperty({
      propertyConfig: {
        settable: true,
      } as unknown as IHomiePropertyConfiguration,
    });
    expect(test.property).to.be.an.instanceOf(HomieProperty);
    expect(test.property).to.have.property("name").to.equal(test.propertyConfig.name);
    expect(test.property).to.have.property("friendlyName").to.equal(test.propertyConfig.friendlyName);
    expect(test.property).to.have.property("datatype").to.equal(test.propertyConfig.dataType);
    expect(test.property).to.have.property("settable").to.equal(true);
    expect(() => test.property.invokeSetter({ isRange: false }, "123")).to.not.throw();
    expect(() => test.property.invokeSetter({ isRange: true, index: 5 }, "123")).to.not.throw();
  });

  describe("Settable properies", () => {
    let test: IHomiePropertyTest;

    afterEach(() => {
      if (test.device.isConnected) {
        test.device.end();
      }
    });

    it("raises set event when invokeSetter is called", (done) => {
      test = makeProperty({
        propertyConfig: {
          settable: true,
        } as unknown as IHomiePropertyConfiguration,
      });
      const testSetValue = faker.random.alphaNumeric(15);
      test.property.on("set", (args: { range: { isRange: boolean, index?: number }, value: string | null }) => {
        expect(args.value).to.equal(testSetValue);
        expect(args.range).to.have.property("isRange").equal(false);
        done();
      });
      test.property.invokeSetter({ isRange: false }, testSetValue);
    });

    it("raises set event when device receives $set message", (done) => {
      test = makeProperty({
        propertyConfig: {
          settable: true,
        } as unknown as IHomiePropertyConfiguration,
      });
      const testSetValue = faker.random.alphaNumeric(15);
      test.property.on("set", (args: { range: { isRange: boolean, index?: number }, value: string | null }) => {
        expect(args.value).to.equal(testSetValue);
        expect(args.range).to.have.property("isRange").equal(false);
        done();
      });
      test.device.setup();
      if (test.mqtt === undefined) {
        throw new Error("mqtt mock not defined. this is a bug in the test. you probably forgot to call test.device.setup()");
      }
      test.mqtt.emit("message", `homie/${test.deviceConfig.name}/${test.nodeConfig.name}/${test.propertyConfig.name}/set`, testSetValue);
    });

    // todo: range property setters
  });

});

describe("Homie Property (indexed)", () => {

  it("Create non-settable property", () => {
    const test = makeProperty({
      nodeConfig: { startRange: 0, endRange: 3, isRange: true } as unknown as IHomieNodeConfiguration,
      propertyConfig: {
        settable: false,
      } as unknown as IHomiePropertyConfiguration,
    });
    expect(test.property).to.be.an.instanceOf(HomieProperty);
    expect(test.property).to.have.property("name").to.equal(test.propertyConfig.name);
    expect(test.property).to.have.property("friendlyName").to.equal(test.propertyConfig.friendlyName);
    expect(test.property).to.have.property("datatype").to.equal(test.propertyConfig.dataType);
    expect(test.property).to.have.property("settable").to.equal(false);
    expect(() => test.property.invokeSetter({ isRange: false }, "123")).to.throw();
    expect(() => test.property.invokeSetter({ isRange: true, index: 2 }, "123")).to.throw();
  });

  it("Create settable property", () => {
    const test = makeProperty({
      nodeConfig: { startRange: 0, endRange: 6, isRange: true } as unknown as IHomieNodeConfiguration,
      propertyConfig: {
        settable: true,
      } as unknown as IHomiePropertyConfiguration,
    });
    expect(test.property).to.be.an.instanceOf(HomieProperty);
    expect(test.property).to.have.property("name").to.equal(test.propertyConfig.name);
    expect(test.property).to.have.property("friendlyName").to.equal(test.propertyConfig.friendlyName);
    expect(test.property).to.have.property("datatype").to.equal(test.propertyConfig.dataType);
    expect(test.property).to.have.property("settable").to.equal(true);
    expect(() => test.property.invokeSetter({ isRange: false }, "123")).to.not.throw();
    expect(() => test.property.invokeSetter({ isRange: true, index: 5 }, "123")).to.not.throw();
  });

  describe("Settable properies", () => {
    let test: IHomiePropertyTest;

    afterEach(() => {
      if (test.device.isConnected) {
        test.device.end();
      }
    });

    it("raises set event when invokeSetter is called", (done) => {
      test = makeProperty({
        nodeConfig: { startRange: 0, endRange: 5, isRange: true } as unknown as IHomieNodeConfiguration,
        propertyConfig: {
          settable: true,
        } as unknown as IHomiePropertyConfiguration,
      });
      const testSetValue = faker.random.alphaNumeric(15);
      test.property.on("set", (args: { range: { isRange: boolean, index?: number }, value: string | null }) => {
        expect(args.value).to.equal(testSetValue);
        expect(args.range).to.have.property("isRange").equal(true);
        expect(args.range).to.have.property("index").equal(3);
        done();
      });
      test.property.invokeSetter({ isRange: true, index: 3 }, testSetValue);
    });

    it("raises set event when device receives $set message", (done) => {
      const index = 3;
      test = makeProperty({
        nodeConfig: { startRange: 0, endRange: 5, isRange: true } as unknown as IHomieNodeConfiguration,
        propertyConfig: {
          settable: true,
        } as unknown as IHomiePropertyConfiguration,
      });
      const testSetValue = faker.random.alphaNumeric(15);
      test.property.on("set", (args: { range: { isRange: boolean, index?: number }, value: string | null }) => {
        expect(args.value).to.equal(testSetValue);
        expect(args.range).to.have.property("isRange").equal(true);
        expect(args.range).to.have.property("index").equal(index);
        done();
      });
      test.device.setup();
      if (test.mqtt === undefined) {
        throw new Error("mqtt mock not defined. this is a bug in the test. you probably forgot to call test.device.setup()");
      }
      
      test.mqtt.emit("message", `homie/${test.deviceConfig.name}/${test.nodeConfig.name}_${index}/${test.propertyConfig.name}/set`, testSetValue);
    });

    // todo: range property setters
  });

});
