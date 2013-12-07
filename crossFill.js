// CrossFill server

var async = require("async");
var bcrypt = require("bcrypt");
var Cookies = require("cookies");
var dbClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var DB_URL = "mongodb://localhost:27017/crossFill";
var qs = require("querystring");

var ERR_MSG = {
	entityTooLarge: "Request entity too large",
	loginFailed: "Login failed",
	missingLoginData: "Missing login data",
	notLoggedIn: "User not logged in",
	userNotFound: "User not found"
};

var bee = require("beeline");
var router = bee.route({
	// Static paths
	"/": bee.staticFile("./static/index.html", "text/html"),
	"/edit/`crosswordId`": bee.staticFile("./static/edit.html", "text/html"),
	//"/list": bee.staticFile("./static/list.html", "text.html"),
	"/list": function(req, res) {
		async.waterfall([
			function(callback) {
				callback(null, req, res);
			},
			getLoggedInUser
		], function(err) {
				if(err) {
					res.writeHead(303, {
						"Location": "/"
					});
					res.end();
				} else {
					bee.staticFile("./static/list.html", "text.html")(req, res);
				}
			});
	},
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
				getPost,
				doLogin
			], function(err, userId, loginSecret) {
					if(err) {
						console.log(err);
						if(err.message == ERR_MSG.loginFailed ||
							err.message == ERR_MSG.missingLoginData ||
							err.message == ERR_MSG.userNotFound) {
							//all count as login fail
						} else {
							res.writeHead(303, {
								"Location": "/"
							});
							res.end();
						}
					} else {
						var cookies = new Cookies(req, res);
						cookies.set("userId", userId).set("loginCheck", loginSecret);
						res.writeHead(303, {
								"Location": "/list"
						});
						res.end();
					}
				});
		}
	},
	"/logout": function(req, res) {
		var cookies = new Cookies(req, res);
		//should probably $unset loginSecret in db for neatness
		cookies.set("userId").set("loginCheck");
		res.writeHead(303, {
			"Location": "/"
		});
		res.end();
	},
	"/getCrosswordList": {
		"POST": function(req, res) {
			console.log("Get crossword list");
			async.waterfall([
					function(callback) {
						callback(null, req, res);
					},
					getLoggedInUser,
					function(user, callback) {
						callback(null, user, res);
					},
					sendUserCrosswordList
			], function(err) {
					if(err) {
						router.error(req, res);
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
 * Out: POST object
 */
function getPost(req, callback) {
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
		callback(null, post);
	});
}

/**
 * Async waterfall function
 * In: post object
 * Out: userId, login cookie val
 */
function doLogin(post, callback) {
	console.log("doLogin - email: " + post.email + ", password: " + post.password);
	if(!post.email || !post.password) {
			callback(new Error(ERR_MSG.missingLoginData));
	} else {
		dbClient.connect(DB_URL, function(err, db) {
			var users = db.collection("users");
			users.findOne({email:post.email}, function(err, user) {
				if(err || !user) {
					callback(err?err:new Error(ERR_MSG.userNotFound));
				} else {
					console.log("User:");
					console.log(user);
					var userId = user._id.toHexString();
					bcrypt.compare(post.password, user.pwHash, function(err, success) {
						if(err || !success) {
							callback(err?err:new Error(ERR_MSG.loginFailed));
						} else {
							var loginSecret = new ObjectID().toHexString();
							//loginSecret = loginSecret.toHexString();
							users.update({_id: user._id}, {$set:{loginSecret:loginSecret}}, function(err) {});
							callback(null, userId, loginSecret);
						}
					});
				}
			});
		});
	}
}

/**
 * Async waterfall function
 * In: request, response
 * Out: user doc object
 */
function getLoggedInUser(req, res, callback) {
	var cookies = new Cookies(req, res);
	var userId = cookies.get("userId");
	var loginSecret = cookies.get("loginCheck");
	console.log("Get looged in user");
	if(userId.length != 24 || !loginSecret) {
		callback(new Error(ERR_MSG.notLoggedIn));
	} else {
		dbClient.connect(DB_URL, function(err, db) {
			var users = db.collection("users");
			users.findOne({_id:ObjectID.createFromHexString(userId), loginSecret:loginSecret}, function(err, user) {
				if(err || !user) {
					console.log("Error");
					callback(err?err:new Error(ERR_MSG.notLoggedIn));
				} else {
					console.log("Got a user " + user.name);
					callback(null, user);
				}
			});
		});
	}
}

/**
 * Async waterfall function
 * In: user object, response
 * Out: Nothing
 */
function sendUserCrosswordList(user, response, callback) {
	dbClient.connect(DB_URL, function(err, db) {
		var crosswords = db.collection("crosswords");
		crosswords.find({userId:user._id.toHexString()}, {fields:{_id:1,title:1}}).toArray(function(err, crosswords) {
			if(err) {
				callback(err);
			} else {
				if(!crosswords.length) {
					crosswords = [{"_id":0,"title":"You haven't made any crosswords yet."}];
				}
				var body = '{"crosswords":' + JSON.stringify(crosswords) + '}';
				response.writeHead(200, {
					"Content-length": body.length,
					"Content-type": "application/json"
				});
				response.end(body);
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
