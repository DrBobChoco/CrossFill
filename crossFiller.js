// CrossFill server

var async = require("async");
var bcrypt = require("bcrypt");
var Cookies = require("cookies");
var dbClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var DB_URL = "mongodb://localhost:27017/crossFiller";
var qs = require("querystring");

var ERR_MSG = {
	crosswordNotFound: "Crossword not found",
	entityTooLarge: "Request entity too large",
	loginFailed: "Login failed",
	missingLoginData: "Missing login data",
	missingCrosswordData: "Missing crossword data",
	noGridIds: "No grid ids found",
	notLoggedIn: "User not logged in",
	userNotFound: "User not found"
};
var MAX_SUGGESTIONS = 8;

var bee = require("beeline");
var router = bee.route({
	// Static(ish) paths
	"/": function(req, res) {
		getLoggedInUser(req, res, function(err, user) {
			if(!err && user) {
				res.writeHead(303, {
					"Location": "/list"
				});
				res.end();
			} else {
				bee.staticFile("./static/index.html", "text/html")(req, res);
			}
		});
	},
	"/edit/`crosswordId`": loggedInStaticFile("./static/edit.html", "text/html"),
	"/list": loggedInStaticFile("./static/list.html", "text/html"),
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
							res.writeHead(303, {
								"Location": "/badLogin"
							});
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
			console.log("* Get crossword list");
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
						router.error(req, res, err);
					}
				});
		}
	},
	"/getCrosswordInfo/`crosswordId`": {
		"POST": function(req, res, tokens, values) {
			console.log("* getCrosswordInfo");
			//console.log(tokens);
			// Should realy double check logged in user and pass userId to sendCrosswordInfo
			async.waterfall([
				function(callback) {
					callback(null, req, res);
				},
				getLoggedInUser,
				function(user, callback) {
					dbClient.connect(DB_URL, function(err, db) {
						if(err) {
							callback(err);
						} else {
							if(tokens.crosswordId != "0") {
								//console.log("Have crosswordId");
								callback(null, db.collection("crosswords"), ObjectID.createFromHexString(tokens.crosswordId), user._id.toHexString(), true);
							} else {
								//console.log("No valid crosswordId");
								var coll = db.collection("grids");
								coll.distinct("_id", function(err, ids) {
									if(ids.length) {
										callback(err, coll, ids[Math.floor(Math.random()*ids.length)], null, true);
									} else {
										callback(new Error(ERR_MSG.noGridIds));
									}
								});
							}
						}
					});
				},
				getCrosswordInfo
			], function(err, crosswordInfo) {
					if(err) {
						if(err.message == ERR_MSG.crosswordNotFound) {
							router.missing(req, res);
						} else {
							router.error(req, res, err);
						}
					} else {
						sendOK(res, crosswordInfo, "application/json");
					}
				});
		}
	},
	"/createCrossword": {
		"POST": function(req, res) {
			var user;
			async.waterfall([
					function(callback) {
						callback(null, req, res);
					},
					getLoggedInUser,
					function(currUser, callback) {
						user = currUser;
						callback(null, req);
					},
					getPost,
					function(post, callback) {
						console.log("* pre createCrossword shim");
						callback(null, user, post);
					},
					createCrossword
			], function(err, crosswordId) {
					if(err) {
						router.error(req, res, err);
					} else {
						//console.log("going to send...");
						//console.log('{"crosswordId":"' + crosswordId.toHexString() + '"}');
						sendOK(res, '{"crosswordId":"' + crosswordId.toHexString() + '"}', "application/json");
					}
				});
		}
	},
	"/saveItem": {
		"POST": function(req, res) {
			var user;
			async.waterfall([
					function(callback) {
						callback(null, req, res);
					},
					getLoggedInUser,
					function(currUser, callback) {
						user = currUser;
						callback(null, req);
					},
					getPost,
					function(post, callback) {
						callback(null, user, post);
					},
					saveItem
			], function(err) {
					if(err) {
						//console.log("Sending error");
						console.log(err);
						router.error(req, res, err);
					} else {
						sendOK(res, "Item saved", "text/plain");
					}
				});
		}
	},
	"/getSuggestedWords/`pattern`": {
		"POST": function(req, res, tokens, values) {
			console.log("* suggestWords");
			dbClient.connect(DB_URL, function(err, db) {
				console.log("Pattern before -" + tokens.pattern + "-");
				var pattern = tokens.pattern.replace(/%20/g, ' ').toUpperCase();
				console.log("Pattern after -" + pattern + "-");
				var criteria = {};
				criteria.numChars = pattern.length;
				for(var i=0; i<pattern.length; i++) {
					if(pattern.charAt(i) != " ") {
						criteria["letters." + i] = pattern.charAt(i);
					}
				}
				console.log("Criteria:");
				console.log(criteria);
				var words = db.collection("words");
				words.count(criteria, function(err, count) {
					if(err) {
						router.error(req, res, err);
					} else {
						var skip = Math.random() * (MAX_SUGGESTIONS < count ? count - MAX_SUGGESTIONS : 0);
						words.find(criteria, {sort:[['rnd',1]], skip:skip, limit:MAX_SUGGESTIONS}).toArray(function(err, words) {
							if(err) {
								router.error(req, res, err);
							} else {
								sendOK(res, '{"words":' + JSON.stringify(words) + '}', "application/json"); }
						});
					}
				});
			});
		}
	},
	"/export/`crosswordId`": function(req, res, tokens, values) {
		console.log("* getCrosswordInfo");
		//console.log(tokens);
		var user;
		async.waterfall([
			function(callback) {
				callback(null, req, res);
			},
			getLoggedInUser,
			function(currUser, callback) {
				user = currUser;
				dbClient.connect(DB_URL, function(err, db) {
					callback(err, db.collection("crosswords"), ObjectID.createFromHexString(tokens.crosswordId), user._id.toHexString(), false);
				});
			},
			getCrosswordInfo,
			function(crosswordInfo, callback) {
				callback(null, crosswordInfo, user);
			},
			formatCrosswordExport
		], function(err, crosswordExport, crosswordTitle) {
				if(err) {
					if(err.message == ERR_MSG.crosswordNotFound) {
						router.missing(req, res);
					} else {
						router.error(req, res, err);
					}
				} else {
					sendOK(res, crosswordExport, "application/x-unknown", {"Content-Disposition": 'attachment; filename="' + crosswordTitle + '.txt"'});
				}
			});
	},

	// Other
	"`405`": function(req, res) {
		router.missing(req, res);
	}
});

