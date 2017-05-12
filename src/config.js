import AWS from 'aws-sdk'

let s3 = new AWS.S3()

export function fetchConfig() {
    return new Promise((resolve, reject) => {
        let stage = process.env.Stage || 'CODE';
        if (stage != 'CODE' && stage != 'PROD') {
            reject(`invalid stage: ${stage}, please fix Stage env variable`);
            return;
        }
        const key = 'fulfilment.private.json';
        const bucket = `fulfilment-private/${stage}`;
        console.log(`loading ${stage} configuration from ${bucket}/${key}`);

        s3.getObject(
            { Bucket: bucket, Key: key },
            function (err, data) {
                if (err)
                    reject(getError('s3_download_error', `Error fetching config for S3 : ${err}`));
                else {
                    const json = JSON.parse(new Buffer(data.Body));
                    var config = json.zuora.api;
                    config.stage = stage;
                    resolve(config);
                }
            });
    })
}