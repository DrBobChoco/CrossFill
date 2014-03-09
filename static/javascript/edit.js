var HILIGHT = "#FFFA97";
var UNLOCKED = "red";
var LOCKED = "#444";
var BOTH_DIRS = ['across', 'down'];
function otherDir(dir) {
	return  dir == 'across' ? 'down' : 'across';
};

/**
 * Todo
 * disable / enable buttons as needed
 */

var crosswordId = 0;
var gridData = [];
var currSpace = {
	row: 0,
	col: 0
};
var currClueAnswer = {
	dir: "",
	num: 0
};
// also use as list of which answers exist in each direction
var answerLocked = {
	'across': [],
	'down': []
};
var suggestedLetters;

function initiallise() {
	$("#titleEdit").hide();
	$("#dlgOverlay").hide();
	$("#answerDlg").hide();
	$("#suggestedDlg").hide();
	crosswordId = getURLId();
	if(crosswordId != "0") {
		$("#createControls").hide();
		$("#statusMsg").hide();
		$("#gridOuter").on("click", ".space", spaceClick);
		$("#gridOuter").on("dblclick", ".space", editAnswer);
		// Edit controls
		$("#enterWord").on("click", editAnswer);
		$("#suggestWords").on("click", getSuggestedWords);
		//$("#fillGrid").on("click", );
		$("#lockUnlock").on("click", toggleCurrAnswerLock);
		// Answers
		$("#answerEditHolder").on("keydown", ".answerEdit", "#answerDlg", checkAnswerKey);
		$("#answerEditHolder").on("keyup", ".answerEdit", function() { $(this).next().focus(); });
		$("#answerUse").on("click", null, "#answerDlg", saveAnswer);
		$("#answerCancel").on("click", function() { hideDialog("#answerDlg"); });
		$("#suggestedDlg").on("keydown", null, "#suggestedDlg", checkAnswerKey);
		$("#suggestedUse").on("click", null, "#suggestedDlg", saveAnswer);
		$("#suggestedCancel").on("click", function() { hideDialog("#suggestedDlg"); });
		// Clues
		$("#cluePanel").on("click", ".clueHolder", clueClick);
		$("#cluePanel").on("dblclick", ".clueHolder", editClue);
		$("#cluePanel").on("keydown", ".clueEdit", checkClueEditKey);
	} else {
		$("#editControls").hide();
		$("#newGridBtn").on("click", loadCrossword);
		$("#createBtn").on("click", createCrossword);
		$("#cluePanel").hide();
	}
	// Title
	$("#crosswordTitle").on("dblclick", editTitle);
	$("#titleEdit").on("keydown", checkTitleEditKey);
	$("#titleEdit").on("blur", function() { setTitle(false); });

	loadCrossword();
}

/**
 * Only used here at the mo. Move to general if needed elsewhere
 */
function getURLId() {
	var urlBits = document.location.pathname.split('/');
	return urlBits[urlBits.length - 1]
}

function loadCrossword() {
	if(gridData.length) {
		gridData = [];
		$("#gridOuter").empty();
		//empty clue area
	}

	//console.log("About to call /getCrosswordInfo/" + crosswordId);
	$.ajax({
		url: "/getCrosswordInfo/" + crosswordId,
		type: "POST",
		dataType: "json",
		success: function(data, stat, jqXHR) {
			console.log(JSON.stringify(data));
			gridData = data.gridData; //includes answer character data
			makeGrid();
			if(crosswordId != "0") {
				if(data.title) {
					$("#crosswordTitle").text(data.title);
				}
				//lock answers
				if(data.answerLocked) {
					foreachClueAnswer(function(dir, num, locked) {
						if(locked[dir] && locked[dir][num]) answerLocked[dir][num] = true;
					}, data.answerLocked);
				}
				markLockedAnswers();
				//make clues
				foreachClueAnswer(function(dir, i) {
					$("#" + dir + "Clues").append('<div><div class="clueHolder" dir="' + dir + '" clueNum="' + i + '"><span class="clueNum">' + i + '</span><span class="clue" dir="' + dir + '" clueNum="' + i + '"></span><input type="text" class="clueEdit" dir="' + dir + '" clueNum="' + i + '"></div></div>');
				});
				$(".clueEdit").hide();
				//fill clues
				if(data.clue) {
					foreachClueAnswer(function(dir, num, clues) {
						if(clues[dir] && clues[dir][num]) $('.clue[dir="' + dir + '"][clueNum="' + num + '"]').text(clues[dir][num]);
					}, data.clue);
				}
			}
		},
		error: function(jqXHR, stat, err) {
			console.log("getCrosswordInfo: " + stat);
			console.log(err);
		}
	});
}

