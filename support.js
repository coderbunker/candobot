'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const reload = require('./reloader')
const ticket = reload('./ticket.js')

function ProcessError(message) {
  this.name = 'ProcessError';
  this.message = message || 'Ticketing error';
  this.stack = (new Error()).stack;
}
ProcessError.prototype = Object.create(Error.prototype);
ProcessError.prototype.constructor = ProcessError;

const actions = [
{
    action: (_data, _message) => 'DEFAULT ACTION',
    regexp: /^$/i,
    reply: (message, _output) => `Yes ${message.userName}? Ask me for help if you need me.`,
},
{
    action: (_data, _message) => help(),
    regexp: /help/i,
    reply: (message, output) => `\n${output}`,
},
{
    action: (data, _message, id) => ticket.closeTicket(data.tickets, id),
    regexp: /close #?([0-9]*)/i,
    reply: (message, output) => `ticket #${output.id} is closed`,
},
{
    action: (data, message, content) =>
        ticket.openTicket(data.tickets, message, content.trim()),
    regexp: /please (.*)/i,
    reply: (message, output) => `will ${output.content} (ticket #${output.id})`,
},
{
    action: (data, _message, id) => ticket.findTicket(data.tickets, id),
    regexp: /show #?([0-9]*)/i,
    reply: (message, output) => ticket.showTicket(output),
},
{
    /* eslint-disable max-params */
    action: (data, _m, id, comment) => [
        ticket.findTicket(data.tickets, id), comment
    ],
    regexp: /ticket #?([0-9]*) (.*)$/i,
    reply: (message, output) => ticket.addComment(output[0], output[1]),
},
{
    action: (data, message, id) => ticket.assign(
        data.tickets, id, message.userName),
    regexp: /take #?([0-9]*)/i,
    reply: (message, output) => `ticket #${output.id} is assigned to ${output.assignee}`,
},
{
    /* eslint-disable max-params */
    action: (data, _message, id, assignee) =>
        ticket.assign(data.tickets, id, assignee),
    regexp: /assign #?([0-9]*) to (\w*)/i,
    reply: (message, output) => `ticket #${output.id} is assigned to ${output.assignee}`,
},
{
    action: (data, _message) => data.tickets,
    regexp: /debug/i,
    reply: (message, output) => JSON.stringify(output, null, 4),
},
{
    action: (data, _message, username) => [
        data.tickets, username.toLowerCase()
    ],
    regexp: /todo ?(\w*)/i,
    reply: (message, output) => ticket.showTickets(output[0], ['open'], output[1]),
},
{
    action: (data, _message) => data.tickets,
    regexp: /mine/i,
    reply: (message, output) => ticket.showTickets(output, ['open'], message.userName),
},
{
    action: (data, _message) => data.tickets,
    regexp: /history/i,
    reply: (message, output) => ticket.showTickets(output, ['open', 'closed']),
},
{
    action: (data, _message, id) => ticket.forgetTicket(data.tickets, id),
    regexp: /forget #?([0-9]*)/i,
    reply: (message, output) => `deleted ticket #${output}`,
},
{
    action: (_data, _message, _type) => true,
    regexp: /meaning of life/i,
    reply: (_message, _output) => '42',
},
{
    action: (_data, _message, _type) => true,
    regexp: /gimme high five/i,
    reply: (_message, _output) => 'ヘ( ^o^)ノ＼(^_^ )',
},
{
    action: (data, _message, type) => gimme(data.fs, type),
    regexp: /gimme\s*a*n*\s*(\w*)/i,
    reply: (message, output) => `${message.userName} here have a ${output}`,
},
{
    action: (data, _message, type) => listType(data.fs, type),
    regexp: /what\s*(\w*)s?/i,
    reply: (message, output) => `\n${output.join('\n')}`,
},
{
    action: (data, _message, prompt) => prompt,
    regexp: /^(hello|hi|good [\s\w]*|happy [\s\w]*|yo|bonjour|bonsoir|nihao|hola)/i,
    reply: (message, output) => `${output} ${message.userName}`,
},
{
    action: (_data, _message, _type) => true,
    regexp: /.*\?$/i,
    reply: (message, _output) => `${message.userName} I don't understand the question`,
},
]

function help() {
    return actions.map((action) => `${action.regexp.toString()}`).join('\n')
}

var sources = {}

function gimme(injectedFs, type) {
    const typeList = listType(injectedFs, type)
    const randomIndex = Math.floor(Math.random() * sources[type].length)
    const result = typeList[randomIndex]
    return result
}

function listType(injectedFs, type) {
    const typePath = path.join('node_modules', 'candobot-data', 'data', path.basename(`${type}.txt`))
    /* eslint-disable no-sync */
    if(!injectedFs.existsSync(typePath)) {
        throw new ProcessError(`I don't know how to give you ${type}!`)
    }
    if(!sources[type]) {
        /* eslint-disable no-sync */
        const content = injectedFs.readFileSync(typePath)
        sources[type] = content
            .toString()
            .trim()
            .split('\n')
    }
    return sources[type]
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

function process(data, message) {
    assert(ticket.isValidTickets(data.tickets),
        `Expecting valid tickets data key, got: ${JSON.stringify(data.tickets)}`)
    const findParams = {
        content: message.content,
        result: null
    }
    const action = actions.find(searchRegexp, findParams)

    var reply;
    if(action) {
        try {
            var output = action.action(data, message, ...findParams.result)
            reply = `${action.reply.bind(output)(message, output)}`
        } catch(e) {
            if(e instanceof ProcessError) {
                return e.message
            }
            throw e
        }
    } else {
        reply = `I don't understand: "${message.content}". Can you try again?`
    }
    return `#${message.prefix}: ${reply}`
}

function store(storePath, tickets) {
    return ticket.store(fs, storePath, tickets)
}

function load(storePath) {
    return ticket.load(fs, storePath)
}

module.exports = {
    ProcessError,
    load,
    process,
    store,
}
