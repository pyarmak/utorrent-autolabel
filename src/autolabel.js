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
        this.utorrent = new Client(this.config.get('host'), this.config.get('port'));
        this.utorrent.setCredentials(this.config.get('username'), this.config.get('password'));
    }

    start() {
        this.watch.createMonitor(this.config.get('directory'), (monitor) => {
            monitor.on('created', (file) => {
                this._processFile(file);
            });
        });
    }

    _processFile(file) {
        const self = this;
        const filename = self.path.basename(file);
        if (filename.substr(filename.length - 8) == '.torrent') {
            this.nt.read(file, (err, torrent) => {
                if (err) throw err;
                let label = self._matchLabel(torrent);
                if (!label) {
                    let message = 'Torrent <b>' + self.Util.getTorrentName(torrent) + '</b> was <b>not</b> added because a label could not be automatically assigned.';
                    this._notify('Torrent not added!', message);
                    return self.logger.warn('Could not automatically assign label to torrent ' + filename + '. Skipping...');
                }
                this._addTorrent(file, torrent);
            });
        }
    }

    _addTorrent(file, torrent) {
        this.fs.readFile(file, (error, data) => {
            if (error) return this.logger.error(error);
            this.utorrent.call('add-file', {'torrent_file': data}, (err, res) => {
                if (err) return this.logger.error(err);
                let message = 'Torrent <b>' + this.Util.getTorrentName(torrent) + '</b> was added to the <b>' + label + '</b> label.';
                this._notify('Torrent added', message);
                this.logger.info('Setting the torrent label to ' + label);
                this.utorrent.call('setprops',
                    {'hash': torrent.infoHash(), 's': 'label', 'v': label},
                    (err, res) => {
                        if (err) return this.logger.error(err);
                        this.fs.unlink(file);
                    });
            });
        });
    }

    _notify(title, message) {
        if (!this.notify) return;
        self.libnotify.createNotification({
            summary: title,
            body: message
        }).push();
    }

    _matchLabel(torrent) {
        let trackers = this.Util.getTrackers(torrent);
        let labels = this.config.get('labels');
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
