'use strict'

const reload = require('./reloader')
const fs = require('fs')

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

function isValidRoom(config, currentRoomName) {
   return config.whitelisted.indexOf(currentRoomName) != -1 ||
        currentRoomName.toLowerCase().indexOf(config.prefix.toLowerCase()) != -1
}

function handler(config, data, message) {
    if(mine(content(message), config.prefix) &&
        isValidRoom(config, roomName(message))) {
        const processor = reload(config.processor)
        if(!(data.tickets instanceof Object)) {
            data.tickets = processor.load(config.store)
        }
        if(!data.fs) {
            data.fs = fs
        }
        const reply = processor.process(data, {
            content: cleanContent(config.prefix, message),
            prefix: config.prefix,
            roomName: roomName(message),
            userName: userName(message),
        })
        processor.store(config.store, data.tickets)
        destination(message).say(reply)
    }
}

module.exports = handler
