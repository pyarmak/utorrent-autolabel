'use strict';

const Configstore = require('configstore');
const pkg = require('../package.json');
const fs = require('fs');
const path = require('path');
const logger = require('winston');
const defaults = {
    host: 'localhost',
    port: 8080,
    username: 'admin',
    password: '',
    directory: __dirname
};
const config = new Configstore(pkg.name, defaults);
const Autolabel = require('./autolabel');
const Util = require('./util');
const argv = require('yargs')
    .demand(1)
    .usage('Usage: $0 <command> [options]')
    .count('verbose')
    .boolean('s')
    .boolean('n')
    .boolean('i')
    .alias('v', 'verbose')
    .alias('n', 'notify')
    .alias('d', 'directory')
    .alias('s', 'save')
    .alias('i', 'insensitive') // TODO: use this option when we regex in Autolabel._matchLabel
    .describe('d', 'Directory to watch for torrent files')
    .describe('s', 'Save the provided options (used with start command)')
    .describe('n', 'Enable libnotify based desktop notifications')
    .describe('v', 'Print more output')
    .command('start', 'Start monitoring for, sorting, and labeling torrents')
    .command('set-options', 'Save the provided options')
    .command('add-label', 'Add the given label')
    .command('remove-label', 'Remove the given label')
    .command('list-labels', 'Print the currently defined labels')
    .command('add-tracker', 'Add the given tracker (can be partial) to the given label')
    .command('add-pattern', 'Add the given pattern to the given label')
    .command('remove-tracker', 'Remove the given tracker from the given label')
    .command('remove-pattern', 'Remove the given pattern from the given label')
    .command('scan', 'Run a one time scan of the watched directory')
    .epilogue('Created by Pavel Yarmak')
    .argv;

const command = argv._[0];
const VERBOSE_LEVEL = argv.verbose;

if (VERBOSE_LEVEL >= 2) logger.level = 'debug';
else if (VERBOSE_LEVEL >= 1) logger.level = 'verbose';
else logger.level = 'info';

global.config = config;
global.logger = logger;

switch (command) {
    case 'start':
        if (argv.s) Util.saveOptions(defaults, argv);
        new Autolabel(argv.n).start();
        break;
    case 'set-options':
        Util.saveOptions(defaults, argv);
        break;
    case 'add-label':
        if (typeof argv._[1] === 'undefined') logger.error('No label was provided');
        else Util.addLabel(argv._[1]);
        break;
    case 'remove-label':
        if (typeof argv._[1] === 'undefined') logger.error('No label was provided');
        else Util.removeLabel(argv._[1]);
        break;
    case 'list-labels':
        Util.listLabels();
        break;
    case 'add-tracker':
        Util.mergeTagProperties(argv._[1], 'trackers', argv._[2]);
        break;
    case 'remove-tracker':
        Util.removeTagProperty(argv._[1], 'trackers', argv._[2]);
        break;
    case 'add-pattern':
        Util.mergeTagProperties(argv._[1], 'patterns', argv._[2]);
        break;
    case 'remove-pattern':
        Util.removeTagProperty(argv._[1], 'patterns', argv._[2]);
        break;
    case 'scan':
        if (argv.s) Util.saveOptions(defaults, argv);
        new Autolabel(argv.n).scan();
        break;
}
