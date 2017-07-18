/* eslint-env jest */
import { handler } from '../src/notifier'

jest.mock('../src/lib/config', () => {
  return {
    getStage: () => Promise.resolve('CODE')
  }
})

jest.mock('../src/lib/Emailer', () => {
  return {
    sendEmail: jest.fn(() => Promise.resolve("ok"))
  }
})

let fakeMod = require('../src/lib/Emailer')
let mockSendEMail = fakeMod.sendEmail

function verify (done, expectedError, expectedResponse, expectedEmail) {
  return function (err, res) {
    try {
      expect(err).toEqual(expectedError)
      if (err) {
        done()
        return
      }

      let responseAsJson = JSON.parse(JSON.stringify(res))
      expect(responseAsJson).toEqual(expectedResponse)

      expect(mockSendEMail.mock.calls.length).toBe(1)
      expect(mockSendEMail).toHaveBeenCalledWith(expectedEmail)

      done()
    }
    catch
      (error) {
      done.fail(error)
    }
  }
}

//todo add date to email

test('should send email', done => {
  let input = {
    url: 'http://some-url.com',
    notifyEmail: 'someone@something.com'
  }

  let expectedResponse = { message : 'ok'}
  let expectedEmail = {
    subject : "Fulfilment process completed in CODE",
    fromAddress : "membership.dev@theguardian.com",
    toAddresses : ["someone@something.com"],
    body : '<a href="http://some-url.com">Fulfilment result</a>'

  }
  handler(input, {}, verify(done, null, expectedResponse, expectedEmail))
})

