'use strict';

/* global describe, it, before, beforeEach, after, afterEach */

const assert = require('assert');
const sinon = require('sinon');
const Autolabel = require('../src/autolabel');
const mockery = require('mockery');
var autolabel, watch, path, fs, util, nt, escRegex, utorrent;

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
    watch = {};
    utorrent = {};
    mockery.registerMock('utorrent-api', sinon.stub().returns(utorrent));
    mockery.registerMock('watch', watch);
    autolabel = new Autolabel(false);
});

describe('start', () => {
    it('should start monitoring the directory', () => {
        watch.createMonitor = sinon.spy();
        global.config.get.returns('test');

        autolabel.start();

        assert.equal(watch.createMonitor.getCall(0).args[0], 'test');
    });
});