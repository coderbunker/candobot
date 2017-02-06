'use strict'

const fs = require('fs')
const os = require('os')
const request = require('request');

function email(mailgun, emailData) {
    return new Promise((resolve, reject) => {
        mailgun.messages().send(emailData, function (error, body) {
            if(error) {
                reject(error)
            } else {
                resolve(body);
            }
        });
    })
}

function getHttpFile(url, filename, cb) {
    request(url)
        .on('error', function(err) {
            cb(err)
        })
        .on('end', function() {
            cb()
        })
        .pipe(fs.createWriteStream(filename))
}

function isValidMailgunConfig(config) {
    return Boolean(config.apiKey &&
        config.domain &&
        config.from &&
        config.to &&
        config.subject)
}

function createMailgunClient(config) {
    var mailgun = require('mailgun-js')({
        apiKey: config.apiKey,
        domain: config.domain
    });
    return mailgun
}

function createEmailData(config, filename, text) {
    var emailData = {
        from: config.from,
        inline: filename,
        subject: `${new Date().getTime()} ${config.subject}`,
        text: `${text}\n\n${new Date()}\n${os.hostname()}`,
        to: config.to,
    };
    return emailData
}

module.exports = {
    createEmailData,
    createMailgunClient,
    email,
    getHttpFile,
    isValidMailgunConfig
}
