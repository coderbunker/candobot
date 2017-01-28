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
    return content(message).substr(prefix.length).trim()
}

function messageString(message) {
    return `${roomName(message)}/${userName(message)}: ${content(message)}`
}

function mine(content, prefix) {
    return content.substr(0, prefix.length).toLowerCase().startsWith(prefix)
}

function destination(message) {
    return message.room()? message.room() : message.from()
}

function handler(data, message) {
    console.log(messageString(message))
    try {
        var config = reload('./config.json')
        if(mine(content(message), config.prefix) && config.whitelisted.indexOf(roomName(message)) != -1) {
            console.log(`Captured message: ${message}`)

            const processor = reload('./support.js')
            if(!data.tickets) {
                data.tickets = processor.load(data.store)
            }        
            const reply = processor.process(data.tickets, {
                prefix: config.prefix,
                roomName: roomName(message), 
                userName: userName(message), 
                content: cleanContent(config.prefix, message)
            })
            processor.store(config.store, data.tickets)
            destination(message).say(reply)
        }
    } catch(e) {
        destination(message).say(e)
    }
}

module.exports = handler