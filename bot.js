/* eslint-disable no-console */

'use strict'

const {Wechaty} = require('wechaty')

const reload = require('./reloader')
const tmp = require('tmp')

const data = {}
const urls = {}

function handleScan(url, code) {
    if(urls[url]) {
        console.log(`already notified user for ${url}`)
        return
    }
    urls[url] = true
    var config = reload('./config.json')
    if(config.email && config.mailgun) {
        var mg = reload('./mailgun.js')
        if(mg.isValidMailgunConfig(config.mailgun)) {
            /* eslint-disable no-sync */
            var filename = tmp.tmpNameSync({template: '/tmp/qrcode-XXXXXX.jpg'});
            mg.getHttpFile(url, filename, () => mg.email(
                mg.createMailgunClient(config.mailgun),
                mg.createEmailData(config.mailgun, filename, url))
                .then((body) => console.log(body))
                .catch((err) => console.log(err)))
        } else {
            console.log(`invalid configuration ${JSON.stringify(config.mailgun)}`)
        }
    } else {
        console.log('warning: mailgun not configured')
    }
    console.log(`Scan QR Code to login: ${code}\n${url}`)
}

Wechaty.instance()
    .on('scan', handleScan)
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
