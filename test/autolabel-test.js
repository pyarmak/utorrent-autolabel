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
    let log = sinon.spy();
    global.logger = {debug: log, info: log, error: log, warn: log};
    watch = path = fs = util = nt = escRegex = utorrent = notify = {};
    utorrent.setCredentials = sinon.spy();
    mockery.registerMock('utorrent-api', sinon.stub().returns(utorrent));
    mockery.registerMock('watch', watch);
    mockery.registerMock('libnotify-ffi', notify);
    mockery.registerMock('nt', nt);
    mockery.registerMock('./util', util);
    mockery.registerMock('fs', fs);
    mockery.registerMock('path', path);
    mockery.registerMock('escape-string-regexp', escRegex);
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

describe('_processFile', () => {
    beforeEach(() => {
        path.basename = sinon.stub().returns('test.torrent');
        nt.read = sinon.stub();
    });

    it('should try to read parse the file if it ends with .torrent', () => {
        autolabel._processFile('test');

        assert(nt.read.calledOnce);
    });

    describe('called with valid torrent', () => {
        beforeEach(() => {
            nt.read.yields(null, 'test');
            sinon.stub(autolabel, '_matchLabel');
        });

        it('should should try to add the torrent if a matching label is found', () => {
            sinon.stub(autolabel, '_addTorrent');
            autolabel._matchLabel.returns('testLabel');

            autolabel._processFile('test');

            assert(autolabel._matchLabel.calledOnce);
            assert(autolabel._addTorrent.calledOnce);
        });

        it('should attempt to notify if a label could not be matched', () => {
            util.getTorrentName = sinon.stub();
            autolabel._matchLabel.returns(null);
            sinon.stub(autolabel, '_notify');

            autolabel._processFile('test');

            assert(autolabel._notify.calledOnce);
        });
    });
});