'use strict'

const reload = require('require-reload')(require)
const fs = require('fs')

const updates = {}
const modules = {}

function reloadIfUpdated(name) {
    const mtime = fs.statSync(name).mtime.getTime()
    if(!updates[name] || updates[name] < mtime) {
        console.log(`RELOADING ${name}`)
        updates[name] = mtime
        modules[name] = reload(name)
    }
    return modules[name]
}

module.exports = reloadIfUpdated