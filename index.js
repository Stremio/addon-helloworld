var Stremio = require("stremio-addons");

var manifest = { 
    "name": "Example Addon",
    "description": "Sample addon providing a few public domain movies",
    "icon": "URL to 256x256 monochrome png icon", 
    "background": "URL to 1366x756 png background",
    "id": "org.stremio.helloworld",
    "version": "1.0.0",
    "types": ["movie"],

    // filter: when the client calls all add-ons, the order will depend on how many of those conditions are matched in the call arguments for every add-on
    "filter": { "query.imdb_id": { "$exists": true }, "query.type": { "$in":["series","movie"] } }
};

var dataset = {
    // For p2p streams, you can provide availability property, from 0 to 3, to indicate stability of the stream; if not passed, 1 will be assumed
    // mapIdx is the index of the file within the torrent ; if not passed, the largest file will be selected
    "tt0032138": { infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", mapIdx: 0, availability: 2 }, // the wizard of oz 1939
    "tt0017136": { infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", mapIdx: 1, availability: 2 }, // metropolis, 1927

    "tt0063350": { infoHash: "f17fb68ce756227fce325d0513157915f5634985" }, // night of the living dead, 1968
    "tt0051744": { infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960" }, // house on haunted hill 1959

    "tt1254207": { url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", availability: 1 }, // big buck bunny, HTTP stream
    "tt0031051": { yt_id: "gLKA7wxqtfM", availability: 2 } // The Arizona Kid, 1939; YouTube stream
};

var methods = { };
var addon = new Stremio.Server(methods, { stremioget: true }, manifest);

if (module.parent) {
    module.exports = addon
} else {
    var server = require("http").createServer(function (req, res) {
        addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
    }).on("listening", function()
    {
        console.log("Sample Stremio Addon listening on "+server.address().port);
    }).listen(process.env.PORT || 7000);
}


// Streaming
methods["stream.find"] = function(args, callback) {
    if (! args.query) return callback();
    callback(null, [dataset[args.query.imdb_id]]);
};

// Add sorts to manifest, which will add our own tab in sorts
manifest.sorts = [{prop: "popularities.helloWorld", name: "Hello World",types:["movie"]}];

// Prefer this add-on for queries with sort.popularities.helloWorld property (used when using the sort order)
manifest.filter["sort.popularities.helloWorld"] = { $exists: true };

// To provide meta for our movies, we'll just proxy the official cinemeta add-on
var client = new Stremio.Client();
client.add("http://cinemeta.strem.io/stremioget");

methods["meta.find"] = function(args, callback) {
    // Proxy Cinemeta, but get only our movies
    args.query.imdb_id = args.query.imdb_id || { $in: Object.keys(dataset) };
    client.meta.find(args, function(err, res) {
        callback(err, res ? res.map(function(r) { r.popularities = { helloWorld: 10000 }; return r }) : null);
    });
}
