'use strict';

/* global describe, it, before, beforeEach, after, afterEach */

const assert = require('assert');
const sinon = require('sinon');
const Autolabel = require('../src/autolabel');
const mockery = require('mockery');
var autolabel, watch, path, fs, util, nt, escRegex, utorrent, notify;

before(() => {
    mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false
    });
});

after(() => {
    mockery.disable();
});

beforeEach(() => {
    global.config = {get: sinon.stub(), set: sinon.spy()};
    watch = utorrent = notify = {};
    utorrent.setCredentials = sinon.spy();
    mockery.registerMock('utorrent-api', sinon.stub().returns(utorrent));
    mockery.registerMock('watch', watch);
    mockery.registerMock('libnotify-ffi', notify);
    autolabel = new Autolabel(false);
});

describe('start', () => {
    it('should call _processFile on any newly created files within the given directory', () => {
        let monitor = {on: sinon.stub().yields('testFile')};
        watch.createMonitor = sinon.stub().yields(monitor);
        global.config.get.returns('testDirectory');
        sinon.stub(autolabel, '_processFile');

        autolabel.start();

        assert.equal(watch.createMonitor.getCall(0).args[0], 'testDirectory');
        assert.equal(monitor.on.getCall(0).args[0], 'created');
        assert.equal(autolabel._processFile.getCall(0).args[0], 'testFile');
    });
});