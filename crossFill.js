// CrossFill server

var dbClient = require('mongodb').MongoClient;
var DB_URL = "mongodb://localhost:27017/crossFill";

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
	"/getGridLayout/`crosswordId`": {
		"POST": function(req, res, tokens, values) {
			dbClient.connect(DB_URL, function(err, db) {
				var coll;
				if(tokens.crossWordId) {
					coll = db.collection("crosswords");
					var id =  ObjectID.createFromHexString(tokens.crosswordId);
					sendGridLayout(coll, id, req, res);
				} else {
					coll = db.collection("grids");
					coll.distinct("_id", function(err, ids) {
						if(ids.length) {
							sendGridLayout(coll, ids[Math.floor(Math.random()*ids.length)], req, res);
						} else {
							router.missing(req, res);
						}
					});
				}
			});
		}
	},
	"/createCrossword": {
		"POST": function(req, res) {}
	},

	// Other
	"`405`": function(req, res) {
		router.missing(req, res);
	}
});

function sendGridLayout(collection, id, request, response) {
	collection.findOne({_id:id}, function(err, result) {
		if(result) {
			var body = "{gridLayout:" + result.gridLayout + ",id:" + id.toHexStrinng() + "}";
			response.writeHead(200, {
				"Content-length": body.length,
				"Content-type": "application/json"
			});
			response.end(body);
		} else {
			router.missing(request, response);
		}
	});
}

require("http").createServer(router).listen(8080);
