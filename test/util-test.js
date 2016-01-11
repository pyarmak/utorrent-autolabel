'use strict';

/* global describe, it, before, beforeEach, after, afterEach */

const assert = require('assert');
const sinon = require('sinon');
const Util = require('../src/util');

describe('mergeTagProperties', function () {
    it('should set new tag property if it did not exist before', function () {
        global.config = {get: sinon.stub().returns({}), set: sinon.spy()};
        Util.mergeTagProperties('TestLabel', 'trackers', 'fake.com');

        assert.deepEqual(config.set.getCall(0).args[1], [{name: 'TestLabel', trackers: ['fake.com']}]);
    });

    it('should merge tag properties if there were pre-existing ones', function () {
        global.config = {get: sinon.stub().returns([{name: 'TV', trackers: ['test.org']}]), set: sinon.spy()};
        Util.mergeTagProperties('TV', 'trackers', 'second.com');

        assert.deepEqual(config.set.getCall(0).args[1], [{name: 'TV', trackers: ['test.org', 'second.com']}]);
    });
});