Step 1: init a npm project
=========================

**Pre-requisites: Node.js, Git**

This is the first, boilerplate step of creating an add-on for Stremio. Create a node.js project and add the [stremio-addons](http://github.com/Stremio/stremio-addons) module as dependency.

```bash
mkdir stremio-hello-world
cd stremio-hello-world
npm init
npm install stremio-addons --save
git add *
git commit -a -m "initial commit"
```

Step 2: Create index.js, fill manifest
===========================

In this step, we define the add-on name, description and purpose.

Create an index.js file:
```javascript
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
```

Step 3: init an add-on server
============================

Add to the end of your index.js:
```javascript
var addon = new Stremio.Server({

}, { stremioget: true }, manifest);
```

This creates an Add-on server object with our manifest and no methods. 

Append again:
```javascript
var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000);
```

This initializes a server for the add-on on port 7000. This is the server Stremio clients should connect to to use the add-on. 

Alternatively, if you're making an integration for a website / web app written in Node.js, you can embed the add-on in your server code by chaining it to the list of your connect/express middlewares:

```javascript
app.use(addon.middleware)
```

Step 4: basic streaming
==============================

To implement basic streaming, we will set-up a dummy dataset with a few public domain movies. 

And then implement ``stream.find`` as follows:

```javascript
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

var addon = new Stremio.Server({
    "stream.find": function(args, callback, user) {
        // only "availability" is required for stream.find, but we can return the whole object
        if (! args.query) return callback();
        callback(null, [dataset[args.query.imdb_id]]);
    }
}, { stremioget: true }, manifest);

var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000);
```

As you can see, this is an add-on that allows Stremio to stream 6 public domain movies - in just 40 lines of code. 

Depending on your source, you can implement streaming (stream.find) or catalogues (meta.find, meta.get) of ``movie``, ``series``, ``channel`` or ``tv`` content types.


Step 5: load in Stremio, test streaming
================================

Step 6: implement metadata (Discover catalogue)
==============================