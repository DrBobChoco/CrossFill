// CrossFill server

var bee = require("beeline");
var router = bee.route({
	// Static paths
	"/": bee.staticFile("./static/index.html", "text/html"),
	"/edit/`crosswordId`": bee.staticFile("./static/edit.html", "text/html"),
	"/list/`userId`": bee.staticFile("./static/list.html", "text.html"),
	"/css/`path...`": bee.staticDir("./static/css/", {".css": "text/css"}),
	"/images/`path...`": bee.staticDir("./static/images/", {".jpg": "image/jpeg", ".gif": "image/gif"}),
	"/javascript/`path...`": bee.staticDir("./static/javascript/", {".js": "text/javascript"}),

	// Application functions
	"/getGridInfo/`crosswordId`": {
		"POST": function(req, res, tokens, values) {}
	},
	"/createCrossword": {
		"POST": function(req, res) {}
	}
});

require("http").createServer(router).listen(8080);
