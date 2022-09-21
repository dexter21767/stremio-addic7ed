const tmdb = require('./tmdb');
var addic7edApi = require('./addic7ed-api/index');
const config = require('./config');
require('dotenv').config();
const languages = require('./languages.json');
const NodeCache = require("node-cache");
const Cache = new NodeCache();
const filesCache = new NodeCache();

async function subtitles(type, imdbid, lang) {
    let [id, season, episode] = imdbid.split(':');
    console.log(id, season, episode)
    let meta = await tmdb(type, id);
    console.log(meta)

    console.log(meta.title, season, episode)
    const cachID = `${id}_${season}_${episode}_${lang}`;
    let cached = Cache.get(cachID);
    if (cached) {
        console.log('cached main', cachID, cached);
        return cached
    } else {
        return addic7edApi.search(meta.title, season, episode, languages[lang].iso).then(function (subtitlesList) {
            let subs = [];
            console.log('subs', subtitlesList)
            if (subtitlesList) {
                for (let i = 0; i < subtitlesList.length; i++) {
                    let subInfo = subtitlesList[i];
                    subs.push({
                        lang: languages[lang].iso || languages[lang].id,
                        id: `${cachID}_${i}`, ///original/134973/11
                        url: `${config.local}/${encodeURIComponent(subInfo.referer)}/${encodeURIComponent(subInfo.link)}.srt`,
                        //url: `http://127.0.0.1:11470/subtitles.vtt?from=${config.local}/${encodeURIComponent(subInfo.referer)}/${encodeURIComponent(subInfo.link)}.srt`,
                    });
                }
                console.log('subs', subs);
                console.log("Cache keys", Cache.keys());
                let cached = Cache.set(cachID, subs);
                console.log("cached", cached)
                return subs;
            }
        });


    }

}


async function proxyStream(link, referer) {
    let cachID = link;
    let cached = filesCache.get(cachID);
    if (cached) {
        console.log('File already cached', cachID);
        return cached
    } else {
        return addic7edApi.download({ link, referer }).then(fileContent => {
            console.log('Subtitles file', fileContent);
            let cached = filesCache.set(cachID, fileContent);
            console.log("Caching File", cached)
            return fileContent;
        }).catch(error => { console.log(error) });
    }
}


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = { subtitles, proxyStream };
