'use strict';

class Autolabel {
    constructor(config) {
        this.config = config;
        this.watch = require('watch');
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
                const filename = this.path.basename(file);
                this._processFile(filename);
            });
        });
    }

    _processFile(filename) {
        if(filename.substr(filename.length - 8) == '.torrent') {
            this.nt.read('/home/pavel/Code/utorrent-autolabel/test.torrent', (err, torrent) => {
                if(err) throw err;
                let label = this._matchLabel(torrent);
                console.log(label);
            });
        }
    }

    _matchLabel(torrent) {
        let trackers = this.Util.getTrackers(torrent);
        let labels = this.config.get('labels');
        for(let i = 0; i < labels.length; i++) {
            let label = labels[i];
            for(let j = 0; j < label.trackers.length; j++) {
                let match = trackers.find((tracker) => {
                    let regex = this.escapeStringRegexp(label.trackers[j]);
                    return new RegExp(regex).test(tracker);
                });
                if(match) return label.name;
            }
        }
        return null;
    }
}

module.exports = Autolabel;

//watch.createMonitor('/home/pavel/Downloads', function (monitor) {
//    monitor.on("created", function (f, stat) {
//        var filename = path.basename(f);
//        console.log(filename);
//        if(filename.substr(filename.length - 8) == '.torrent') {
//            nt.read(f, function(err, torrent) {
//                if(err) throw err;
//                console.log('Info hash:', torrent.infoHash());
//                //console.log('Metadata:', torrent.metadata);
//                if(torrent.metadata.hasOwnProperty('announce')) {
//                    var tracker = torrent.metadata.announce;
//                    if(tracker.indexOf('broadcasthe.net') > -1 ||
//                            tracker.indexOf('landof.tv') > -1) {
//                        console.log("[info] found TV torrent");
//                        fs.readFile(f, function(error, data) {
//                            utorrent.call('add-file', {'torrent_file': data}, function(err, data) {
//                                if(err) { console.log(err); return; }
//                                console.log(data);
//                                utorrent.call('setprops',
//                                        {'hash': torrent.infoHash(), 's': 'label', 'v': 'TV'},
//                                        function(err, data) {
//                                            if(err) {console.log(err); return; }
//                                            console.log(data);
//                                            fs.unlink(f);
//                                        });
//                            });
//                        });
//                    }
//                }
//            });
//        }
//    });
//});

