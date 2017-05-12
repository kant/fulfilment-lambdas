import test from 'ava'
import * as lambda from 'lambda-local'

let querier = require('./dist/querier.js')
let fetcher = require('./dist/fetcher.js')
let exporter = require('./dist/exporter.js')



test('lambdas have handlers', t => {
    [querier, fetcher, exporter].map((l) => {
        if (typeof l.handler !== "function") {
            console.log(l)
            t.fail("Expected a handler function")
            return
        }
        t.pass()
    })
})



test.cb('End to end test', t => {
    let initial = {
        "deliveryDate": "2017-05-03"
    }

    let querierTest = (error, data) => {
        console.log("Running querier")
        console.log(data)

        if (error) {
            t.fail(error)
            return
        }
        lambda.execute({
            profilePath: "~/.aws/credentials",
            profileName: "membership",
            region: "eu-west-1",
            environment: { "Stage": "CODE" },
            lambdaHandler: "handler",
            timeoutMs: 10000,
            event: data,
            lambdaFunc: querier,
            callback: (error,data) =>{
                setTimeout(fetcherTest(error,data),60000)
            }
        })
    }
    let fetcherTest = (error, data) => {
        console.log("Running fetcher")
        console.log(data)
        if (error) {
            t.fail(error)
            return
        }
        lambda.execute({
            profilePath: "~/.aws/credentials",
            profileName: "membership",
            region: "eu-west-1",
            environment: { "Stage": "CODE" },
            lambdaHandler: "handler",
            timeoutMs: 10000,            
            event: data,
            lambdaFunc: fetcher,
            callback: exporterTest
        })
    }
    let exporterTest= (error, data) => {
        console.log("Running exporter")
        console.log(data)
        if (error) {
            t.fail(error)
            return
        }
        lambda.execute({
            profilePath: "~/.aws/credentials",
            profileName: "membership",
            region: "eu-west-1",
            environment: { "Stage": "CODE" },
            lambdaHandler: "handler",
            timeoutMs: 10000,            
            event: initial,
            lambdaFunc: querier,
            callback: (data, error) => {
                if (error) {
                    t.fail(error)
                    return
                }
                console.log(data)
                t.end()
            }
        })
    }

    querierTest(null, initial)

})