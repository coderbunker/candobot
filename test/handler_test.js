'use strict'

const handler = require('../handler')
const assert = require('chai').assert
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

/* eslint-disable no-sync */
const TEST_FILE = tmp.tmpNameSync()

const config = {
    'management': 'Agora - management',
    'prefix': 'cando',
    'processor': './support.js',
    'store': TEST_FILE,
    'whitelisted': [
        'test room'
    ],
}


describe('handler', function() {
    it('handles multiple class and storage', function() {
        const data = {}
        var sayValue = null
        function say(msg) {
            sayValue = msg
        }
        const message = createWeChatyMessage(
            'Ricky',
            'test room',
            'cando please add ticket',
            say)

        // First ticket
        handler(config, data, message)
        assert.equal(sayValue, '#cando: will add ticket (ticket #1)')
        assert.instanceOf(data.tickets['1'], Object)

        // Second ticket
        handler(config, data, message)
        assert.equal(sayValue, '#cando: will add ticket (ticket #2)')
        assert.equal(data.tickets.lastId, 2)
        assert.instanceOf(data.tickets['2'], Object)
    })
})
