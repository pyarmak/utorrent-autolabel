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
    watch = path = fs = util = nt = utorrent = notify = {};
    utorrent.setCredentials = sinon.spy();
    mockery.registerMock('utorrent-api', sinon.stub().returns(utorrent));
    mockery.registerMock('watch', watch);
    mockery.registerMock('libnotify-ffi', notify);
    mockery.registerMock('nt', nt);
    mockery.registerMock('./util', util);
    mockery.registerMock('fs', fs);
    mockery.registerMock('path', path);
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

describe('_addTorrent', () => {
    beforeEach(() => {
        fs.readFile = sinon.stub();
        utorrent.call = sinon.stub();
        sinon.stub(autolabel, '_notify');
    });

    it('should read in the file', () => {
        autolabel._addTorrent('test', {}, 'label');

        assert.equal(fs.readFile.getCall(0).args[0], 'test');
    });

    describe('adding a torrent', () => {
        beforeEach(() => {
            fs.readFile.yields(null, 'data');
        });

        it('should add the file to utorrent', () => {
            autolabel._addTorrent('test', {}, 'label');

            assert.equal(utorrent.call.getCall(0).args[0], 'add-file');
        });

        describe('after having added the torrent', () => {
            beforeEach(() => {
                util.getTorrentName = sinon.spy();
                utorrent.call.yields(null);
                fs.unlink = sinon.spy();
            });

            it('should try to notify about adding the torrent', () => {
                autolabel._addTorrent('test', {infoHash: sinon.spy()}, 'label');

                assert(autolabel._notify.calledOnce);
            });

            it('should label the torrent properly', () => {
                autolabel._addTorrent('test', {infoHash: sinon.spy()}, 'label');

                assert.equal(utorrent.call.getCall(1).args[0], 'setprops');
            });

            it('should remove the torrent file', () => {
                autolabel._addTorrent('test', {infoHash: sinon.spy()}, 'label');

                assert(fs.unlink.calledOnce);
            });
        });
    });
});

describe('_notify', () => {
    it('should send a send a notification if the setting is enabled', () => {
        autolabel.notify = true;
        notify.push = sinon.spy();
        notify.createNotification = sinon.stub().returns(notify);

        autolabel._notify('test', 'message');

        assert(notify.createNotification.calledOnce);
        assert(notify.push.calledOnce);
    });
});

describe('_matchLabel', () => {
    beforeEach(() => {
        util.getTrackers = sinon.stub();
    });

    afterEach(() => {
        mockery.deregisterAll();
    });

    it('should return null if no labels were matched', () => {
        util.getTrackers.returns([]);
        global.config.get.returns([]);

        let res = autolabel._matchLabel({});

        assert.equal(res, null);
    });

    it('should return the matching label if one is found', () => {
        util.getTrackers.returns(['test.org']);
        global.config.get.returns([{name: 'testLabel', trackers: ['test.org']}]);
        escRegex = sinon.stub().returns("test\.org");
        mockery.registerMock('escape-string-regexp', escRegex);

        let res = autolabel._matchLabel({});

        assert.equal(res, 'testLabel');
    });

    it('should return the matching label if torrent name matches one of the label patterns', () => {
        util.getTrackers.returns(['test.org']);
        global.config.get.returns([{name: 'testLabel', trackers: [], patterns: ['test']}]);
        util.getTorrentName = sinon.stub().returns('torrentTestName');
        escRegex = sinon.stub().returns("test");
        mockery.registerMock('escape-string-regexp', escRegex);

        let res = autolabel._matchLabel({});

        assert.equal(res, 'testLabel');
    });
});