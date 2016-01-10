'use strict';

/* global describe, it, before, beforeEach, after, afterEach */

const assert = require('assert');
const sinon  = require('sinon');
const Util   = require('../src/util');
var config;

describe('mergeTagProperties', function() {
    it('should set new tag property if it did not exist before', function() {
        config = { get: sinon.stub().returns({}), set: sinon.spy() };
        Util.mergeTagProperties(config, 'TestLabel', 'trackers', 'fake.com');

        assert.deepEqual(config.set.getCall(0).args[1], [{ name: 'TestLabel', trackers: [ 'fake.com' ] }]);
    });

    it('should merge tag properties if there were pre-existing ones', function() {
        config = { get: sinon.stub().returns([{ name: 'TV', trackers: ['test.org'] }]), set: sinon.spy() };
        Util.mergeTagProperties(config, 'TV', 'trackers', 'second.com');

        assert.deepEqual(config.set.getCall(0).args[1], [{ name: 'TV', trackers: ['test.org', 'second.com'] }]);
    });
});