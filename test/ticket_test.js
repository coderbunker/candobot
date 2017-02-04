'use strict'

const ticket = require('../ticket')
const assert = require('chai').assert

describe('ticket', function() {
    it('delete', function() {
        const tickets = {
            '1': {
            }
        }
        ticket.forgetTicket(tickets, '1')
        assert.isUndefined(tickets['1'])
        assert.throw(function() {
            ticket.forgetTicket(tickets, '1')
        }, 'Not found')
    })

    it('showTicket minimal', () => {
        const result = ticket.showTicket({id: 2})
        assert.equal(result, '#2: ?? >> ??')
    })

    it('filterTickets single-criteria AND', () => {
        const tickets = {
            '1': {
                roomName: 'hello'
            },
            '2': {
                roomName: 'world'
            }
        }
        const helloTickets = ticket.filterTicketsAnd(tickets, {roomName: 'hello'})
        assert.deepEqual(helloTickets, [tickets['1']])
        const worldTickets = ticket.filterTicketsAnd(tickets, {roomName: 'world'})
        assert.deepEqual(worldTickets, [tickets['2']])
    })

    it('filterTickets multi-criteria AND', () => {
        const tickets = {
            '1': {
                assignee: 'Ricky',
                roomName: 'hello'
            }
        }
        const filteredTickets = ticket.filterTicketsAnd(tickets, {
            assignee: 'Ricky',
            roomName: 'hello'
        })
        assert.deepEqual(filteredTickets, [tickets['1']])
    })

    it('filterTickets multi-criteria OR', () => {
        const tickets = {
            '1': {
                assignee: 'Ricky',
                roomName: 'thisRoom'
            },
            '2': {
                assignee: 'Fred',
                roomName: 'otherRoom'
            }
        }
        const filteredTickets = ticket.filterTicketsOr(tickets, {
            assignee: 'Ricky',
            roomName: 'otherRoom'
        })
        assert.deepEqual(filteredTickets, [tickets['1'], tickets['2']])
    })

    it('filterTickets multi-criteria AND undefined ignored', () => {
        const tickets = {
            '1': {
                assignee: 'Ricky',
                roomName: 'thisRoom'
            },
            '2': {
                assignee: 'Ricky',
                roomName: 'otherRoom'
            }
        }
        const filteredTickets = ticket.filterTicketsAnd(tickets, {
            assignee: 'Ricky',
            roomName: undefined
        })
        assert.deepEqual(filteredTickets, [tickets['1'], tickets['2']])
    })

    it('userNameFilter', function() {
        const tickets = {
            '1': {
                'assignee': 'Ricky',
            },
            '2': {
                'requester': 'Ricky',
            },
            '3': {
                'assignee': 'Ricky',
                'requester': 'Ricky'
            },
            '4': {
                'assignee': 'Dmitry',
                'requester': 'Ricky'
            },
            '5': {
                'assignee': 'Ricky',
                'requester': 'Dmitry'
            },
            '6': {
                'assignee': 'Dmitry',
                'requester': 'Fred'
            },
        }
        const results = ticket.userNameFilter(tickets, 'ricky')
        assert.deepEqual(results, [tickets[1], tickets[2], tickets[3], tickets[4], tickets[5]])
        const results2 = ticket.userNameFilter(tickets, 'dmitry')
        assert.deepEqual(results2, [tickets[4], tickets[5], tickets[6]])
    })
})
