/* eslint-disable no-sync */

'use strict'

const reloader = require('../reloader')
const assert = require('assert')
const fs = require('fs')
const tmp = require('tmp');

const TEST_FILE = tmp.fileSync().name

describe('reload reloads', function() {
    it('reloads if file is updated', function() {
        fs.writeFileSync(TEST_FILE, 'module.exports = () => { return 42 }')
        assert(reloader(TEST_FILE)(), 42)
        fs.writeFileSync(TEST_FILE, 'module.exports = () => { return 19 }')
        assert(reloader(TEST_FILE)(), 19)
    })

    it('doesn\'t reload if the mtime is the same', function() {
        fs.writeFileSync(TEST_FILE, 'module.exports = () => { return 42 }')
        const stats = fs.statSync(TEST_FILE)
        assert(reloader(TEST_FILE)(), 42)
        fs.writeFileSync(TEST_FILE, 'module.exports = () => { return 19 }')
        fs.utimesSync(TEST_FILE, stats.atime.getTime(), stats.mtime.getTime())
        assert(reloader(TEST_FILE)(), 42)
    })
})
