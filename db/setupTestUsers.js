var bcrypt = require("bcrypt");
var dbClient = require("mongodb").MongoClient;
var DB_URL = require("./localConfig.js").getDBURL();

userData = [
	{email: "drbobchoco@gmail.com", name: "Andrew Wilson", pw: "thisisonlyatest"},
	{email: "lilytiger@somewhere.com", name: "Lily Tiger", pw: "thingybob"}
];

dbClient.connect(DB_URL, function(err, db) {
	users = db.collection("users");
	newUsers = [];
	for(i=0; i<userData.length; i++) {
		var newUser = {};
		newUser.email = userData[i].email;
		newUser.name = userData[i].name;
		var salt = bcrypt.genSaltSync();
		newUser.pwHash = bcrypt.hashSync(userData[i].pw, salt);
		newUsers[i] = newUser;
	}
	console.log(newUsers);
	users.insert(newUsers, function() {});
});
