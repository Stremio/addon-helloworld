var Stremio = require("stremio-addons");
var magnet = require("magnet-uri");

var manifest = { 
    "name": "Hello World Addon",
    "description": "Sample addon providing a few public domain movies",
    "icon": "URL to 256x256 monochrome png icon", 
    "background": "URL to 1366x756 png background",
    "id": "org.stremio.helloworld",
    "version": "1.0.0",
    "types": ["movie", "series"],

    // filter: when the client calls all add-ons, the order will depend on how many of those conditions are matched in the call arguments for every add-on
    "filter": { "query.imdb_id": { "$exists": true }, "query.type": { "$in":["series","movie"] } }
};

var dataset = {
    // For p2p streams, you can provide availability property, from 0 to 3, to indicate stability of the stream; if not passed, 1 will be assumed
    // mapIdx is the index of the file within the torrent ; if not passed, the largest file will be selected
    "tt0032138": { infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", mapIdx: 0, availability: 2 }, // the wizard of oz 1939
    "tt0017136": { infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", mapIdx: 1, availability: 2 }, // metropolis, 1927
    //"tt0017136": { url: "ipfs://QmYbmoDHDNgqoDbLC4vMyoMH5dYQdrxL1wh63x9rhSC6Zf/avchd-metropolis.1927.1080p.mkv" }, // IPFS example - metropolis, 1927, restored 2010 
    
    // night of the living dead, example from magnet
    "tt0063350": fromMagnet("magnet:?xt=urn:btih:A7CFBB7840A8B67FD735AC73A373302D14A7CDC9&dn=night+of+the+living+dead+1968+remastered+bdrip+1080p+ita+eng+x265+nahom&tr=udp%3A%2F%2Ftracker.publicbt.com%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce"), // night of the living dead, 1968
    "tt0051744": { infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960" }, // house on haunted hill 1959

    "tt1254207": { url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", availability: 1 }, // big buck bunny, HTTP stream
    "tt0031051": { yt_id: "gLKA7wxqtfM", availability: 2 }, // The Arizona Kid, 1939; YouTube stream

    "tt0137523": { externalUrl: "https://www.netflix.com/watch/26004747" }, // Fight Club, 1999; redirect to Netflix

    "tt1748166 1 1": { infoHash: "07a9de9750158471c3302e4e95edb1107f980fa6" }, // Pioneer One
};

// utility function to add from magnet
function fromMagnet(uri) {
    var parsed = magnet.decode(uri);
    var infoHash = parsed.infoHash.toLowerCase();
    var tags = [];
    if (uri.match(/720p/i)) tags.push("720p");
    if (uri.match(/1080p/i)) tags.push("1080p");
    return {
        infoHash: infoHash,
        sources: (parsed.announce || []).map(function(x) { return "tracker:"+x }).concat(["dht:"+infoHash]),
        tag: tags,
        title: tags[0], // show quality in the UI
        availability: 2, 
    }
}

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
    //callback(null, [dataset[args.query.imdb_id]]); // Only for movies
    
    var key = [args.query.imdb_id, args.query.season, args.query.episode].filter(function(x) { return x }).join(" ");
    callback(null, [dataset[key]]);
};

// Add sorts to manifest, which will add our own tab in sorts
manifest.sorts = [{prop: "popularities.helloWorld", name: "Hello World",types:["movie","series"]}];

// Prefer this add-on for queries with sort.popularities.helloWorld property (used when using the sort order)
manifest.filter["sort.popularities.helloWorld"] = { $exists: true };

// To provide meta for our movies, we'll just proxy the official cinemeta add-on
var client = new Stremio.Client();
client.add("http://cinemeta.strem.io/stremioget/stremio/v1");

// Proxy Cinemeta, but get only our movies
// That way we get a tab "Hello World" with the movies we provide :) 
methods["meta.find"] = function(args, callback) {
    var ourImdbIds = Object.keys(dataset).map(function(x) { return x.split(" ")[0] });
    args.query = args.query || { };
    args.query.imdb_id = args.query.imdb_id || { $in: ourImdbIds };
    client.meta.find(args, function(err, res) {
	if (err) console.error(err);
        callback(err, res ? res.map(function(r) { 
            r.popularities = { helloWorld: 10000 }; // we sort by popularities.helloWorld, so we should have a value
            return r;
        }) : null);
    });
}
