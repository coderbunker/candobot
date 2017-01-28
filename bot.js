'use strict'

const { Wechaty } = require('wechaty')

const reload = require('./reloader')

const data = {}

Wechaty.instance() // Singleton
.on('scan', (url, code) => console.log(`Scan QR Code to login: ${code}\n${url}`))
.on('login',       user => console.log(`User ${user} logined`))
.on('message',  message => { reload('./handler.js')(data, message) })
.init()