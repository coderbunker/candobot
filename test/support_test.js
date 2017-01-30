'use strict'

const support = require('../support')
const assert = require('chai').assert

const sample = {
    content: 'please get markers',
    prefix: 'candra',
    roomName: 'MyRoom',
    userName: 'Ricky',
}

const tickets = {
    '1': {
        assignee: null,
        closed: null,
        content: 'content',
        id: 1,
        requester: 'Ricky',
        roomName: 'MyRoom',
        status: 'open',
    },
    lastId: 1,
}

function copy(sampleObject) {
    return JSON.parse(JSON.stringify(sampleObject))
}

function message(content) {
    const msg = copy(sample)
    msg.content = content
    return msg
}

describe('support', function() {
    it('ping', function() {
        const reply = support.process(tickets, message(''))
        assert.equal(reply, '#candra: Yes Ricky?')
    })

    it('close', function() {
        const reply = support.process(tickets, message('close #1'))
        assert.equal(reply, '#candra: ticket #1 is closed')
    })

    it('debug', function() {
        const reply = support.process(tickets, message('debug'))
        assert.deepEqual(JSON.parse(reply.slice('#candra: '.length)), tickets)
    })

    it('invalid', function() {
        const reply = support.process(tickets, message('handsome'))
        assert.equal(reply, '#candra: I don\'t understand: handsome, can you try again?')
    })

    it('help', function() {
        const reply = support.process(tickets, message('help'))
        assert.isTrue(reply.indexOf('please') != -1)
    })

    it('forget it', function() {
        const reply = support.process(tickets, message('forget it'))
        assert.equal(reply, '#candra: deleted 1 tickets')
        assert.equal(tickets.lastId, 0)
    })

    it('gimme a compliment', function() {
        const reply = support.process(tickets, message('gimme a compliment'))
        assert.equal(reply.substr(-1, 1), '.')
    })

    it('gimme something that does not exist', function() {
        const reply = support.process(tickets, message('gimme a unknown'))
        assert.isTrue(reply.endsWith('can you try again?'))
    })
})
