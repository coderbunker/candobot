/* eslint-disable no-console */

'use strict'

const {Wechaty} = require('wechaty')

const reload = require('./reloader')

const data = {}

Wechaty.instance()
.on('scan', (url, code) => {
    console.log(`Scan QR Code to login: ${code}\n${url}`)
})
.on('login', (user) => {
    console.log(`User ${user} logined`)
})
.on('message', (message) => {
    message.ready().then(() => {
        var config = reload('./config.json')
        reload('./handler.js')(config, data, message)
    })
})
.init()
