import AWS from 'aws-sdk'
const sesClient = new AWS.SES({apiVersion: '2010-12-01'})

export function sendEmail (mailData) {
  return new Promise((resolve, reject) => {
    let email = {
      Source: mailData.fromAddress,
      Destination: {
        ToAddresses: mailData.toAddresses
      },
      Message: {
        Subject: {
          Data: mailData.subject
        },
        Body: {
          Html: {
            Data: mailData.body,
            Charset: 'utf8'
          }
        }
      }
    }

    function callback (err, data) {
      if (err) {
        console.log(`error while sending email ${err}`)
        reject(err)
        return
      }
      resolve(data)
    }

    sesClient.sendEmail(email, callback)
  })
}