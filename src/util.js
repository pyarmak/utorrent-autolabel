'use strict';

class Util {
    static mergeTagProperties(label_name, property, value) {
        if (typeof label_name === 'undefined') return global.logger.error('Label name is undefined');
        else if (typeof value === 'undefined') return global.logger.error('Value to add is undefined');
        let target = {name: label_name};
        let labels = global.config.get('labels');
        if (!Array.isArray(labels)) {
            labels = [target];
        } else {
            for (let i = 0; i < labels.length; i++) {
                if (labels[i].name === label_name) {
                    target = labels[i];
                    break;
                }
            }
        }
        if (!target.hasOwnProperty(property)) target[property] = [];
        target[property].push(value);
        global.config.set('labels', labels);
    }

    static saveOptions(defaults, argv) {
        Object.keys(defaults).forEach((option) => {
            if (argv[option]) global.config.set(option, argv[option]);
        });
    }

    static getTrackers(torrent) {
        if (!torrent.hasOwnProperty('metadata')) return [];
        if (!torrent.metadata.hasOwnProperty('announce-list')) return [torrent.metadata.announce];
        return Util._flatten(torrent.metadata['announce-list']);
    }

    static getTorrentName(torrent) {
        if (!torrent.hasOwnProperty('metadata')) return '';
        return torrent.metadata.info.name;
    }

    static addLabel(label) {
        let labels = (Array.isArray(global.config.get('labels'))) ? global.config.get('labels') : [];
        labels.push({name: label});
        global.config.set('labels', labels);
    }

    static removeLabel(label) {
        let labels = global.config.get('labels');
        for (let i = 0; i < labels.length; i++) {
            if (labels[i].name === label) {
                labels.splice(i, 1);
                break;
            }
        }
        global.config.set('labels', labels);
    }

    static listLabels() {
        let labels = global.config.get('labels');
        if (labels.length === 0) console.log("There are no labels currently set.");
        else labels.forEach((label) => {
            console.log(label.name);
        });
    }

    static _flatten(subject, res) {
        if (!res) res = [];
        if (typeof subject === "object" && Array.isArray(subject)) {
            subject.forEach(function (el) {
                Util._flatten(el, res);
            });
        } else res.push(subject);
        return res;
    }
}

module.exports = Util;
