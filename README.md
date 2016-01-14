#μTorrent Auto-label
[![Build Status](https://travis-ci.org/pyarmak/utorrent-autolabel.svg)](https://travis-ci.org/pyarmak/utorrent-autolabel) [![Coverage Status](https://coveralls.io/repos/pyarmak/utorrent-autolabel/badge.svg?branch=master&service=github)](https://coveralls.io/github/pyarmak/utorrent-autolabel?branch=master)

Pre-requisites:
- utorrent web gui must be running
- optional: libnotify for desktop notifications

Basic usage:
```
Usage: app.js <command> [options]

Commands:
  start           Start monitoring for, sorting, and labeling torrents
  set-options     Save the provided options
  add-label       Add the given label
  remove-label    Remove the given label
  list-labels     Print the currently defined labels
  add-tracker     Add the given tracker (can be partial) to the given label
  add-pattern     Add the given pattern to the given label
  remove-tracker  Remove the given tracker from the given label
  remove-pattern  Remove the given pattern from the given label
  scan            Run a one time scan of the watched directory

Options:
  -d, --directory  Directory to watch for torrent files
  -h, --hostname   Hostname (or ip) on which the utorrent web gui is running
  -p, --port       Port on which the utorrent web gui is running
  -u, --username   Username for the utorrent web gui
  -w, --password   Password for the utorrent web gui
  -s, --save       Save the provided options (used with start command) [boolean]
  -n, --notify     Enable libnotify based desktop notifications        [boolean]
  -v, --verbose    Print more output                                     [count]

Created by Pavel Yarmak

```
