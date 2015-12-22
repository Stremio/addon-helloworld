var Stremio = require("stremio-addons");

var manifest = { 
    "name": "Example Addon",
    "description": "Sample addon providing a few public domain movies",
    "icon": "URL to 256x256 monochrome png icon", "background": "URL to 1366x756 png background",
    "id": "org.stremio.basic",
    "version": "1.0.0",
    "types": ["movie"],
    "filter": { "infoHash": { "$exists": true }, "query.imdb_id": { "$exists": true }, "query.type": { "$in":["series","movie"] } }
};

var dataset = {
    "tt0063350": { infoHash: "f17fb68ce756227fce325d0513157915f5634985", mapIdx: 0, availability: 2 }, // night of the living dead, 1968
    "tt0032138": { infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", mapIdx: 0, availability: 2 }, // the wizard of oz 1939
    "tt0017136": { infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", mapIdx: 1, availability: 2 }, // metropolis, 1927
    "tt0051744": { infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960", availability: 2 }, // house on haunted hill 1959; if mapIdx is not passed, largest file is picked
    "tt1254207": { url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", availability: 1 }, // big buck bunny, HTTP stream
};

var addon = new Stremio.Server({
    "stream.get": function(args, callback, user) {
        if (! args.query) return callback();
        return callback(null, dataset[args.query.imdb_id] || null);
    },
    "stream.find": function(args, callback, user) {
        // only "availability" is required for stream.find, but we can return the whole object
        if (! args.query) return callback();
        callback(null, dataset[args.query.imdb_id] || null);
    }
}, { stremioget: true }, manifest);

var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000);