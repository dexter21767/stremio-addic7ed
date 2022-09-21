var fs      = require('fs'),
    iconv   = require('iconv-lite'),
    axios = require('axios').default,
    //request = require('request-promise-native'),
    helpers = require('./helpers');

async function download (subInfo) {
    console.log('subinfo',subInfo)
        return Buffer.from((await axios.get(helpers.addic7edURL + subInfo.link,{
            headers:  {
                'Referer': helpers.addic7edURL + (subInfo.referer || '/show/1')
            },
            encoding: null,
            followRedirect: false
        }).catch(error=>{console.log('error')})).data)
}

module.exports = download;
