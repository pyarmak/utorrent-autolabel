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

    _processFile(file) {
        const filename = this.path.basename(file);
        if (filename.substr(filename.length - 8) !== '.torrent') global.logger.debug(`File '${filename}' is not a torrent. Skipping...`);
        global.logger.debug(`Found a torrent file: ${filename}. Processing...`);
        this.nt.read(file, (err, torrent) => {
            if (err) return global.logger.error(err);
            let label = this._matchLabel(torrent);
            if (!label) {
                let message = 'Torrent <b>' + this.Util.getTorrentName(torrent) + '</b> was <b>not</b> added because a label could not be automatically assigned.';
                this._notify('Torrent not added!', message);
                return global.logger.warn('Could not automatically assign label to torrent ' + filename + '. Skipping...');
            }
            global.logger.debug(`Matched the torrent file with rules for label: ${label}. Adding...`);
            this._addTorrent(file, torrent);
        });
    }

    _addTorrent(file, torrent) {
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

    _notify(title, message) {
        if (!this.notify) return;
        this.libnotify.createNotification({
            summary: title,
            body: message
        }).push();
    }

    _matchLabel(torrent) {
        let trackers = this.Util.getTrackers(torrent);
        let labels = global.config.get('labels');
        for (let i = 0; i < labels.length; i++) {
            let label = labels[i];
            for (let j = 0; j < label.trackers.length; j++) {
                let match = trackers.find((tracker) => {
                    let regex = this.escapeStringRegexp(label.trackers[j]);
                    return new RegExp(regex).test(tracker);
                });
                if (match) return label.name;
            }
        }
        return null;
    }
}

module.exports = Autolabel;
