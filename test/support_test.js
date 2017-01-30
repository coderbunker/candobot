'use strict'

const support = require('../support')
const assert = require('chai').assert
const tmp = require('tmp');

const sample = {
    content: 'please get markers',
    prefix: 'candra',
    roomName: 'MyRoom',
    userName: 'Ricky',
}

function oneTicket() {
    return {
        '1': {
            assignee: null,
            closed: null,
            content: 'content',
            id: '1',
            requester: 'Ricky',
            roomName: 'MyRoom',
            status: 'open',
        },
        lastId: 1,
    }
}

function twoTickets() {
    return {
        '1': {
            assignee: null,
            closed: null,
            content: 'content',
            id: '1',
            requester: 'Ricky',
            roomName: 'MyRoom',
            status: 'open',
        },
        '2': {
            assignee: null,
            closed: null,
            content: 'content',
            id: '2',
            requester: 'Dmitry',
            roomName: 'MyRoom',
            status: 'open',
        },
        lastId: 2,
    }
}


function copy(sampleObject) {
    return JSON.parse(JSON.stringify(sampleObject))
}

function message(content) {
    const msg = copy(sample)
    msg.content = content
    return msg
}

/* eslint-disable no-sync */
const TEST_FILE = tmp.fileSync().name

describe('support', function() {
    it('ping', function() {
        const reply = support.process(oneTicket(), message(''))
        assert.equal(reply, '#candra: Yes Ricky?')
    })

    it('close', function() {
        const reply = support.process(oneTicket(), message('close #1'))
        assert.equal(reply, '#candra: ticket #1 is closed')
    })

    it('debug', function() {
        const tickets = oneTicket()
        const reply = support.process(tickets, message('debug'))
        assert.deepEqual(JSON.parse(reply.slice('#candra: '.length)), tickets)
    })

    it('invalid', function() {
        const reply = support.process(oneTicket(), message('handsome'))
        assert.equal(reply, '#candra: I don\'t understand: handsome, can you try again?')
    })

    it('help', function() {
        const reply = support.process(oneTicket(), message('help'))
        assert.isTrue(reply.indexOf('please') != -1)
    })

    it('forget it', function() {
        const tickets = oneTicket()
        const reply = support.process(tickets, message('forget it'))
        assert.equal(reply, '#candra: deleted 1 tickets')
        assert.equal(tickets.lastId, 0)
    })

    it('gimme a compliment', function() {
        const reply = support.process({}, message('gimme a compliment'))
        assert.match(reply, /[\.!?)]$/)
    })

    it('gimme something that does not exist', function() {
        const reply = support.process({}, message('gimme a unknown'))
        assert.equal(reply, "I don't know how to give you unknown!")
    })

    it('load and store working', function() {
        support.store(TEST_FILE, {var: 4})
        assert.equal(support.load(TEST_FILE).var, 4)
    })

    it('TODO empty', function() {
        const reply = support.process({}, message('todo'))
        assert.equal(reply, '#candra: nothing TODO!')
    })

    it('TODO with ticket specific mine', function() {
        const reply = support.process(twoTickets(), message('mine'))
        assert.match(reply, /ticket #1/)
        assert.notMatch(reply, /ticket #2/)
    })

    it('TODO with ticket specific other user', function() {
        const reply = support.process(twoTickets(), message('TODO dmitry'))
        assert.notMatch(reply, /ticket #1/)
        assert.match(reply, /ticket #2/)
    })

    it('Add comment to ticket', function() {
        const reply = support.process(oneTicket(), message('ticket #1 do not forget to get different colors'))
        assert.match(reply, /ticket #1/)
        assert.match(reply, /do not forget to get different colors/)
    })
})
