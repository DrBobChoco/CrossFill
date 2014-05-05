// CrossFiller page rendering

var nunjucks = require("nunjucks");
nunjucks.configure("templates");

var ERR_MSG = require("./errMsg.js");

var router;

function showSignup(req, res, signupInfo) {
	var context = {
		"noMenu": true,
		"signup": true,
		"title": "Sign Up to CrossFiller",
		"statusMsgs": ["All fields are required."]
	};
	if(signupInfo) {
		context.name = signupInfo.name;
		context.email = signupInfo.email;
		if(signupInfo.errors) {
			context.errors = signupInfo.errors;
		}
	}
	safeRender(req, res, "profile/edit.html", context);
}

/**
 * Async waterfall final function
 * In: error, request, response, user (inc. status message)
 * Out: nothing
 */
function showProfileEdit(err, req, res, user) {
	//console.log("* showProfileEdit");
	if(err) {
		if(err.message == ERR_MSG.notLoggedIn) {
			res.writeHead(303, {"Location": "/"});
			res.end();
		} else {
			router.error(req, res, err);
		}
	} else {
		user.title = "Edit Profile";
		safeRender(req, res, "profile/edit.html", user);
	}
}

function safeRender(req, res, template, context) {
	try {
		sendOK(res, nunjucks.render(template, context), "text/html");
	}
	catch(err) {
		console.log(err);
		router.error(req, res, new Error("Mystery server error No.1."));
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

module.exports = function(routerIn) {
	router = routerIn;

	return {
		showSignup: showSignup,
		showProfileEdit: showProfileEdit,
		safeRender: safeRender,
		sendOK: sendOK
	};
}
