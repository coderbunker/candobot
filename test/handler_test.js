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

var sayValue = null
function say(msg) {
    sayValue = msg
}

describe('handler', function() {
    beforeEach(function () {
        sayValue = null
    })

    it('handles multiple class and storage', function() {
        const data = {tickets: {lastId: 0}}

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

    it('non-whitelisted room is ignored', function() {
        const message = createWeChatyMessage(
            'Ricky',
            'no valid test room',
            'cando please add ticket',
            () => {
                throw new Error('should not be called')
            })
        handler(config, {tickets: {lastId: 0}}, message)
    })

    it('room with prefix is accepted', function() {
        const message = createWeChatyMessage(
            'Ricky',
            'CANDO testing',
            'cando please add ticket',
            say)
        handler(config, {tickets: {lastId: 0}}, message)
        assert.equal(sayValue, '#cando: will add ticket (ticket #1)')
    })

    it('room with prefix in name is rejected if ignoreName is true', function(done) {
        const message = createWeChatyMessage(
            'Ricky',
            'CANDO testing',
            'cando please add ticket',
            done)
        handler({
            ignoreName: true,
            prefix: 'cando',
        }, {tickets: {lastId: 0}}, message)
        done()
    })

    it('when sent to self, messages are always accepted', function() {
        const message = createWeChatyMessage(
            'Ricky',
            'self',
            'please add ticket',
            say)
        handler(config, {tickets: {lastId: 0}}, message)
         assert.equal(sayValue, '#cando: will add ticket (ticket #1)')
    })
})
