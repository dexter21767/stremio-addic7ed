var env = process.env.NODE_ENV ? 'beamup':'local';

var config = {
    BaseURL: "https://www.addic7ed.com",
    APIURL: 'https://api.themoviedb.org/3'
}

switch (env) {
    case 'beamup':
		config.port = process.env.PORT
        config.local = "https://2ecbbd610840-addic7ed.baby-beamup.club"
        break;

    case 'local':
		config.port = 63355
        config.local = "http://127.0.0.1:" + config.port;
        break;
}

module.exports = config;