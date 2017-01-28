const support = require('../support')
const assert = require('chai').assert

const sample = {
    content: 'please get markers', 
    prefix: 'candra', 
    userName: 'Ricky',
    roomName: 'MyRoom'
}

const tickets = {
    lastId: 1,
    "1": {
        requester: 'Ricky',
        content: 'content',
        roomName: 'MyRoom',
        id: 1,
        status: 'open',
        assignee: null, 
        closed: null
    }
}

function copy(sample) {
    return JSON.parse(JSON.stringify(sample))
}

function message(content) {
    const message = copy(sample)
    message.content = content
    return message
}

describe("support", function() {
    it("ping", function() {
        const reply = support.process(tickets, message(''))
        assert.equal(reply, '#candra: Yes Ricky?')
    })

    it("close", function() {
        const reply = support.process(tickets, message('close #1'))
        assert.equal(reply, '#candra: ticket #1 is closed')
    })

    it("debug", function() {
        const reply = support.process(tickets, message('debug'))
        assert.deepEqual(JSON.parse(reply.slice('#candra: '.length)), tickets)
    })

    it("invalid", function() {
        const reply = support.process(tickets, message('handsome'))
        assert.equal(reply, "#candra: I don't understand: handsome, can you try again?")
    })

    it("help", function() {
        const reply = support.process(tickets, message('help'))
        assert.isTrue(reply.indexOf("please") != -1)
    })

    it("forget it", function() {
        const reply = support.process(tickets, message('forget it'))
        assert.equal(tickets.lastId, 0)
    })

    it("gimme a compliment", function() {
        const reply = support.process(tickets, message('gimme a compliment'))
        assert.equal(reply.substr(-1, 1), '.')
    })
})