'use strict';

class Util {
    static mergeTagProperties(config, label_name, property, value) {
        if(typeof label_name !== 'undefined' && typeof value !== 'undefined') {
            let target = { name: label_name };
            let labels = config.get('labels');
            if(!Array.isArray(labels)) {
                labels = [target];
            } else {
                for(let i = 0; i < labels.length; i++) {
                    if(labels[i].name === label_name) {
                        target = labels[i];
                        break;
                    }
                }
            }
            if(!target.hasOwnProperty(property)) target[property] = [];
            target[property].push(value);
            config.set('labels', labels);
        }
    }

    static saveOptions(defaults, argv, config) {
        Object.keys(defaults).forEach((option) => {
            if(argv[option]) config.set(option, argv[option]);
        });
    }

    static getTrackers(torrent) {
        if (!torrent.hasOwnProperty('metadata')) return [];
        if (!torrent.metadata.hasOwnProperty('announce-list')) return torrent.metadata.announce;
        return flatten(torrent.metadata['announce-list']);
    }
}

function flatten(subject, res) {
    if (!res) res = [];

    if (typeof subject === "object" && Array.isArray(subject)) {
        subject.forEach(function(el) {
            flatten(el, res);
        });
    } else res.push(subject);

    return res;
}

module.exports = Util;
