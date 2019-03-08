
const finalhandler = require("finalhandler");

const { getRouter } = require("stremio-addon-sdk");

const addonInterface = require("./addon");

const router = getRouter(addonInterface);

module.exports = function(req, res) {
	router(req, res, finalhandler(req, res));
}
