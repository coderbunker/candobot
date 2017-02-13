'use strict'

const support = require('../support')
const assert = require('chai').assert
const tmp = require('tmp')

const sample = {
    content: 'please get markers',
    prefix: 'cando',
    roomName: 'MyRoom',
    userName: 'Ricky',
}

function oneTicket() {
    return {
        tickets: {
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
}

function twoTickets() {
    return {
        tickets: {
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
}

function threeTickets() {
    return {
        tickets: {
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
            '3': {
                assignee: 'Ricky',
                closed: null,
                content: 'content',
                id: '3',
                requester: 'Dmitry',
                roomName: 'OtherRoom',
                status: 'open',
            },
            lastId: 3,
        }
    }
}
function emptyData() {
    return {
        tickets: {
            lastId: 0
        }
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
        assert.equal(reply, '#cando: Yes Ricky? Ask me for help if you need me.')
    })

    it('close', function() {
        const reply = support.process(oneTicket(), message('close #1'))
        assert.equal(reply, '#cando: ticket #1 is closed')
    })

    it('debug', function() {
        const data = oneTicket()
        const reply = support.process(data, message('debug'))
        assert.deepEqual(JSON.parse(reply.slice('#cando: '.length)), data.tickets)
    })

    it('invalid', function() {
        const reply = support.process(oneTicket(), message('handsome'))
        assert.equal(reply, '#cando: I don\'t understand: "handsome". Can you try again?')
    })

    it('help', function() {
        const reply = support.process(oneTicket(), message('help'))
        assert.isTrue(reply.indexOf('please') != -1)
    })

    it('forget it', function() {
        const data = oneTicket()
        const reply = support.process(data, message('forget #1'))
        assert.equal(reply, '#cando: deleted ticket #1')
        assert.equal(data.tickets.lastId, 1)
    })

    it('gimme a compliment', function() {
        const data = emptyData()
        data.fs = {
            existsSync: () => true,
            readFileSync: () => 'compliment\ncompliment\n'
        }
        const reply = support.process(data, message('gimme a compliment'))
        assert.equal(reply, '#cando: Ricky here have a compliment')
    })

    it('gimme high five', function() {
        const reply = support.process(emptyData(), message('gimme high five'))
        assert.equal(reply, '#cando: ヘ( ^o^)ノ＼(^_^ )')
    })

    it('gimme something that does not exist', function() {
        const data = emptyData()
        data.fs = {
            existsSync: () => false
        }
        const reply = support.process(data, message('gimme a unknown'))
        assert.equal(reply, "I don't know how to give you unknown!")
    })

    it('load and store working', function() {
        support.store(TEST_FILE, {lastId: 4})
        assert.equal(support.load(TEST_FILE).lastId, 4)
    })

    it('TODO empty', function() {
        const reply = support.process(emptyData(), message('todo'))
        assert.equal(reply, '#cando: nothing TODO!')
    })

    it('TODO with ticket specific mine', function() {
        const reply = support.process(twoTickets(), message('mine'))
        assert.match(reply, /#1: Ricky/)
        assert.notMatch(reply, /#2/)
    })

    it('TODO with ticket specific other user', function() {
        const reply = support.process(twoTickets(), message('TODO dmitry'))
        assert.notMatch(reply, /#1/)
        assert.match(reply, /#2/)
    })

    it('Add comment to ticket', function() {
        const reply = support.process(oneTicket(), message('ticket #1 do not forget to get different colors'))
        assert.match(reply, /#1/)
        assert.match(reply, /do not forget to get different colors/)
    })

    it('generic question', function() {
        const reply = support.process(oneTicket(), message('why are you so bad?'))
        assert.match(reply, /I don't understand the question/)
    })

    it('TODO excludes other rooms ticket', function() {
        const reply = support.process(threeTickets(), message('todo'))
        assert.match(reply, /#1/)
        assert.match(reply, /#2/)
        assert.notMatch(reply, /#3/)
    })

    it('inventory', function() {
        const data = emptyData()
        data.fs = {
            existsSync: () => true,
            readFileSync: () => 'Chouffe\nBudweiser\n'
        }
        const reply = support.process(data, message('what beer you got?'))
        assert.equal(reply, '#cando: \nChouffe\nBudweiser')
    })

    it('what event', function() {
        const data = emptyData()
        data.fs = {
            existsSync: () => true,
            readFileSync: () => 'event1\nevent2\n'
        }
        const reply = support.process(data, message('What events will there be at the bunker?'))
        assert.equal(reply, '#cando: \nevent1\nevent2')
    })
})
