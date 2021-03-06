// Munge words + add to db

var dbClient = require("mongodb").MongoClient;
var DB_URL = require("./config.js").getDBURL();

var Iconv = require("iconv").Iconv;
var fs = require("fs");

var iconv = new Iconv('ISO-8859-1', 'ASCII//TRANSLIT');
var allWords = fs.readFileSync("UKACD17.TXT");
allWords = iconv.convert(allWords).toString("ascii").replace(/[`'"]/g, "").replace(/\*/g, "'").split("\n");

console.log("Done convert to " + allWords.length + " words, starting load...");

dbClient.connect(DB_URL, function(err, db) {
	var words = db.collection("words");
	var wordEntry, insertData, i, done=0;
	var insMax = 50000;

	insertData = new Array();
	for(i=0; i<allWords.length; i++) {
		wordEntry = {};
		wordEntry.word = allWords[i].trim();
		if(wordEntry.word.length) {
			wordEntry.letters = wordEntry.word.toUpperCase().replace(/[^A-Z]/g, "").split("");
			wordEntry.numChars = wordEntry.letters.length;
			wordEntry.rnd = Math.random();

			insertData.push(wordEntry);
			done++;
			if(insertData.length == insMax) {
				words.insert(insertData, {w: 1}, function(err) { if(err) console.log(err); });
				insertData = new Array();
			}
		}
	}
	if(insertData.length) {
		words.insert(insertData, {w: 1}, function(err) { if(err) console.log(err); });
	}
	console.log("Finished " + done)
});
