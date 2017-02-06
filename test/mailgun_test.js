'use strict'

const assert = require('chai').assert
const mg = require('../mailgun')

describe('mailgun', () => {
    it('validates config', () => {
        assert.isTrue(mg.isValidMailgunConfig({
            'apiKey': 'key-testkey',
            'domain': 'mg.coderbunker.com',
            'from': 'Coderbunker IT <it@coderbunker.com>',
            'subject': 'Please scan WeChat QRcode with Coderbunker Phone',
            'to': 'wechaty@coderbunker.com',
        }))
    })
})
