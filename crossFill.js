// CrossFill server

var async = require("async");
var bcrypt = require("bcrypt");
var Cookies = require("cookies");
var dbClient = require("mongodb").MongoClient;
var DB_URL = "mongodb://localhost:27017/crossFill";
var qs = require("querystring");

var ERR_MSG = {
	entityTooLarge: "Request entity too large",
	loginFailed: "Login failed",
	missingLoginData: "Missing login data",
	userNotFound: "User not found"
};

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
	"/login": {
		"POST": function(req, res) {
			async.waterfall([
					function(callback) {
							callback(null, req);
					},
					getLoginDetails,
					checkLogin
				], function(err, userId, loginSecret) {
						if(err) {
						} else {
							var cookies = new Cookies(req, res);
							cookies.set("userId", userId).set("loginCheck", loginSecret);
							res.writeHead(303, {
									"Location": "/list/" + userId;
							});
							res.end();
						}
			});
		}
	},
	"/getGridLayout/`crosswordId`": {
		"POST": function(req, res, tokens, values) {
			dbClient.connect(DB_URL, function(err, db) {
				var coll;
				if(tokens.crossWordId) {
					console.log("Have crosswordId");
					coll = db.collection("crosswords");
					var id =  ObjectID.createFromHexString(tokens.crosswordId);
					sendGridLayout(coll, id, req, res);
				} else {
					console.log("No valid crosswordId");
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

/**
 * Async waterfall function
 * In: request
 * Out: POST[email], POST[password]
 */
function getLoginDetails(req, callback) {
	var postBody = "";
	req.on("data", function(data) {
		postBody += data;
		if(postBody.length > 1e6) {
			req.connection.destroy();
			callback(new Error(ERR_MSG.entityTooLarge));
		}
	});
	req.on("end", function() {
		var post = qs.parse(postBody);
		if(!post.email || !post.password) {
			callback(new Error(ERR_MSG.missingLoginData));
		} else {
			callback(null, post.email, post.password);
		}
	});
}

/**
 * Async waterfall function
 * In: email, password
 * Out: userId, login cookie val
 */
function checkLogin(email, password, callback) {
	dbClient.connect(DB_URL, function(err, db) {
		var users = db.collection("users");
		users.findOne({email:email}, function(err, user) {
			if(err) {
				callback(err);
			} else if(!user) {
				callback(new Error(ERR_MSG.userNotFound));
			} else {
				var userId = user._id.toHexString();
				bcrypt.compare(password, user.pwHash, function(err, success) {
					if(err) {
						callback(err);
					} else if(!success) {
						callback(new Error(ERR_MSG.loginFailed));
					} else {
						var loginSecret = new ObjectID.toHexString();
						users.update({_id: user._id}, {loginSecret:loginSecret});
						callback(null, userId, loginSecret);
					}
				});
			}
		});
	});
}

function sendGridLayout(collection, id, request, response) {
	//console.log("passed id -" + id);
	collection.findOne({_id:id}, function(err, result) {
		if(err) {
			console.log("sGL findOne err -" + err);
			router.error(request, response, "Error finding gridLayout");
		}
		if(result) {
			//console.log("result -" + JSON.stringify(result));
			var body = '{"gridLayout":' + result.gridLayout + ',"id":"' + result._id.toHexString() + '"}';
			response.writeHead(200, {
				"Content-length": body.length,
				"Content-type": "application/json"
			});
			//console.log("body -" + body);
			response.end(body);
		} else {
			router.missing(request, response);
		}
	});
}

console.log("Starting...");
require("http").createServer(router).listen(8080);