function createCrossword() {
	$.ajax({
		url: "/createCrossword",
		type: "POST",
		dataType: "json",
		data: {
			title: $("#crosswordTitle").text(),
			gridData: JSON.stringify(gridData)
		},
		success: function(data, stat, jqXHR) {
			console.log("create success");
			window.location.replace("/edit/" + data.crosswordId);
		},
		error: function(jqXHR, stat, err) {
			console.log("createCrossword: " + stat);
			console.log(err);
		}
	});
}

//================ Grid Stuff ================

function makeGrid() {
	var cellClass;
	var rowCol;
	var content;
	for(row=0; row<15; row++) {
		for(col=0; col<15; col++) {
			//console.log("gridData[" + row + "][" + col + "] -" + gridData[row][col] + "-");
			if(gridData[row][col] == ".") {
				cellClass = "block";
				rowCol = '';
				content = '';
			} else {
				cellClass = "space";
				rowCol = 'row="' + (row) + '" col="' + (col) + '" ';
				content = '<p>' + gridData[row][col] + '</p>';
			}
			if(col == 0) {
				cellClass += " rowStart";
			}
			$("#gridOuter").append('<div ' + rowCol + 'class="' + cellClass + '">' + content + '</div>');
		}
	}
	groupCells();
}

function groupCells() {
	var currAnswerNum = 1;
	for(row=0; row<15; row++) {
		for(col=0; col<15; col++) {
			answerStart = false;

			if($('#gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (row == 0 || !$('#gridOuter [row="' + (row-1) + '"][col="' + col + '"]')[0]) &&
			  $('#gridOuter [row="' + (row+1) + '"][col="' + col + '"]')[0]) {

				answerStart = true;
				//answerLocked.down.push(currAnswerNum);
				answerLocked.down[currAnswerNum] = false;
				answerRow = row;
				do {
					$('#gridOuter [row="' + answerRow + '"][col="' + col + '"]').attr('down', currAnswerNum);
					answerRow++;
				} while($('#gridOuter [row="' + answerRow + '"][col="' + col + '"]')[0]);
			}

			if($('#gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (col == 0 || !$('#gridOuter [row="' + row + '"][col="' + (col-1) + '"]')[0]) &&
			  $('#gridOuter [row="' + row + '"][col="' + (col+1) + '"]')[0]) {

				answerStart = true;
				//answerLocked.across.push(currAnswerNum);
				answerLocked.across[currAnswerNum] = false;
				answerCol = col;
				do {
					$('#gridOuter [row="' + row + '"][col="' + answerCol + '"]').attr('across', currAnswerNum);
					answerCol++;
				} while($('#gridOuter [row="' + row + '"][col="' + answerCol + '"]')[0]);
			}

			if(answerStart) {
				$('#gridOuter [row="' + row + '"][col="' + col + '"]').append('<div class="answerNum" answerNum="' + currAnswerNum + '">' + currAnswerNum + '</div>');
				currAnswerNum++;
			}
		}
	}
}

//================ Title Stuff ================

function editTitle() {
	$("#crosswordTitle").hide();
	$("#titleEdit").val($("#crosswordTitle").text()).show().focus(); 
}

function checkTitleEditKey(ev) {
	//console.log(ev);
	if(ev.keyCode == 13) { //enter
		console.log("Enter");
		if(crosswordId != "0") {
			console.log('!= "0"');
			saveItem({itemType:"title", itemData:$("#titleEdit").val()}, titleCB);
		} else { // new crossword, don't save till create
			console.log('== "0"');
			setTitle(true);
		}
	} else if(ev.keyCode == 27) { //esc
		console.log("Esc");
		setTitle(false);
	}
}

/**
 * Save title callback
 */
function titleCB(saveData) {
	console.log("titleCb");
	console.log(saveData);
	if(!saveData.error) {
		setTitle(true);
	}
}

function setTitle(update) {
	//console.log("Update -" + update);
	if(update) {
		$("#crosswordTitle").text($("#titleEdit").val());
	}
	$("#titleEdit").hide();
	$("#crosswordTitle").show();
}

//================ Answer Stuff ================

// Todo - check if locked, disable suggest button
function spaceClick() {
	//console.log("Click on r" + $(this).attr("row") + ",c" + $(this).attr("col"));
	//console.log("Part of (" + $(this).attr("across") + ") across, (" + $(this).attr("down") + ") down");
	//console.log("currSpace r" + currSpace.row + "c" + currSpace.col);
	var dir;
	if($(this).attr("row") != currSpace.row || $(this).attr("col") != currSpace.col ||
	  ($(this).attr("across") && $(this).attr("down"))) {
		if($(this).attr("row") != currSpace.row || $(this).attr("col") != currSpace.col) {
			//console.log("New space");
			dir = ($(this).attr("across") ? "across" : "down");
		} else {
			//console.log("Change direction");
			dir = (otherDir(currClueAnswer.dir));
		}
		//console.log("dir -" + dir);

		currClueAnswer.dir = dir;
		currClueAnswer.num = $(this).attr(dir);
		currSpace.row = $(this).attr("row");
		currSpace.col = $(this).attr("col");
		newSelection();
	}
}

function getAnswer(onlyLockedCross, dir, num) { //pass nothing to get currently selected answer
	//console.log("* getAnswer -" + onlyCross + "-" + dir + "-" + num + "-");
	if(!dir) {
		dir = currClueAnswer.dir;
	}
	if(!num) {
		num = currClueAnswer.num;
	}
	var crossDir = otherDir(dir);
	var crossDirNum;
	var answerText = "";
	var answerCells = $('#gridOuter [' + dir + '="' + num + '"] p');
	for(var i=0; i<answerCells.length; i++) {
		crossDirNum = $(answerCells[i]).parent().attr(crossDir);
		answerText += (!onlyLockedCross || (crossDirNum && answerLocked[crossDir][crossDirNum])) ? $(answerCells[i]).text() : " ";
	}
	//console.log("Returning " + answerText);
	return answerText;
}

function setAnswer(newAnswer, dir, num) {
	if(!dir) {
		dir = currClueAnswer.dir;
	}
	if(!num) {
		num = currClueAnswer.num;
	}
	var answerCells = $('#gridOuter [' + dir + '="' + num + '"] p');
	if(answerCells.length != newAnswer.length) {
		return false;
	}
	for(var i=0; i<newAnswer.length; i++) {
		$(answerCells[i]).text(newAnswer.charAt(i));
	}
	return true;
}

function toggleCurrAnswerLock() {
	console.log("Toggling lock on " + currClueAnswer.dir + ", " + currClueAnswer.num);
	saveItem({itemType:"answerLocked", direction:currClueAnswer.dir, number:currClueAnswer.num, itemData:!answerLocked[currClueAnswer.dir][currClueAnswer.num], statusType:"answer lock"}, lockCB);
}

function lockCB(saveData) {
	if(!saveData.error) {
		answerLocked[currClueAnswer.dir][currClueAnswer.num] = saveData.itemData;
		markLockedAnswers();
		setLockUnlockBtnText();
	}
}

function markLockedAnswers() {
	$("#gridOuter .space").css("border-color", UNLOCKED);
	foreachClueAnswer(function(dir, num) {
		//console.log("Checking lock on " + dir + ", " + num);
		if(answerLocked[dir][num]) {
			//console.log("Locking " + dir + ", " + num);
			$('#gridOuter .space[' + dir + '="' + num + '"]').css("border-color", LOCKED);
		}
	});
}

function setLockUnlockBtnText() {
	$("#lockUnlock").val(answerLocked[currClueAnswer.dir][currClueAnswer.num]?"Unlock":"Lock");
}

function editAnswer() {
	$("#answerPrompt").text("Answer for " + currClueAnswer.num + " " + currClueAnswer.dir + ":");
	$("#answerEditHolder").empty();
	var answer = getAnswer();
	for(var i=0; i<answer.length; i++) {
		$("#answerEditHolder").append('<input type="text" size="1" maxlength="1" value="' + answer.charAt(i) + '" class="answerEdit">');
	}
	showDialog("#answerDlg");
	$("#answerEditHolder :first").focus();
}

function checkAnswerKey(ev) {
	console.log(ev);
	if(ev.keyCode == 13) { //enter
		console.log("Enter");
		saveAnswer(ev);
	} else if(ev.keyCode == 27) { //esc
		console.log("Esc");
		hideDialog(ev.data);
	}
}

function XXcheckAnswerEditKey(ev) {
	console.log(ev);
	if(ev.keyCode == 13) { //enter
		console.log("Enter");
		ev.data = "#answerDlg";
		saveAnswer(ev);
	} else if(ev.keyCode == 27) { //esc
		console.log("Esc");
		hideDialog("#answerDlg");
	}
}

function getSuggestedWords() {
	showDialog("#suggestedDlg");
	$.ajax({
		url: "/getSuggestedWords/" + getAnswer(true).replace(/ /g, "%20"),
		type: "POST",
		dataType: "json",
		success: function(data, stat, jqXHR) {
			console.log("Suggested words:");
			console.log(data);
			suggestedLetters = [];
			var words = data.words;
			if(words.length) {
				$("#suggestedSelect").empty();
				for(var i=0; i<words.length; i++) {
					$("#suggestedSelect").append('<option value="' + i + '"' + (i?"":" selected") + '>'+ words[i].word + '</option>');
					suggestedLetters[i] = words[i].letters;
				}
				$("#suggestedUse").removeAttr("disabled");
				$("#suggestedSelect").show();
				$("#suggestedNoWords").hide();
			} else {
				$("#suggestedUse").attr("disabled", "disabled");
				$("#suggestedNoWords").show();
				$("#suggestedSelect").hide();
			}
			$("#suggestedDlg .wait").hide();
			$("#suggestedDlg .doneWait").show();
			$("#suggestedSelect").focus();
		},
		error: function(jqXHR, stat, err) {
			console.log("getSuggestedWords: " + stat);
			console.log(err);
			hideDialog("#suggestedDlg");
			flashStatusMsg("Error getting suggestions", true);
		}
	});
}

function XXcheckSuggestedKey(ev) {
	console.log(ev);
	if(ev.keyCode == 13) { //enter
		console.log("Enter");
		ev.data = "#suggestedDlg";
		saveAnswer(ev);
	} else if(ev.keyCode == 27) { //esc
		console.log("Esc");
		hideDialog("#suggestedDlg");
	}
}

function saveAnswer(ev) {
	//console.log("* saveAnswer");
	var answer = "";
	var letters, i;
	if(ev.data == "#answerDlg") {
		letters = $("#answerEditHolder .answerEdit");
		for(i=0; i<letters.length; i++) {
			answer += $(letters[i]).val();
		}
	}
	if(ev.data == "#suggestedDlg") {
		letters = suggestedLetters[$("#suggestedSelect").val()];
		for(i=0; i<letters.length; i++) {
			answer += letters[i];
		}
	}

	console.log("About to save answer: " + answer);
	// *** Need to change to row[], col[], saveData format ***
	saveItem({itemType:"answer", direction:currClueAnswer.dir, number:currClueAnswer.num, itemData:answer.toUpperCase(), dialog:ev.data}, answerCB);
}

function answerCB(saveData) {
	if(!saveData.error) {
		setAnswer(saveData.itemData);
		hideDialog(saveData.dialog);
	}
}

//================ Clue Stuff ================

function clueClick() {
	//console.log("* clueClick");
	currClueAnswer.dir = $(this).attr("dir");
	currClueAnswer.num = $(this).attr("clueNum");
	currSpace.row = 0;
	currSpace.col = 0;
	newSelection();
}

function editClue() {
	$('.clueHolder .clueEdit[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').val($('.clueHolder .clue[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').text());
	$('.clueHolder .clue[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').hide();
	$('.clueHolder .clueEdit[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').show().focus();
}

function checkClueEditKey(ev) {
	//console.log(ev);
	if(ev.keyCode == 13) { //enter
		//console.log("Enter");
		saveItem({itemType:"clue", direction:currClueAnswer.dir, number:currClueAnswer.num, itemData:$(this).val()}, clueCB);
	} else if(ev.keyCode == 27) { //esc
		console.log("Esc");
		setClue(false);
	}
}

function clueCB(saveData) {
	console.log("clueCb");
	console.log(saveData);
	if(!saveData.error) {
		setClue(true);
	}
}

function setClue(update) {
	if(update) {
		$('.clueHolder .clue[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').text($('.clueHolder .clueEdit[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').val());
	}
	$('.clueHolder .clueEdit[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').hide();
	$('.clueHolder .clue[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').show();
}

//================ Misc Stuff ================

function foreachClueAnswer(callback, args) {
	var num, d;
	var dir;

	for(d=0; d<2; d++) {
		dir = BOTH_DIRS[d];
		for(num in answerLocked[dir]) {
			if(answerLocked[dir].hasOwnProperty(num)) {
				callback(dir, num, args);
			}
		}
	}
}

function newSelection() {
	$("#gridOuter .space").css("background-color", "white");
	$(".clueHolder").css("background-color", "white");
	$('#gridOuter [' + currClueAnswer.dir + '="' + currClueAnswer.num + '"]').css("background-color", HILIGHT);
	$('.clueHolder[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').css("background-color", HILIGHT);

	setLockUnlockBtnText();

	$("#enterWord").removeAttr("disabled");
	$("#suggestWords").removeAttr("disabled");
	$("#lockUnlock").removeAttr("disabled");
}

function saveItem(saveData, callback) {
	saveData.crosswordId = crosswordId;
	//console.log(JSON.stringify(saveData));
	$.ajax({
		url: "/saveItem",
		type: "POST",
		dataType: "text",
		data: saveData,
		success: function(data, stat, jqXHR) {
			console.log("* saveItem success");
			if(!saveData.suppressStatus) {
				flashStatusMsg((saveData.statusType ? saveData.statusType : saveData.itemType) + " saved.");
			}
			if(callback) {
				saveData.error = false;
				callback(saveData);
			}
		},
		error: function(jqXHR, stat, err) {
			console.log("* saveItem error");
			if(!saveData.suppressStatus) {
				flashStatusMsg("Error: " + (saveData.statusType ? saveData.statusType : saveData.itemType) + " was not saved.", true);
			}
			if(callback) {
				saveData.error = true;
				callback(saveData);
			}
		}
	});
}

function showDialog(selector) {
	$(selector).show();
	$(selector + " .wait").show();
	$(selector + " .doneWait").hide();
	$("#dlgOverlay").show();
}

function hideDialog(selector) {
	$("#dlgOverlay").hide();
	$(selector).hide();
}

function flashStatusMsg(msg, error) {
	var color = 'black';
	if(error) {
		color = 'red';
	}
	$("#statusMsg").text(msg).css('color', color).show().delay(2000).fadeOut(1000);
}
