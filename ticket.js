'use strict'

function TicketError(message) {
  this.name = 'TicketError';
  this.message = message || 'Ticketing error';
  this.stack = (new Error()).stack;
}
TicketError.prototype = Object.create(Error.prototype);
TicketError.prototype.constructor = TicketError;

const Sample = {
    assignee: null,
    closed: null,
    comments: [],
    content: null,
    created: null,
    id: null,
    requester: null,
    roomName: null,
    status: 'open',
}

function createTicket() {
    return JSON.parse(JSON.stringify(Sample))
}

function findTicket(tickets, id) {
    if(!id) {
        throw new TicketError('Invalid id')
    }
    if(!tickets[id]) {
        throw new TicketError(`Not found: #${id}`)
    }
    return tickets[id]
}

function closeTicket(tickets, id) {
    const ticket = findTicket(tickets, id)
    ticket.status = 'closed'
    ticket.closed = Date.now()
    return ticket
}

function openTicket(tickets, message, content) {
    const newTicket = createTicket()
    tickets.lastId += 1
    newTicket.id = `${tickets.lastId}`
    newTicket.created = new Date()
    newTicket.content = content
    newTicket.roomName = message.roomName
    newTicket.requester = message.userName
    tickets[newTicket.id] = newTicket
    return tickets[newTicket.id]
}

function formatNull(value) {
    return value ? value : '??'
}

function showTicket(ticket) {
    var main = `#${ticket.id}: ${formatNull(ticket.requester)} >> ${formatNull(ticket.assignee)}`
    if(ticket.roomName) {
        main += ` (${ticket.roomName})`
    }
    if(ticket.content) {
        main += `\n${ticket.content}`
    }
    if(ticket.comments && ticket.comments.length) {
        main += ' -- '
        main += ticket.comments.join('; ')
    }

    return main
}

function compareUserName(userA, userB) {
    if(!userA || !userB) {
        return false
    }
    return userA.toLowerCase().startsWith(userB.toLowerCase())
}

function showTickets(tickets) {
    if(tickets.length == 0) {
        return 'nothing TODO!'
    }
    var output = '\n'
    for(var ticket of tickets) {
        output += `${showTicket(ticket)}\n\n`
    }
    return output
}

function userNameFilter(tickets, username) {
    return filterTicketsOr(tickets, {
        'assignee': compareUserName.bind(null, username),
        'requester': compareUserName.bind(null, username),
    })
}

function testCondition(field, expectedValue, value) {
    if(expectedValue === undefined) {
        return true
    }
    if(expectedValue instanceof Function) {
        return expectedValue(value[field])
    }
    if(expectedValue === value[field]) {
        return true
    }
    return false
}

function ensureArray(tickets) {
    if(tickets instanceof Array) {
        return tickets
    }
    if(tickets instanceof Object) {
        return Object.values(tickets)
    }
    throw new TicketError('only accept Object and Array')
}

function filterTicketsAnd(tickets, conditions) {
    const ticketsArray = ensureArray(tickets)
    return ticketsArray
        .filter((entry) => {
            const foundMismatch = Object
                .entries(conditions)
                .find((condition) => !testCondition(
                    condition[0], condition[1], entry))
            return foundMismatch == undefined
    })
}

function filterTicketsOr(tickets, conditions) {
    const ticketsArray = ensureArray(tickets)
    return ticketsArray
        .filter((entry) => {
            const foundMatch = Object
                .entries(conditions)
                .find((condition) => testCondition(
                    condition[0], condition[1], entry))
            return foundMatch != undefined
        })
}

function forget(tickets) {
    if(!tickets.lastId) {
        return 'nothing to remove!'
    }
    const lastId = tickets.lastId
    for(var i = 1; i <= tickets.lastId; i++) {
       delete tickets[i]
    }
    tickets.lastId = 0
    return lastId
}

function forgetTicket(tickets, id) {
    findTicket(tickets, id)
    delete tickets[id]
    return id
}

function assign(tickets, id, assignee) {
     const ticket = findTicket(tickets, id)
     ticket.assignee = assignee
     return ticket
}

function addComment(ticket, comment) {
    if(!(ticket.comments instanceof Array)) {
        ticket.comments = []
    }
    ticket.comments.push(comment)
    return showTicket(ticket)
}

function createTickets() {
    return {
        lastId: 0
    }
}

function isValidTickets(tickets) {
    if(!tickets) {
        return false
    }
    if(!(tickets instanceof Object)) {
        return false
    }
    if(!Number.isInteger(tickets.lastId)) {
        return false
    }
    return true
}

function store(fs, storePath, tickets) {
    if(!isValidTickets(tickets)) {
        throw new TicketError(`refusing to write invalid data: ${JSON.stringify(tickets)}`)
    }
    /* eslint-disable no-sync */
    fs.writeFileSync(storePath, JSON.stringify(tickets, null, 4))
}

function load(fs, storePath) {
    /* eslint-disable no-sync */
    if(fs.existsSync(storePath)) {
        /* eslint-disable no-sync */
        const datastore = fs.readFileSync(storePath).toString()
        try {
            const tickets = JSON.parse(datastore)
            if(!isValidTickets(tickets)) {
                throw new TicketError(`does not contain valid data: ${storePath}`)
            }
            return tickets
        } catch(e) {
            if(e instanceof SyntaxError) {
                throw new TicketError(`invalid content of file: ${storePath}`)
            } else {
                throw e
            }
        }
    }
    return createTickets()
}

module.exports = {
    TicketError,
    addComment,
    assign,
    closeTicket,
    compareUserName,
    createTicket,
    createTickets,
    filterTicketsAnd,
    filterTicketsOr,
    findTicket,
    forget,
    forgetTicket,
    isValidTickets,
    load,
    openTicket,
    showTicket,
    showTickets,
    store,
    userNameFilter,
}
