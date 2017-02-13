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
    var messageContent = content(message)
    if(messageContent.startsWith(prefix)) {
        messageContent = messageContent
            .substr(prefix.length)
            .trim()
    }
    return messageContent.trim()
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

function isNameAllowed(config, currentRoomName) {
    if(config.ignoreName) {
        return false
    }
    return currentRoomName
        .toLowerCase()
        .indexOf(config.prefix.toLowerCase()) != -1
}

function isWhitelisted(config, currentRoomName) {
    if(!config.whitelisted) {
        return false
    }
    return config.whitelisted.indexOf(currentRoomName) != -1
}

function isValidRoom(config, currentRoomName) {
   return isWhitelisted(config, currentRoomName) ||
          isNameAllowed(config, currentRoomName)
}

function handler(config, data, message) {
    const currentRoomName = roomName(message)
    if(currentRoomName === 'self' ||
        (mine(content(message), config.prefix) &&
        isValidRoom(config, currentRoomName))) {
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
            roomName: currentRoomName,
            userName: userName(message),
        })
        processor.store(config.store, data.tickets)
        destination(message).say(reply)
    }
}

module.exports = handler
