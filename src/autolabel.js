'use strict';

class Autolabel {
    constructor(notify) {
        this.notify = notify;
        this.watch = require('watch');
        this.libnotify = require('libnotify-ffi');
        this.path = require('path');
        this.fs = require('fs');
        this.nt = require('nt');
        this.Util = require('./util');
        this.escapeStringRegexp = require('escape-string-regexp');
        const Client = require('utorrent-api');
        this.utorrent = new Client(global.config.get('host'), global.config.get('port'));
        this.utorrent.setCredentials(global.config.get('username'), global.config.get('password'));
    }

    start() {
        this.watch.createMonitor(global.config.get('directory'), (monitor) => {
            monitor.on('created', (file) => {
                global.logger.debug(`Found a new file: ${file}`);
                this._processFile(file);
            });
        });
    }

    scan() {
        let dir = global.config.get('directory');
        this.fs.readdir(dir, (err, files) => {
            if (err) return global.logger.error(err);
            files.forEach((file) => {
                global.logger.debug(`Processing file: ${file}`);
                this._processFile(this.path.join(dir, file));
            });
        });
    }

    _processFile(file) {
        const filename = this.path.basename(file);
        if (this.path.extname(filename) !== '.torrent') return global.logger.debug(`File '${filename}' is not a torrent. Skipping...`);
        global.logger.debug(`Found a torrent file: ${filename}. Processing...`);
        this.nt.read(file, (err, torrent) => {
            if (err) return global.logger.error(err);
            var label = this._matchLabel(torrent);
            if (!label) {
                let message = 'Torrent <b>' + this.Util.getTorrentName(torrent) + '</b> was <b>not</b> added because a label could not be automatically assigned.<br>' +
                    'Choose a label below or ignore to skip:';
                let actions = {};
                let labels = global.config.get('labels');
                labels.forEach((label) => {
                    let name = label.name;
                    actions[name] = {
                        label: name,
                        callback: () => {
                            this._addTorrent(file, torrent, name);
                        }
                    }
                });
                this._notify('Torrent not added!', message, actions);
                return global.logger.warn('Could not automatically assign label to torrent ' + filename + '.');
            }
            global.logger.debug(`Matched the torrent file with rules for label: ${label}. Adding...`);
            this._addTorrent(file, torrent, label);
        });
    }

    _addTorrent(file, torrent, label) {
        this.fs.readFile(file, (error, data) => {
            if (error) return global.logger.error(error);
            this.utorrent.call('add-file', {'torrent_file': data}, (err, res) => {
                if (err) return global.logger.error(err);
                let message = 'Torrent <b>' + this.Util.getTorrentName(torrent) + '</b> was added to the <b>' + label + '</b> label.';
                this._notify('Torrent added', message);
                global.logger.info('Setting the torrent label to ' + label);
                this.utorrent.call('setprops',
                    {'hash': torrent.infoHash(), 's': 'label', 'v': label},
                    (err, res) => {
                        if (err) return global.logger.error(err);
                        this.fs.unlink(file);
                    });
            });
        });
    }

    _notify(title, message, actions) {
        if (!this.notify) return;
        if (!actions) actions = {};
        this.libnotify.createNotification({
            summary: title,
            body: message,
            actions: actions
        }).push();
    }

    _matchLabel(torrent) {
        let trackers = this.Util.getTrackers(torrent);
        let labels = global.config.get('labels');
        for (let label of labels) {
            if (Array.isArray(label.trackers)) {
                for (let cur_tracker of label.trackers) {
                    let tracker_match = trackers.find((tracker) => {
                        let tracker_regex = this.escapeStringRegexp(cur_tracker);
                        return new RegExp(tracker_regex).test(tracker);
                    });
                    if (tracker_match) return label.name;
                }
            }
            if (Array.isArray(label.patterns)) {
                let name = this.Util.getTorrentName(torrent);
                let name_match = label.patterns.find((pattern) => {
                    let name_regex = this.escapeStringRegexp(pattern);
                    return new RegExp(name_regex, 'i').test(name);
                });
                if (name_match) return label.name;
            }
        }
        return null;
    }
}

module.exports = Autolabel;