//================ End Router ================

/**
 * Async waterfall function
 * In: request
 * Out: POST object
 */
function getPost(req, callback) {
	console.log("* getPost");
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
		//console.log(post);
		callback(null, post);
	});
}

/**
 * Async waterfall function
 * In: post object
 * Out: userId, login cookie val
 */
function doLogin(post, callback) {
	console.log("* doLogin - email: " + post.email + ", password: " + post.password);
	if(!post.email || !post.password) {
			callback(new Error(ERR_MSG.missingLoginData));
	} else {
		dbClient.connect(DB_URL, function(err, db) {
			var users = db.collection("users");
			users.findOne({email:post.email}, function(err, user) {
				if(err || !user) {
					callback(err?err:new Error(ERR_MSG.userNotFound));
				} else {
					//console.log("User:");
					//console.log(user);
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
	console.log("* Get logged in user");
	if(!userId || userId.length != 24 || !loginSecret) {
		callback(new Error(ERR_MSG.notLoggedIn));
	} else {
		dbClient.connect(DB_URL, function(err, db) {
			var users = db.collection("users");
			users.findOne({_id:ObjectID.createFromHexString(userId), loginSecret:loginSecret}, function(err, user) {
				if(err || !user) {
					console.log("Error");
					callback(err?err:new Error(ERR_MSG.notLoggedIn));
				} else {
					//console.log("Got a user " + user.name);
					callback(null, user);
				}
			});
		});
	}
}

/**
 * Wraps bee.static file and redirects to / if not logged in
 * returns a callback so can be used directly in the route setup
 */
function loggedInStaticFile(filePath, mediaType) {
	return function(req, res) {
		getLoggedInUser(req, res, function(err, user) {
			if(!err && user) {
				bee.staticFile(filePath, mediaType)(req, res);
			} else {
				res.writeHead(303, {
					"Location": "/"
				});
				res.end();
			}
		});
	};
}

/**
 * Async waterfall function
 * In: user object, response
 * Out: Nothing
 */
function sendUserCrosswordList(user, response, callback) {
	dbClient.connect(DB_URL, function(err, db) {
		var crosswords = db.collection("crosswords");
		crosswords.find({userId:user._id.toHexString()}, {fields:{_id:1,title:1}, sort:[['title',1]]}).toArray(function(err, crosswords) {
			if(err) {
				callback(err);
			} else {
				if(!crosswords.length) {
					crosswords = [{"_id":0,"title":"You haven't made any crosswords yet."}];
				}
				var body = '{"crosswords":' + JSON.stringify(crosswords) + '}';
				sendOK(response, body, "application/json");
			}
		});
	});
}

/**
 * Async waterfall function
 * In: collection object, crossword/grid id, user id string
 * Out: crossword info object/JSON
 */
function getCrosswordInfo(collection, id, userId, clientFormat, callback) {
	//console.log("passed id -" + id);
	criteria = {_id:id};
	if(userId) {
		criteria.userId = userId;
	}
	collection.findOne(criteria, function(err, result) {
		if(err) {
			console.log("sCI findOne err -" + err);
			callback(err);
		}
		if(result) {
			//console.log("result -" + JSON.stringify(result));
			//conditionally add on other info (title, answers, clues)
			if(clientFormat) {
				var resultJSON = '{"gridData":' + (typeof result.gridData == "string" ? result.gridData : JSON.stringify(result.gridData));
				if(result.title) {
					resultJSON += ',"title":"' + result.title + '"';
				}
				if(result.answer) {
					resultJSON += ',"answer":' + JSON.stringify(result.answer);
				}
				if(result.answerLocked) {
					resultJSON += ',"answerLocked":' + JSON.stringify(result.answerLocked);
				}
				if(result.clue) {
					resultJSON += ',"clue":' + JSON.stringify(result.clue);
				}
				resultJSON += '}';
				result = resultJSON;
				//console.log("gCI clientFormat:\n" + result);
			}
			callback(null, result);
		} else {
			callback(new Error(ERR_MSG.crosswordNotFound));
		}
	});
}

/**
 * Async waterfall function
 * In: crossword info object, user object
 * Out: crossword info in Across Lite text format, crossword title
 */
function formatCrosswordExport(crosswordInfo, user, callback) {
	var crosswordExport = "<ACROSS PUZZLE>\n";
	var date = new Date();
	var i, row, col;

	crosswordExport += "<TITLE>\n" + crosswordInfo.title + "\n";
	crosswordExport += "<AUTHOR>\n" + user.name + "\n";
	crosswordExport += "<COPYRIGHT>\n" + date.getFullYear() + " " + user.name + "\n";
	crosswordExport += "<SIZE>\n" + crosswordInfo.gridData[0].length + "x" + crosswordInfo.gridData.length + "\n"; //cols x rows
	crosswordExport += "<GRID>\n";
	for(row=0; row < crosswordInfo.gridData.length; row++) {
		for(col=0; col < crosswordInfo.gridData[0].length; col++) {
			crosswordExport += crosswordInfo.gridData[row][col]; 
		}
		crosswordExport += "\n";
	}
	crosswordExport += "<ACROSS>\n";
	for(i in crosswordInfo.clue.across) {
		crosswordExport += crosswordInfo.clue.across[i] + "\n";
	}
	crosswordExport += "<DOWN>\n";
	for(i in crosswordInfo.clue.down) {
		crosswordExport += crosswordInfo.clue.down[i] + "\n";
	}
	crosswordExport += "<NOTEPAD>\nExported from CrossFill.\n(c) 2014 Andrew Wilson.";

	callback(null, crosswordExport, crosswordInfo.title);
}

/**
 * Async waterfall function
 * In: user, post data
 * Out: new crosswordId object
 */
function createCrossword(user, post, callback) {
	console.log("* createCrossword");
	if(!post.title || !post.gridData) {
		//console.log("missing a value");
		//console.log(post);
		callback(new Error(ERR_MSG.missingCrosswordData));
	} else {
		//console.log("try insert");
		dbClient.connect(DB_URL, function(err, db) {
			var gridData = JSON.parse(post.gridData);

			var crosswords = db.collection("crosswords");
			crosswords.insert({userId:user._id.toHexString(), title:post.title, gridData:gridData}, function(err, result) {
				if(err) {
					console.log("insert error");
					callback(err);
				} else {
					//console.log("insert success");
					callback(null, result[0]._id);
				}
			});
		});
	}
}

/**
 * Async waterfall function
 * In: user, post data
 * Out: nothing
 */
function saveItem(user, post, callback) {
	console.log("* saveItem");
	//console.log(user);
	console.log(post);
	var types = ['title', 'answer', 'answerLocked', 'clue'];
	if(!post.crosswordId || !post.itemType || types.indexOf(post.itemType) == -1 || !post.itemData ||
			((post.itemType == "clue" || post.itemType == "answerLocked") && (!post.direction || !post.number)) ||
			(post.itemType == "answer" && (!post['row[]'] || !post['col[]']))) {
		callback(new Error(ERR_MSG.missingCrosswordData));
	} else {
		var setData = {};
		if(post.itemType == "title") {
			setData = {title:post.itemData};
		} else if(post.itemType == "answer") {
			console.log("Answer");
			var row = post['row[]'];
			var col = post['col[]'];
			for(var i=0; i<post.itemData.length; i++) {
				setData["gridData." + row[i] + "." + col[i]] = post.itemData.charAt(i);
			}
		} else {
			if(post.itemType == "answerLocked") {
				post.itemData = post.itemData.toLowerCase() == "false" ? false : true;
			}
			setData[post.itemType + "." + post.direction + "." + post.number] = post.itemData;
		}
		dbClient.connect(DB_URL, function(err, db) {
			var crosswords = db.collection("crosswords");
			console.log("About to update...");
			console.log(setData);
			crosswords.update({_id:ObjectID.createFromHexString(post.crosswordId),userId:user._id.toHexString()},
					{$set:setData}, function(err) {
				callback(err);
			});
		});
	}
}

function sendOK(response, body, type, extraHeaders) {
	var headers = {
		"Content-length": body.length,
		"Content-type": type
	};
	if(extraHeaders) {
		for(var xh in extraHeaders) {
			headers[xh] = extraHeaders[xh];
		}
	}
	response.writeHead(200, headers);
	response.end(body);
}

console.log("Starting...");
require("http").createServer(router).listen(8080);
