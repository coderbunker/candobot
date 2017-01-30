'use strict'

const handler = require('../handler')
const assert = require('assert')
const tmp = require('tmp');

/* eslint-disable max-params */
function createWeChatyMessage(fromName, roomTopic, content, say) {
    return {
        content: () => content,
        from: () => ({
            name: () => fromName,
            say: say,
        }),
        room: () => ({
            say: say,
            topic: () => roomTopic,
        }),
    }
}

const TEST_FILE = tmp.fileSync().name

const config = {
    'management': 'Agora - management',
    'prefix': 'candra',
    'processor': './support.js',
    'store': TEST_FILE,
    'whitelisted': [
        'test room'
    ],
}


describe('handler', function() {
    it('reloads if file is updated', function(done) {
        const data = {}
        function say(message) {
            assert.equal(message, '#candra: will add ticket (ticket #1)')
            done()
        }
        const message = createWeChatyMessage(
            'Ricky',
            'test room',
            'candra please add ticket',
            say)
        handler(config, data, message)
    })
})
