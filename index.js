
var addonSDK = require("stremio-addon-sdk");
var magnet = require("magnet-uri");

process.env.STREMIO_LOGGING = true; // enable server logging for development purposes

var manifest = { 
    "id": "org.stremio.helloworld",
    "version": "1.0.0",

    "name": "Hello World Addon",
    "description": "Sample addon providing a few public domain movies",

    "icon": "URL to 256x256 monochrome png icon", 
    "background": "URL to 1366x756 png background",

    // set what type of resources we will return
    "resources": [
        "catalog",
        "stream"
    ],

    "types": ["movie", "series"], // your add-on will be preferred for those content types

    // set catalogs, we'll be making 2 catalogs in this case, 1 for movies and 1 for series
    "catalogs": [
        {
            type: 'movie',
            id: 'helloworldmovies'
        },
        {
            type: 'series',
            id: 'helloworldseries'
        }
    ],

    // prefix of item IDs (ie: "tt0032138")
    "idPrefixes": [ "tt" ]

};

var dataset = {
    // fileIdx is the index of the file within the torrent ; if not passed, the largest file will be selected
    "tt0032138": { name: "The Wizard of Oz", infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", fileIdx: 0 },
    "tt0017136": { name: "Metropolis", infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", fileIdx: 1 },

    // night of the living dead, example from magnet
    "tt0063350": fromMagnet("Night of the Living Dead", "magnet:?xt=urn:btih:A7CFBB7840A8B67FD735AC73A373302D14A7CDC9&dn=night+of+the+living+dead+1968+remastered+bdrip+1080p+ita+eng+x265+nahom&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce"),
    "tt0051744": { name: "House on Haunted Hill", infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960" },

    "tt1254207": { name: "Big Buck Bunny", url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4" }, // HTTP stream
    "tt0031051": { name: "The Arizona Kid", ytId: "m3BKVSpP80s" }, // YouTube stream

    "tt0137523": { name: "Fight Club", externalUrl: "https://www.netflix.com/watch/26004747" }, // redirects to Netflix

    "tt1748166:1:1": { name: "Pioneer One", infoHash: "07a9de9750158471c3302e4e95edb1107f980fa6" }, // torrent for season 1, episode 1
};

// utility function to add from magnet
function fromMagnet(name, uri) {
    var parsed = magnet.decode(uri);
    var infoHash = parsed.infoHash.toLowerCase();
    var tags = [];
    if (uri.match(/720p/i)) tags.push("720p");
    if (uri.match(/1080p/i)) tags.push("1080p");
    return {
        name: name,
        infoHash: infoHash,
        sources: (parsed.announce || []).map(function(x) { return "tracker:"+x }).concat(["dht:"+infoHash]),
        tag: tags,
        title: tags[0], // show quality in the UI
    }
}

var addon = new addonSDK(manifest);

// Streaming
addon.defineStreamHandler(function(args, cb) {

    if (! args.id)
        return cb(null, { streams: [] })

    if (dataset[args.id]) {
        // remove "name" attribute of streams response
        // "name" can be used to customize the name of the stream
        // but in this case, we just want the addon name to show
        var streams = [dataset[args.id]].map(function(x) { delete x.name; return x })
        cb(null, { streams: streams });
    } else
        cb(null, null)

})

// determine media type by index
var typeFromId = function(index) {
    // object keys that include ":" are series, for example:
    // "tt1748166:1:1" refers to season 1, episode 1 of the "tt1748166" imdb id
    return index.includes(':') ? 'series' : 'movie'
}

var METAHUB_URL = 'https://images.metahub.space'

var basicMeta = function(data, index) {
    // To provide basic meta for our movies for the catalog
    // we'll fetch the poster from Stremio's MetaHub
    var imdbId = index.split(':')[0]
    return {
        id: imdbId,
        type: typeFromId(index),
        name: data.name,
        poster: METAHUB_URL+'/poster/medium/'+imdbId+'/img',
    }
}

addon.defineCatalogHandler(function(args, cb) {

    var metas = []

    // iterate dataset object and only add movies or series
    // depending on the requested type
    for (var key in dataset) {
        if (args.type == typeFromId(key)) {
            metas.push(basicMeta(dataset[key], key))
        }
    }

    cb(null, { metas: metas })

})

if (module.parent) {
    module.exports = addon
} else {
    addon.runHTTPWithOptions({ port: 7000 })
}
