'use strict'

const fs = require('fs')
const path = require('path')

const Sample = {
    assignee: null,
    closed: null,
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
    regexp: /^$/gi,
    reply: (message, _output) => `Yes ${message.userName}?`,
},
{
    action: (_tickets, _message) => help(),
    regexp: /help/gi,
    reply: (message, output) => `\n${output}`,
},
{
    action: (tickets, _message, id) => closeTicket(tickets, id),
    regexp: /close #([0-9]*)/gi,
    reply: (message, output) => `ticket #${output.id} is closed`,
},
{
    action: (tickets, message, content) =>
        openTicket(tickets, message, content),
    regexp: /please (.*)/gi,
    reply: (message, output) => `will ${output.content} (ticket #${output.id})`,
},
{
    action: (tickets, _message, id) => findTicket(tickets, id),
    regexp: /show #([0-9]*)/gi,
    reply: (message, output) => showTicket(output),
},
{
    action: (tickets, message, id) => assign(tickets, id, message.userName),
    regexp: /take #([0-9]*)/gi,
    reply: (message, output) => `ticket #${output.id} is assigned to ${output.assignee}`,
},
{
    /* eslint-disable max-params */
    action: (tickets, _message, id, assignee) => assign(tickets, id, assignee),
    regexp: /assign #([0-9]*) to (\w*)/gi,
    reply: (message, output) => `ticket #${output.id} is assigned to ${output.assignee}`,
},
{
    action: (tickets, _message) => tickets,
    regexp: /debug/gi,
    reply: (message, output) => JSON.stringify(output, null, 4),
},
{
    action: (tickets, _message) => tickets,
    regexp: /todo/gi,
    reply: (message, output) => showTickets(output, ['open']),
},
{
    action: (tickets, _message) => tickets,
    regexp: /history/gi,
    reply: (message, output) => showTickets(output, ['open', 'closed']),
},
{
    action: (tickets, _message) => forget(tickets),
    regexp: /forget it/gi,
    reply: (message, output) => `deleted ${output} tickets`,
},
{
    action: (tickets, _message, type) => gimme(type),
    regexp: /gimme\s*a*n*\s*(\w*)/gi,
    reply: (message, output) => `${message.userName} ${output[0].toLowerCase()}${output.substr(1)}`,
},
]

function TicketError(message) {
  this.name = 'TicketError';
  this.message = message || 'Ticketing error';
  this.stack = (new Error()).stack;
}
TicketError.prototype = Object.create(Error.prototype);
TicketError.prototype.constructor = TicketError;

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
    newTicket.id = tickets.lastId
    newTicket.created = new Date()
    newTicket.content = content
    newTicket.roomName = message.roomName
    newTicket.requester = message.userName
    tickets[newTicket.id] = newTicket
    return tickets[newTicket.id]
}

function showTicket(ticket) {
    return `${ticket.content} requested by ${ticket.requester} (${ticket.roomName}) assigned to ${ticket.assignee}`
}

function showTickets(tickets, states) {
    var count = 0;
    var output = '\n'
    for(var i = 1; i < tickets.lastId + 1; i++) {
        if(states.indexOf(tickets[i].status) != -1) {
            output += `ticket #${i}: ${showTicket(tickets[i])}\n`
            count++
        }
    }
    if(!count) {
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

var sources = {}

function gimme(type) {
    if(!sources[type]) {
        /* eslint-disable no-sync */
        const content = fs.readFileSync(path.basename(`${type}.txt`))
        sources[type] = content.toString().split('\n')
    }
    const saying = sources[type][getRandomInt(0, sources[type].length)]
    return saying
}

/**
 * Callback for find.
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
        var output = action.action(tickets, message, ...findParams.result)
        // If(!(output instanceof Object) && !output) {
        //     Reply = `${JSON.stringify(action)} did not return any output`
        // } else {
            reply = `${action.reply.bind(output)(message, output)}`
        // }
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
    try {
        /* eslint-disable no-sync */
        const datastore = fs.readFileSync(storePath)
        return JSON.parse(datastore)
    } catch(e) {
        return createTickets()
    }
}

module.exports = {
    createTickets,
    load,
    openTicket,
    process,
    store,
}
