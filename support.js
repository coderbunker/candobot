'use strict'

const fs = require('fs')
const path = require('path')

const Sample = {
    assignee: null,
    status: 'open',
    id: null,
    content: null,
    roomName: null,
    requester: null,
    created: null,
    closed: null
}

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

function closeTicket(tickets, id) {
    const ticket = findTicket(tickets, id)
    ticket.status = 'closed'
    ticket.closed = Date.now()
    return ticket
}

function openTicket(tickets, message, content) {
    const newTicket = createTicket()
    tickets.lastId = tickets.lastId + 1
    newTicket.id = tickets.lastId
    newTicket.created = new Date()
    newTicket.content = content
    newTicket.roomName = message.roomName
    newTicket.requester = message.userName
    tickets[newTicket.id] = newTicket
    return tickets[newTicket.id]
}

function findTicket(tickets, id) {
    if(!id) {
        throw new TicketError(`Invalid id`)
    }
    if(!tickets[id]) {
        throw new TicketError(`Not found: #${id}`)
    }
    return tickets[id]
}

function assignTicket(tickets, id, assignee) {
    const ticket = findTicket(tickets, id)
    ticket.assignee = message.userName
    return ticket
}

function stringifyThis(message) {
    return JSON.stringify(this)
}

function showTicket(ticket) {
    return `${ticket.content} requested by ${ticket.requester} (${ticket.roomName}) assigned to ${ticket.assignee}`
}

function showTickets(tickets, states) {
    var count = 0;
    var output = "\n"
    for(var i=1; i<tickets.lastId+1; i++) {
        if(states.indexOf(tickets[i].status) != -1) {
            output += `ticket #${i}: ${showTicket(tickets[i])}\n`
            count++
        }
    }
    if(!count) {
        return "nothing TODO!"
    }
    return output
}

function forget(tickets) {
    if(!tickets.lastId) {
        return "nothing to remove!"
    }
    const lastId = tickets.lastId
    for(var i=1; i<=tickets.lastId; i++) {
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
    return actions.map(action => `${action.regexp.toString()}`).join('\n')
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

var sources = {}

function gimme(type) {
    if(!sources[type]) {
        const content = fs.readFileSync(path.basename(`${type}.txt`))
        sources[type] = content.toString().split('\n')
    }
    const saying = sources[type][getRandomInt(0, sources[type].length)]
    return saying
}

const actions = [
    {
        regexp: /^$/gi,
        action: (tickets, message, id) => {},
        reply: (message, output) => `Yes ${message.userName}?`,
    },
    {
        regexp: /help/gi,
        action: (tickets, message, id) => {return help() },
        reply: (message, output) => '\n' + output,
    },
    {
        regexp: /close #([0-9]*)/gi,
        action: (tickets, message, id) => closeTicket(tickets, id),
        reply: (message, output) =>  `ticket #${output.id} is closed`,
    },
    {
        regexp: /please (.*)/gi,
        action: (tickets, message, content) => openTicket(tickets, message, content),
        reply:  (message, output) => `will ${output.content} (ticket #${output.id})`,
    },
    {
        regexp: /show #([0-9]*)/gi,
        action: (tickets, message, id) => findTicket(tickets, id),
        reply: (message, output) => showTicket(output),
    },   
    {
        regexp: /take #([0-9]*)/gi,
        action: (tickets, message, id) => assign(tickets, id,  message.userName),
        reply: (message, output) => `ticket #${output.id} is assigned to ${output.assignee}`,
    },
    {
        regexp: /assign #([0-9]*) to (\w*)/gi,
        action: (tickets, message, id, assignee) => assign(tickets, id, assignee),
        reply: (message, output) => `ticket #${output.id} is assigned to ${output.assignee}`,
    },
    {
        regexp: /debug/gi,
        action: (tickets, message, id) => tickets,
        reply: stringifyThis,
    },
    {
        regexp: /todo/gi,
        action: (tickets, message, id) => tickets,
        reply: (message, output) => showTickets(output, ['open']),
    },
    {
        regexp: /history/gi,
        action: (tickets, message, id) => tickets,
        reply: (message, output) => showTickets(output, ['open', 'closed']),
    },
    {
        regexp: /forget it/gi,
        action: (tickets, message, id) => forget(tickets),
        reply: (message, output) => `deleted ${output} tickets`,
    },
    {
        regexp: /gimme\s*a*n*\s*(\w*)/gi,
        action: (tickets, message, type) => gimme(type),
        reply: (message, output) => `${message.userName} ${output[0].toLowerCase()}${output.substr(1)}`,
    },
]

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
    const findParams = {content: message.content, result: null}
    const action = actions.find(searchRegexp, findParams)
    var reply;
    if(action) {
        var output = action.action(tickets, message, ...findParams.result)
        // if(!(output instanceof Object) && !output) {
        //     reply = `${JSON.stringify(action)} did not return any output`
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

function store(store, tickets) {
    fs.writeFileSync(store, JSON.stringify(tickets, null, 4))
}

function load(store) {
    try {
        const datastore = fs.readFileSync(store)
        return JSON.parse(datastore)
    } catch(e) {
        return createTickets() 
    }
}

module.exports = {
    store,
    load,
    createTickets,
    process,
    openTicket
}