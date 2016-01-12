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

describe('saveOptions', () => {
    it('should save any provided option if it is present in defaults', () => {
        global.config = {set: sinon.spy()};

        Util.saveOptions({k1: 'v1', k2: 'v2'}, {k1: 'v3'});

        let call = global.config.set.getCall(0);
        assert.equal(call.args[0], 'k1');
        assert.equal(call.args[1], 'v3');
    });
});

describe('getTrackers', () => {
    var torrent, trackers;

    it('should return an empty array if the torrent does not have metadata', () => {
        torrent = {};

        trackers = Util.getTrackers(torrent);

        assert.deepEqual(trackers, []);
    });

    it('should return the announce url if no announce-list field is present', () => {
        torrent = {metadata: {announce: 'test.org'}};

        trackers = Util.getTrackers(torrent);

        assert.deepEqual(trackers, ['test.org']);
    });

    it('should return a flattened announce-list if it is present', () => {
        torrent = {metadata: {'announce-list': [['test.org'], 'test.com']}};

        trackers = Util.getTrackers(torrent);

        assert.deepEqual(trackers, ['test.org', 'test.com']);
    });
});

describe('getTorrentName', () => {
    it('should return the torrent name if metadata is present', () => {
        let torrent = {metadata: {info: {name: 'testTorrent'}}};

        let name = Util.getTorrentName(torrent);

        assert.equal(name, 'testTorrent');
    });
});

describe('addLabel', () => {
    it('should add label to labels array', () => {
        global.config = {get: sinon.stub().returns([{name: 'L1'}]), set: sinon.spy()};

        Util.addLabel('L2');

        assert.deepEqual(global.config.set.getCall(0).args[1], [{name: 'L1'}, {name: 'L2'}]);
    });
});

describe('removeLabel', () => {
    it('should remove the label from the labels array', () => {
        global.config = {get: sinon.stub().returns([{name: 'L1'}, {name: 'L2'}]), set: sinon.spy()};

        Util.removeLabel('L1');

        assert.deepEqual(global.config.set.getCall(0).args[1], [{name: 'L2'}]);
    });
});

describe('listLabels', () => {
    beforeEach(() => {
        sinon.stub(console, 'log');
    });

    afterEach(() => {
        console.log.restore();
    });

    it('should print out all the labels', () => {
        global.config = {get: sinon.stub().returns([{name: 'L1'}])};

        Util.listLabels();

        assert(console.log.calledWithExactly('L1'));
    });

    it('should print out message if there are no labels', () => {
        global.config = {get: sinon.stub().returns('undefined')};

        Util.listLabels();

        assert(console.log.calledOnce);
    });
});