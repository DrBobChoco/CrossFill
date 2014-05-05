// CrossFiller mail functions

var dbClient = require("mongodb").MongoClient;
var DB_URL = require("./db/config.js").getDBURL();

var nodemailer = require("nodemailer");
var mailConfig = require("./mailConfig.js");
var smtpTransport = nodemailer.createTransport("SMTP",{
	service: "Gmail",
	auth: {
		user: mailConfig.getUser(),
		pass: mailConfig.getPassword()
	}
});

var nunjucks = require("nunjucks");
nunjucks.configure("templates");

var ERR_MSG = require("./errMsg.js");
var output;

function validateEmail(req, res, tokens, values) {
	dbClient.connect(DB_URL, function(err, db) {
		var users = db.collection("users");
		users.count({email:tokens.email, evSecret:tokens.secret}, function(err, result) {
			if(err || result != 1) {
				output.safeRender(req, res, "generic.html", {noMenu:true, body:ERR_MSG.generalUserError})
			} else {
				users.update({email:tokens.email}, {$set:{lastValidEmail:tokens.email, evSecret:""}}, function(err, result) {
					var body;
					if(err || !result) {
						body = ERR_MSG.generalUserError;
					} else {
						body = "Email, " + tokens.email + ", validated.";
					}
					output.safeRender(req, res, "generic.html", {noMenu:true, body:body});
				});
			}
		});
	});
}

function blockEmail(req, res, tokens, values) {
	dbClient.connect(DB_URL, function(err, db) {
		var users = db.collection("users");
		users.findOne({email:tokens.email, evSecret:tokens.secret}, function(err, user) {
			if(err || !user) {
				output.safeRender(req, res, "generic.html", {noMenu:true, body:ERR_MSG.generalUserError})
			} else {
				users.update({email:tokens.email}, {$set:{email:user.lastValidEmail, evSecret:""}}, function(errUser, result) {
					var blockedEmails = db.collection("blockedEmails");
					blockedEmails.insert({email:tokens.email}, function(errBlocked, result) {
						var body;
						if(errBlocked && errBlocked.code == 11000) {
							//Should never happen as user should never have a blocked email set
							console.log("Error: user with blocked email [" + user._id + ", " + tokens.email + "]");
							body = "Email, " + tokens.email + " already blocked.";
						} else if(errUser || errBlocked || !result) {
							body = ERR_MSG.generalUserError;
						} else {
							body = "Email, " + tokens.email + ", blocked.";
						}
						output.safeRender(req, res, "generic.html", {noMenu:true, body:body});
					});
				});
			}
		});
	});
}

function sendEmail(template, context) {
	var mailOptions = {
		from: mailConfig.getName() + " <" + mailConfig.getAddress() + ">",
		to: context.to,
		subject: context.subject,
	};
	try {
		mailOptions.text = nunjucks.render("email/" + template + ".txt", context);
	}
	catch(e) {}
	try {
		mailOptions.html = nunjucks.render("email/" + template + ".html", context);
	}
	catch(e) {}

	smtpTransport.sendMail(mailOptions, function(err, result) {
		if(err) {
			console.log("Mail error [" + template + " to " + context.to + "]:");
			console.log(err);
		}
		console.log("Mail result:");
		console.log(result);
	});
}

module.exports = function(outputIn) {
	output = outputIn;

	return {
		validateEmail: validateEmail,
		blockEmail: blockEmail,
		sendEmail: sendEmail
	}
};
