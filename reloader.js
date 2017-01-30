'use strict'

const reload = require('require-reload')(require)
const fs = require('fs')

const updates = {}
const modules = {}

function reloadIfUpdated(name) {
    /* eslint-disable no-sync */
    const mtime = fs.statSync(name).mtime.getTime()
    if(!updates[name] || updates[name] < mtime) {
        updates[name] = mtime
        modules[name] = reload(name)
    }
    return modules[name]
}

module.exports = reloadIfUpdated
