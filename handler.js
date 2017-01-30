'use strict'

const reload = require('./reloader')

function roomName(message) {
    return message.room() ? message.room().topic() : 'self'
}

function userName(message) {
    return message.from().name()
}

function content(message) {
    return message.content()
}

function cleanContent(prefix, message) {
    return content(message)
        .substr(prefix.length)
        .trim()
}

function mine(str, prefix) {
    return str
        .substr(0, prefix.length)
        .toLowerCase()
        .startsWith(prefix)
}

function destination(message) {
    return message.room() ? message.room() : message.from()
}

function handler(config, data, message) {
    try {
        if(mine(content(message), config.prefix) &&
           config.whitelisted.indexOf(roomName(message)) != -1) {
            const processor = reload(config.processor)
            if(!data.tickets) {
                data.tickets = processor.load(data.store)
            }
            const reply = processor.process(data.tickets, {
                content: cleanContent(config.prefix, message),
                prefix: config.prefix,
                roomName: roomName(message),
                userName: userName(message),
            })
            processor.store(config.store, data.tickets)
            destination(message).say(reply)
        }
    } catch(err) {
        destination(message).say(err)
    }
}

module.exports = handler
