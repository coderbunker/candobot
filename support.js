'use strict'

const fs = require('fs')
const path = require('path')

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

const actions = [
{
    action: (_tickets, _message) => 'DEFAULT ACTION',
    regexp: /^$/i,
    reply: (message, _output) => `Yes ${message.userName}?`,
},
{
    action: (_tickets, _message) => help(),
    regexp: /help/i,
    reply: (message, output) => `\n${output}`,
},
{
    action: (tickets, _message, id) => closeTicket(tickets, id),
    regexp: /close #?([0-9]*)/i,
    reply: (message, output) => `ticket #${output.id} is closed`,
},
{
    action: (tickets, message, content) =>
        openTicket(tickets, message, content),
    regexp: /please (.*)/i,
    reply: (message, output) => `will ${output.content} (ticket #${output.id})`,
},
{
    action: (tickets, _message, id) => findTicket(tickets, id),
    regexp: /show #?([0-9]*)/i,
    reply: (message, output) => showTicket(output),
},
{
    /* eslint-disable max-params */
    action: (tickets, _m, id, comment) => [findTicket(tickets, id), comment],
    regexp: /ticket #?([0-9]*) (.*)$/i,
    reply: (message, output) => addComment(output[0], output[1]),
},
{
    action: (tickets, message, id) => assign(tickets, id, message.userName),
    regexp: /take #?([0-9]*)/i,
    reply: (message, output) => `ticket #${output.id} is assigned to ${output.assignee}`,
},
{
    /* eslint-disable max-params */
    action: (tickets, _message, id, assignee) => assign(tickets, id, assignee),
    regexp: /assign #?([0-9]*) to (\w*)/i,
    reply: (message, output) => `ticket #${output.id} is assigned to ${output.assignee}`,
},
{
    action: (tickets, _message) => tickets,
    regexp: /debug/i,
    reply: (message, output) => JSON.stringify(output, null, 4),
},
{
    action: (tickets, _message, username) => [tickets, username.toLowerCase()],
    regexp: /todo ?(\w*)/i,
    reply: (message, output) => showTickets(output[0], ['open'], output[1]),
},
{
    action: (tickets, _message) => tickets,
    regexp: /mine/i,
    reply: (message, output) => showTickets(output, ['open'], message.userName),
},
{
    action: (tickets, _message) => tickets,
    regexp: /history/i,
    reply: (message, output) => showTickets(output, ['open', 'closed']),
},
{
    action: (tickets, _message) => forget(tickets),
    regexp: /forget it/i,
    reply: (message, output) => `deleted ${output} tickets`,
},
{
    action: (tickets, _message, type) => gimme(type),
    regexp: /gimme\s*a*n*\s*(\w*)/i,
    reply: (message, output) => `${message.userName} ${output[0].toLowerCase()}${output.substr(1)}`,
},
]

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

function showTicket(ticket) {
    var main = `ticket #${ticket.id}: ${ticket.content}`
    if(ticket.roomName) {
        main += ` (${ticket.roomName})`
    }
    if(ticket.requester) {
        main += ` requested by ${ticket.requester}`
    }
    if(ticket.assignee) {
        main += ` assigned to ${ticket.assignee}`
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

function showTickets(tickets, states, userName) {
    var count = 0;
    var output = '\n'
    for(var i = 1; i <= tickets.lastId; i++) {
        const strIndex = `${i}`
        if(states.indexOf(tickets[strIndex].status) != -1) {
            if(!userName ||
                (compareUserName(tickets[strIndex].assignee, userName) ||
                compareUserName(tickets[strIndex].requester, userName))) {
                output += `${showTicket(tickets[strIndex])}\n`
                count++
            }
        }
    }
    if(count === 0) {
        return 'nothing TODO!'
    }
    return output
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

function assign(tickets, id, assignee) {
     const ticket = findTicket(tickets, id)
     ticket.assignee = assignee
     return ticket
}

function help() {
    return actions.map((action) => `${action.regexp.toString()}`).join('\n')
}

function getRandomInt(min, max) {
    const range = max - min + 1 + min
    return Math.floor(Math.random() * range);
}

function addComment(ticket, comment) {
    if(!(ticket.comments instanceof Array)) {
        ticket.comments = []
    }
    ticket.comments.push(comment)
    return showTicket(ticket)
}
var sources = {}

function gimme(type) {
    const typePath = path.basename(`${type}.txt`)
    /* eslint-disable no-sync */
    if(!fs.existsSync(typePath)) {
        throw new TicketError(`I don't know how to give you ${type}!`)
    }
    if(!sources[type]) {
        /* eslint-disable no-sync */
        const content = fs.readFileSync(typePath)
        sources[type] = content.toString().split('\n')
    }
    const saying = sources[type][getRandomInt(0, sources[type].length)]
    return saying
}

/**
 * Callback for Array.find.
 * @param action action object
 * @this object with content and result
 * @returns true if match regexp, false otherwise
 */
function searchRegexp(action) {
    if(action && action.regexp) {
        const exec = action.regexp.exec(this.content)
        if(exec) {
            this.result = exec.slice(1)
            return true
        }
    }
    return false
}

function process(tickets, message) {
    const findParams = {
        content: message.content,
        result: null
    }
    const action = actions.find(searchRegexp, findParams)

    var reply;
    if(action) {
        try {
            var output = action.action(tickets, message, ...findParams.result)
            reply = `${action.reply.bind(output)(message, output)}`
        } catch(e) {
            if(e instanceof TicketError) {
                return e.message
            }
            throw e
        }
    } else {
        reply = `I don't understand: ${message.content}, can you try again?`
    }
    return `#${message.prefix}: ${reply}`
}

function createTickets() {
    return {
        lastId: 0
    }
}

function store(storePath, tickets) {
    /* eslint-disable no-sync */
    fs.writeFileSync(storePath, JSON.stringify(tickets, null, 4))
}

function load(storePath) {
    /* eslint-disable no-sync */
    if(fs.existsSync(storePath)) {
        /* eslint-disable no-sync */
        const datastore = fs.readFileSync(storePath).toString()
        try {
            return JSON.parse(datastore)
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
    createTickets,
    load,
    openTicket,
    process,
    store,
}
