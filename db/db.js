use crossFiller

db.users.ensureIndex({email: 1}, {unique: true});
db.crosswords.ensureIndex({userId: 1});
db.words.ensureIndex({numChars: 1});
db.words.ensureIndex({rnd: 1});
db.words.ensureIndex({word: 1}, {unique: true});
db.grids.ensureIndex({gridData: 1}, {unique: true});

// db.grids.insert({gridData:"[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]"});
db.grids.insert({gridData:'[["."," ","."," ","."," ","."," ",".",".","."," ","."," ","."],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],["."," ","."," ","."," ","."," ",".",".","."," ","."," ","."],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],["."," ","."," ","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," "," "," ","."," "," "," "," "," "," "," "," "],[".",".","."," ",".",".","."," ","."," ",".",".","."," ","."],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],["."," ",".",".","."," ","."," ",".",".","."," ",".",".","."],[" "," "," "," "," "," "," "," ","."," "," "," "," "," "," "],["."," ","."," ","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],["."," ","."," ",".",".","."," ","."," ","."," ","."," ","."],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],["."," ","."," ",".",".","."," ","."," ","."," ","."," ","."]]'});
db.grids.insert({gridData:'[[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," "," ","."," "," "," "," "],[" ","."," ","."," ",".",".","."," ","."," ","."," ","."," "],[".",".",".","."," "," "," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," "," "," ",".",".",".","."],[" ","."," ","."," ","."," ",".",".","."," ","."," ","."," "],[" "," "," "," ","."," "," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "]]'});
db.grids.insert({gridData:'[[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ",".",".","."," ","."," ","."," ",".","."],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ",".",".","."," ","."," ","."," ",".",".","."," "],[" "," "," "," "," "," "," "," "," "," "," "," "," "," "," "],[" ",".",".","."," ","."," ","."," ",".",".","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[".","."," ","."," ","."," ",".",".","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "]]'});
db.grids.insert({gridData:'[[".","."," "," "," "," "," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ",".",".","."," ","."," ","."," ","."," ","."," "],[" "," "," "," ","."," "," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ",".",".",".",".","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," "," ","."," "," "," "," "],[" ","."," ","."," ","."," ","."," ",".",".","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," "," "," "," "," ",".","."]]'});
db.grids.insert({gridData:'[["."," "," "," "," "," "," "," "," "," ","."," "," "," "," "],["."," ","."," ","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," "," "," "," "," ","."," "," "," "," "," "," "],["."," ","."," ","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," "," "," ","."," "," "," "," "," "," "," "," "],[".",".","."," ",".",".","."," ","."," ","."," ","."," ","."],[" "," "," "," "," "," ","."," "," "," "," "," "," "," "," "],["."," ",".",".","."," ",".",".","."," ",".",".","."," ","."],[" "," "," "," "," "," "," "," ","."," "," "," "," "," "," "],["."," ","."," ","."," ","."," ",".",".","."," ",".",".","."],[" "," "," "," "," "," "," "," ","."," "," "," "," "," "," "],["."," ","."," ","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," "," "," ","."," "," "," "," "," "," "," "," "],["."," ","."," ","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," ","."," "," "," "," "," "," "," "," "," ","."]]'});
db.grids.insert({gridData:'[[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],["."," ","."," ","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," "," "," ","."," "," "," "," "," "," "," "," "],["."," ","."," ","."," "," "," ","."," ","."," ","."," ","."],[" "," "," "," "," "," ","."," "," "," "," "," "," "," "," "],["."," ","."," ","."," ","."," ","."," ",".",".","."," ","."],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[".",".","."," ","."," ","."," ","."," ","."," ",".",".","."],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],["."," ",".",".","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," "," "," "," "," ","."," "," "," "," "," "," "],["."," ","."," ","."," ","."," "," "," ","."," ","."," ","."],[" "," "," "," "," "," "," "," ","."," "," "," "," "," "," "],["."," ","."," ","."," ","."," ","."," ","."," ","."," ","."],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "]]'});
db.grids.insert({gridData:'[[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[".","."," ",".",".","."," ","."," ","."," ","."," ",".","."],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ",".",".","."," ",".",".","."," "],[" "," "," "," "," ","."," "," "," ","."," "," "," "," "," "],[" ",".",".","."," ",".",".","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[".","."," ","."," ","."," ","."," ",".",".","."," ",".","."],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "]]'});
db.grids.insert({gridData:'[[" "," "," "," "," "," "," "," "," "," "," "," "," "," ","."],[" ","."," ","."," ","."," ","."," ","."," ","."," ",".","."],[" "," "," "," "," ","."," "," "," "," "," "," "," "," ","."],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ",".",".","."," ","."," ","."," ",".",".","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ",".",".",".",".","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ",".",".","."," ","."," ","."," ",".",".","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],["."," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[".","."," ","."," ","."," ","."," ","."," ","."," ","."," "],["."," "," "," "," "," "," "," "," "," "," "," "," "," "," "]]'});
db.grids.insert({gridData:'[["."," "," "," "," "," "," "," "," "," "," "," "," "," ","."],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ",".",".","."," ","."," ","."," ",".",".","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ",".",".",".",".","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ",".",".","."," ","."," ","."," ",".",".","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],["."," "," "," "," "," "," "," "," "," "," "," "," "," ","."]]'});
//-----------------------------------
db.grids.insert({gridData:'[[" "," "," "," "," "," ",".","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ",".",".","."," ","."," ","."," ",".",".","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," ","."],[".","."," ","."," ",".",".",".",".","."," ","."," ",".","."],["."," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ",".",".","."," ","."," ","."," ",".",".","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ",".","."," "," "," "," "," "," "]]'});
db.grids.insert({gridData:'[[" "," "," "," "," "," "," "," "," ",".","."," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ",".",".","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," "," "," "," "," ",".","."],[" ","."," ","."," ",".",".",".",".","."," ","."," ","."," "],[".","."," "," "," "," "," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ",".",".","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," ",".","."," "," "," "," "," "," "," "," "," "]]'});
db.grids.insert({gridData:'[[" "," "," "," "," "," "," "," ","."," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," ","."," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ",".",".","."," ","."," "],[".",".","."," "," "," "," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," "," "," "," ",".",".","."],[" ","."," ",".",".","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," ","."," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," ","."," "," "," "," "," "," "," "," "]]'});
db.grids.insert({gridData:'[[" "," "," "," "," "," "," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," ","."," "," "," "," "," "," "," "," "," "," "," "],[" ","."," ","."," ",".",".","."," ","."," ","."," ",".","."],[" "," "," "," "," "," "," "," "," "," ","."," "," "," "," "],[" ",".",".","."," ","."," ","."," ","."," ",".",".","."," "],[" "," "," "," ","."," "," "," "," "," "," "," "," "," "," "],[".","."," ","."," ","."," ",".",".","."," ","."," ","."," "],[" "," "," "," "," "," "," "," "," "," "," ","."," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "],[" "," "," "," "," "," "," ","."," "," "," "," "," "," "," "],[" ","."," ","."," ","."," ","."," ","."," ","."," ","."," "], [" "," "," "," "," "," "," "," "," "," "," "," "," "," "," "]]'});
