import config from './lib/config'
import { sendEmail } from './lib/Emailer'

export function handler (input, context, callback) {
  asyncHandler(input)
    .then(res => callback(null, {message: 'ok'}))
    .catch(e => {
      console.log(e)
      callback(e)
    })
}

function getMailData (toAddress, url, stage) {
  return {
    fromAddress: 'membership.dev@theguardian.com',
    toAddresses: [toAddress],
    subject: `Fulfilment process completed in ${stage}`,
    body: `<a href="${url}">Fulfilment result</a>`

  }
}

async function asyncHandler (input) {
  let stage = await config.getStage()
  let sentMail = await sendEmail(getMailData(input.notifyEmail, input.url, stage))
  return sentMail
}