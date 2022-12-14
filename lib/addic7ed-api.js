var langs = require('langs'),
    axios = require('axios').default,
    helpers = {
        addic7edURL: 'https://www.addic7ed.com',
        formatShowNumber: function formatShowNumber(number) {
            number = parseInt(number);
            return number < 10 ? '0' + number : number;
        }
    };

const client = axios.create({
    baseURL: helpers.addic7edURL,
    timeout: 50000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
    }
});

function search(show, season, episode, languages) {
    var searchTitle = `${show.trim()} ${season ? helpers.formatShowNumber(season) : ''} ${episode ? helpers.formatShowNumber(episode) : ''}`.trim();

    return client.post(helpers.addic7edURL + '/srch.php',
        {},
        {
            params: {
                search: searchTitle,
                Submit: 'Search'
            }
        }).then(function (res) {
            var body = res.data;
            if (/<b>\d+ results found<\/b>/.test(body)) {
                if (~body.indexOf('<b>0 results found<\/b>')) {
                    // No result
                    // =========
                    console.log('[Search] Addic7ed.com error: No result.');
                    return [];
                }

                // Multiple results
                // ================

                // Find result with proper season and episode in url
                // -------------------------------------------------
                var regexp
                if (season) {
                    regexp = new RegExp('href="(serie/[^/]+/' + parseInt(season) + '/' + parseInt(episode) + '/.+?)"');
                } else {
                    regexp = new RegExp('href="(movie\/[0-9]+?)"');
                }
                var urlMatch = body.match(regexp);
                var url = urlMatch && urlMatch[1];

                if (!url) {
                    console.log('[Search] Addic7ed.com error: subtitles not found in a multiple result set.');
                    return [];
                }

                return client.get(helpers.addic7edURL + '/' + url)
                    .then(function (res) {
                        let results = findSubtitles(season ? 'tv' : 'movie', res.data, languages);
                        results = sortByLang(results)
                        return results
                    })
                    .catch(searchError);
            }
            let results = findSubtitles(body, languages);
            results = sortByLang(results)
            return results

        }).catch(searchError);
}

function sortByLang(subs = Array) {
    try {
        let sorted = {}
        subs.map((e,
            i) => {
            if (sorted[e.lang.toLowerCase()]) {
                sorted[e.lang.toLowerCase()].push(e)
            } else {
                sorted[e.lang.toLowerCase()] = [e]
            }
        })
        return sorted
    } catch (err) {
        return null
    }
}


function findSubtitles(type, body, languages) {
    var regexList
    if (type === 'tv') {
        regexList = {
            titleMatch: /(.+?) - \d\dx\d\d - (.+?) <small/
        }
    } else {
        regexList = {
            titleMatch: /(.*?) \([0-9]{4}\) <small/
        }
    }

    var subs = [],
        refererMatch = body.match(/\/show\/\d+/),
        referer = refererMatch ? refererMatch[0] : '/show/1',
        titleMatch = body.match(regexList.titleMatch),
        episodeTitle = titleMatch ? titleMatch[2] : '',
        showTitle = titleMatch ? titleMatch[1].trim() : '',
        versionRegExp = /Version (.+?),([^]+?)<\/table/g,
        versionMatch,
        version,
        hearingImpaired,
        subInfoRegExp = /class="language">([^]+?)<a[^]+?(% )?Completed[^]+?href="([^"]+?)"><strong>(?:most updated|Download)[^]+?(\d+) Downloads/g,
        subInfoMatch,
        lang,
        langId,
        notCompleted,
        link,
        downloads,
        distributionMatch,
        distribution,
        team;

    // Find subtitles HTML block parts
    // ===============================
    while ((versionMatch = versionRegExp.exec(body)) !== null) {
        version = versionMatch[1].toUpperCase();
        hearingImpaired = versionMatch[2].indexOf('Hearing Impaired') !== -1;

        while ((subInfoMatch = subInfoRegExp.exec(versionMatch[2])) !== null) {
            notCompleted = subInfoMatch[2];
            if (notCompleted) {
                continue;
            }

            lang = subInfoMatch[1];
            // Find lang iso code 2B
            // ---------------------
            langId = langs.where('name', lang.replace(/\(.+\)/g, '').trim());
            langId = langId && langId['2B'] || lang.substr(0, 3).toLowerCase();

            if (languages && !~languages.indexOf(langId)) {
                continue;
            }

            link = subInfoMatch[3];
            downloads = parseInt(subInfoMatch[4], 10);

            distributionMatch = version.match(/HDTV|WEB(.DL|.?RIP)?|WR|BRRIP|BDRIP|BLURAY/i);

            distribution = distributionMatch
                ? distributionMatch[0].toUpperCase()
                    .replace(/WEB(.DL|.?RIP)?|WR/, 'WEB-DL')
                    .replace(/BRRIP|BDRIP|BLURAY/, 'BLURAY')
                : 'UNKNOWN';

            team = version.replace(/.?(REPACK|PROPER|[XH].?264|HDTV|480P|720P|1080P|2160P|AMZN|WEB(.DL|.?RIP)?|WR|BRRIP|BDRIP|BLURAY)+.?/g, '')
                .trim().toUpperCase() || 'UNKNOWN';

            subs.push({
                episodeTitle: episodeTitle,
                showTitle: showTitle,
                downloads: downloads,
                lang: lang,
                langId: langId,
                distribution: distribution,
                team: team,
                version: version,
                link: link,
                referer: referer,
                hearingImpaired: hearingImpaired
            });
        }
    }

    return subs;
}

function searchError(err) {
    console.log(err);
    return console.log('[Search] Addic7ed.com error', err.statusCode, err.options && err.options.qs.search);
}

module.exports = search;
