# Hello world add-on for Stremio
### Adds a few public domain movies to Stremio
## Basic tutorial on how to re-create this add-on step by step

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

process.env.STREMIO_LOGGING = true; // enable server logging for development purposes

var manifest = { 
    // See https://github.com/Stremio/stremio-addons/blob/master/docs/api/manifest.md for full explanation
    "id": "org.stremio.helloworld",
    "version": "1.0.0",

    "name": "Example Addon",
    "description": "Sample addon providing a few public domain movies",
    "icon": "URL to 256x256 monochrome png icon", 
    "background": "URL to 1366x756 png background",

    // Properties that determine when Stremio picks this add-on
    "types": ["movie", "series"], // your add-on will be preferred for those content types
    "idProperty": "imdb_id", // the property to use as an ID for your add-on; your add-on will be preferred for items with that property; can be an array
    // We need this for pre-4.0 Stremio, it's the obsolete equivalent of types/idProperty
    "filter": { "query.imdb_id": { "$exists": true }, "query.type": { "$in":["series","movie"] } }
};

var dataset = {
    // Some examples of streams we can serve back to Stremio ; see https://github.com/Stremio/stremio-addons/blob/master/docs/api/stream/stream.response.md
    "tt0051744": { infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960" }, // house on haunted hill 1959
    "tt1254207": { url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", availability: 1 }, // big buck bunny, HTTP stream
    "tt0031051": { yt_id: "m3BKVSpP80s", availability: 3 }, // The Arizona Kid, 1939; YouTube stream
    "tt0137523": { externalUrl: "https://www.netflix.com/watch/26004747" }, // Fight Club, 1999; redirect to Netflix
};
```

Step 3: init an add-on server
============================

Add to the end of your index.js:
```javascript
var methods = { };
var addon = new Stremio.Server(methods, manifest);
```

This creates an Add-on server object with our manifest and no methods. We can later define methods using the ``methods`` object we created.

Append again:
```javascript
var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000);
```

**This initializes a server for the add-on on port 7000. This is the server Stremio clients should connect to to use the add-on.**

_Optional:_ Alternatively, if you're making an integration for a website / web app that uses Express/Connect you can embed the add-on in your server code as such: ``app.get('/my-stremio-addon', addon.middleware)``

Step 4: basic streaming
==============================

To implement basic streaming, we will set-up a dummy dataset with a few public domain movies. 

And then implement ``stream.find`` as follows:

```javascript
/* Methods
 */
methods["stream.find"] = function(args, callback) {
    if (! args.query) return callback();
    callback(null, [dataset[args.query.imdb_id]]);
}
```

**As you can see, this is an add-on that allows Stremio to stream 6 public domain movies - in about 40 lines of code.**

Depending on your source, you can implement streaming (stream.find) or catalogues (``meta.find``, ``meta.get``) of ``movie``, ``series``, ``channel`` or ``tv`` content types.

To load that add-on in the desktop Stremio, start it with ``start --addon=http://localhost:7000/stremioget/stremio/v1`` command line.

Windows: ``%LOCALAPPDATA%\Programs\LNV\Stremio\Stremio.exe start --addon=http://localhost:7000/stremioget/stremio/v1``

macOS: ``/Applications/Stremio.app/Contents/MacOS/Electron start --addon=http://localhost:7000/stremioget/stremio/v1``

To load it in the web version, open ``http://alpha4.strem.io/?addon=http://localhost:7000/stremioget/stremio/v1`` in your browser.

Step 5: implement metadata (Discover catalogue)
==============================

We have 3 methods serving meta: ``meta.find`` handles loading the catalogue and metadata, ``meta.get`` which loads metadata for individual items, and ``meta.search`` which performs a full text search.

**For now, we have the simple goal of loading the movies we provide on the top of Discover.**

Append to index.js:
```javascript
// Add a "Hello World" tab in Discover by adding our own sort
manifest.sorts = [{ prop: "popularities.helloWorld", name: "Hello World", types: ["movie"] }];

// To provide meta for our movies, we'll just proxy the official cinemeta add-on
var client = new Stremio.Client();
client.add("http://cinemeta.strem.io/stremioget/stremio/v1");

methods["meta.find"] = function(args, callback) {
    // Proxy Cinemeta, but get only our movies
    args.query.imdb_id = args.query.imdb_id || { $in: Object.keys(dataset) };
    client.meta.find(args, function(err, res) {
        callback(err, res ? res.map(function(r) { r.popularities = { helloWorld: 10000 }; return r }) : null);
    });
}
```


Step 6: result
===================

![discover](screenshots/discover1.png)
![streaming from add-on](screenshots/streaming.png)

**And in the [open-source client](https://github.com/Stremio/stremio-addons-client/)**

![streaming from add-on](screenshots/stremio-addons-client.png)
![discover](screenshots/stremio-addons-client-discover.png)



