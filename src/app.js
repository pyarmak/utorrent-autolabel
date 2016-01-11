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
    .alias('v', 'verbose')
    .boolean('s')
    .alias('d', 'directory')
    .describe('d', 'Directory to watch for torrent files')
    .alias('s', 'save')
    .describe('s', 'Saves the options you provide')
    .command('start', 'Start monitoring for, sorting, and labeling torrents')
    .argv;
const command = argv._[0];
const VERBOSE_LEVEL = argv.verbose;

if(VERBOSE_LEVEL >= 2) logger.level = 'debug';
else if(VERBOSE_LEVEL >= 1) logger.level = 'info';
else logger.level = 'warn';

switch(command) {
    case 'start':
        if(argv.s) Util.saveOptions(defaults, argv, config);
        new Autolabel(config, logger).start();
        break;
    case 'set-options':
        Util.saveOptions(defaults, argv, config);
        break;
    case 'add-label':
        if(typeof argv._[1] !== 'undefined') {
            let labels = (Array.isArray(config.get('labels'))) ? config.get('labels') : [];
            labels.push({ name: argv._[1] });
            config.set('labels', labels);
        }
        break;
    case 'remove-label':
        if(typeof argv._[1] !== 'undefined') {
            let labels = config.get('labels');
            for(let i = 0; i < labels.length; i++) {
                if(labels[i].name === argv._[1]) {
                    labels.splice(i, 1);
                    break;
                }
            }
            config.set('labels', labels);
        }
        break;
    case 'list-labels':
        let labels = config.get('labels');
        if(labels.length === 0) console.log("There are no labels currently set.");
        else labels.forEach((label) => { console.log(label.name); });
        break;
    case 'add-tracker':
        Util.mergeTagProperties(config, argv._[1], 'trackers', argv._[2]);
        break;
    case 'add-pattern':
        Util.mergeTagProperties(config, argv._[1], 'patterns', argv._[2]);
        break;
}

