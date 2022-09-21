const tmdb = require('./tmdb');
var addic7edApi = require('./lib/addic7ed-api');
const config = require('./config');
require('dotenv').config();
const languages = require('./languages.json');
const NodeCache = require("node-cache");
const Cache = new NodeCache();
const MetaCache = new NodeCache();
const subtitlesCache = new NodeCache();



async function subtitles(type, imdbid, lang) {
    let [id, season, episode] = imdbid.split(':');
    console.log(id, season, episode)
    let meta = MetaCache.get(id);
    if (!meta) {
        meta = await tmdb(type, id);
        if (meta) {
            MetaCache.set(id, meta);
        }
    }

    console.log(meta.title, season, episode)
    const cachID = `${id}_${season}_${episode}_${lang}`;
    let cached = Cache.get(cachID);
    if (cached) {
        console.log('cached main', cachID, cached);
        return cached
    } else {
        const subtitlescachID = `${id}_${season}_${episode}`;
        let subtitlesList = subtitlesCache.get(subtitlescachID);
        if (!subtitlesList) {
            subtitlesList = await addic7edApi(meta.title, season, episode);
            if (subtitlesList) {
                subtitlesCache.set(subtitlescachID, subtitlesList);
            }
        }

        let subs = [];
        if (subtitlesList[lang]) {
            subtitles = subtitlesList[lang];
            for (let i = 0; i < subtitles.length; i++) {
                let subInfo = subtitles[i];
                let options = `d=${encodeURIComponent(config.BaseURL)}&h=referer:${encodeURIComponent(config.BaseURL+ (subInfo.referer || '/show/1'))}`;
                subs.push({ 
                    lang: languages[lang].iso || languages[lang].id,
                    id: `${cachID}_${i}`,
                    url: `http://127.0.0.1:11470/proxy/${options}/${subInfo.link}.srt`,
                    //url: `http://127.0.0.1:11470/subtitles.vtt?from=${config.local}/${encodeURIComponent(subInfo.referer)}/${encodeURIComponent(subInfo.link)}.srt`,
                });
            }
            console.log('subs', subs);
            console.log("Cache keys", Cache.keys());
            let cached = Cache.set(cachID, subs);
            console.log("cached", cached)
            return subs;
        }
    }

}


module.exports = subtitles;
