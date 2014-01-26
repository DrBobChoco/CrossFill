var HILIGHT = "#FFFA97";

var crosswordId = 0;
var gridLayout = [];
var currSpace = {
		row: 0,
		col: 0
	};
var currClueAnswer = {
		dir: "",
		num: 0
	};
// also use as list of which answers exist in each direction
var acrossAnswerLocked = [];
var downAnswerLocked = [];
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
	if(gridLayout.length) {
		gridLayout = [];
		$("#gridOuter").empty();
		//empty clue area
	}

	//console.log("About to call /getCrosswordInfo/" + crosswordId);
	$.ajax({
		url: "/getCrosswordInfo/" + crosswordId,
		type: "POST",
		dataType: "json",
		success: function(data, stat, jqXHR) {
			//console.log(JSON.stringify(data));
			gridLayout = data.gridLayout;
			makeGrid();
			if(crosswordId != "0") {
				if(data.title) {
					$("#crosswordTitle").text(data.title);
				}
				if(data.answer) {
					fillAnswers(data.answer);
				}
				makeClues();
				if(data.clue) {
					fillClues(data.clue);
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
			gridLayout: JSON.stringify(gridLayout)
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
			//console.log("gridLayout[" + row + "][" + col + "] -" + gridLayout[row][col] + "-");
			if(gridLayout[row][col]) {
				cellClass = "block";
				rowCol = '';
				content = '';
			} else {
				cellClass = "space";
				rowCol = 'row="' + (row+1) + '" col="' + (col+1) + '" ';
				content = '<p> </p>';
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
	for(row=1; row<=15; row++) {
		for(col=1; col<=15; col++) {
			answerStart = false;

			if($('#gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (row == 1 || !$('#gridOuter [row="' + (row-1) + '"][col="' + col + '"]')[0]) &&
			  $('#gridOuter [row="' + (row+1) + '"][col="' + col + '"]')[0]) {

				answerStart = true;
				//downAnswerLocked.push(currAnswerNum);
				downAnswerLocked[currAnswerNum] = false;
				answerRow = row;
				do {
					$('#gridOuter [row="' + answerRow + '"][col="' + col + '"]').attr('down', currAnswerNum);
					answerRow++;
				} while($('#gridOuter [row="' + answerRow + '"][col="' + col + '"]')[0]);
			}

			if($('#gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (col == 1 || !$('#gridOuter [row="' + row + '"][col="' + (col-1) + '"]')[0]) &&
			  $('#gridOuter [row="' + row + '"][col="' + (col+1) + '"]')[0]) {

				answerStart = true;
				//acrossAnswerLocked.push(currAnswerNum);
				acrossAnswerLocked[currAnswerNum] = false;
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
			//console.log("Chage direction");
			dir = (currClueAnswer.dir == "across" ? "down" : "across");
		}

		//console.log("dir -" + dir);

		$("#gridOuter .space").css("background-color", "white");
		$(".clueHolder").css("background-color", "white");
		//console.log("Selector -" + 'gridOuter [' + dir + '="' + $(this).attr(dir) + '"]' + "-");
		$('#gridOuter [' + dir + '="' + $(this).attr(dir) + '"]').css("background-color", HILIGHT);
		$('.clueHolder[dir="' + dir + '"][clueNum="' + $(this).attr(dir) + '"]').css("background-color", HILIGHT);

		currClueAnswer.dir = dir;
		currClueAnswer.num = $(this).attr(dir);
		currSpace.row = $(this).attr("row");
		currSpace.col = $(this).attr("col");
	}
	$("#enterWord").removeAttr("disabled");
	$("#suggestWords").removeAttr("disabled");
}

function getAnswer(onlyCross, dir, num) { //pass nothing to get currently selected answer
	//console.log("* getAnswer -" + onlyCross + "-" + dir + "-" + num + "-");
	if(!dir) {
		var dir = currClueAnswer.dir;
	}
	if(!num) {
		var num = currClueAnswer.num;
	}
	var otherDir = (dir == "across" ? "down" : "across");
	var answerText = "";
	var answerCells = $('#gridOuter [' + dir + '="' + num + '"] p');
	for(var i=0; i<answerCells.length; i++) {
		answerText += ((!onlyCross || $(answerCells[i]).parent().attr(otherDir)) ? $(answerCells[i]).text() : " ");
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

function fillAnswers(answers) {
	var i;
	if(answers.across) {
		//for(i=0; i<acrossAnswerLocked.length; i++) {
		for(i in acrossAnswerLocked) {
			//if(answers.across[acrossAnswerLocked[i]]) {
			if(answers.across[i]) {
				//setAnswer(answers.across[acrossAnswerLocked[i]], "across", acrossAnswerLocked[i]);
				setAnswer(answers.across[i], "across", i);
			}
		}
	}
	if(answers.down) {
		for(i in downAnswerLocked) {
			if(answers.down[i]) {
				setAnswer(answers.down[i], "down", i);
			}
		}
	}
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
			showDialog("#suggestedDlg");
			$("#suggestedSelect").focus();
		},
		error: function(jqXHR, stat, err) {
			console.log("getSuggestedWords: " + stat);
			console.log(err);
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
	//hilight clue and answer
	//console.log("* clueClick");
	$("#gridOuter .space").css("background-color", "white");
	$(".clueHolder").css("background-color", "white");
	$(this).css("background-color", HILIGHT);
	//console.log('space: #gridOuter [' + $(this).attr("dir") + '="' + $(this).attr("clueNum") + '"]')
	$('#gridOuter [' + $(this).attr("dir") + '="' + $(this).attr("clueNum") + '"]').css("background-color", HILIGHT);
	currClueAnswer.dir = $(this).attr("dir");
	currClueAnswer.num = $(this).attr("clueNum");
}

function makeClues() {
	//console.log("* makeClues");
	var i;
	//for(i=0; i<acrossAnswerLocked.length; i++) {
	for(i in acrossAnswerLocked) {
		//console.log("Appending " + acrossAnswerLocked[i] + " across");
		//$("#acrossClues").append('<div><div class="clueHolder" dir="across" clueNum="' + acrossAnswerLocked[i] + '"><span class="clueNum">' + acrossAnswerLocked[i] + '</span><span class="clue" dir="across" clueNum="' + acrossAnswerLocked[i] + '"></span><input type="text" class="clueEdit" dir="across" clueNum="' + acrossAnswerLocked[i] + '"></div></div>');
		$("#acrossClues").append('<div><div class="clueHolder" dir="across" clueNum="' + i + '"><span class="clueNum">' + i + '</span><span class="clue" dir="across" clueNum="' + i + '"></span><input type="text" class="clueEdit" dir="across" clueNum="' + i + '"></div></div>');
	}
	for(i in downAnswerLocked) {
		$("#downClues").append('<div><div class="clueHolder" dir="down" clueNum="' + i + '"><span class="clueNum">' + i + '</span><span class="clue" dir="down" clueNum="' + i + '"></span><input type="text" class="clueEdit" dir="down" clueNum="' + i + '"></div></div>');
	}
	$(".clueEdit").hide();
}

function fillClues(clues) {
	//console.log("* fillClues");
	//console.log(clues);
	var i;
	if(clues.across) {
		//for(i=0; i<acrossAnswerLocked.length; i++) {
		for(i in acrossAnswerLocked) {
			//if(clues.across[acrossAnswerLocked[i]]) {
			if(clues.across[i]) {
				//$('.clue[dir="across"][clueNum="' + acrossAnswerLocked[i] + '"]').text(clues.across[acrossAnswerLocked[i]]);
				$('.clue[dir="across"][clueNum="' + i + '"]').text(clues.across[i]);
			}
		}
	}
	if(clues.down) {
		for(i in downAnswerLocked) {
			if(clues.down[i]) {
				$('.clue[dir="down"][clueNum="' + i + '"]').text(clues.down[i]);
			}
		}
	}
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

function saveItem(saveData, callback) {
	saveData.crosswordId = crosswordId;
	$.ajax({
		url: "/saveItem",
		type: "POST",
		dataType: "text",
		data: saveData,
		success: function(data, stat, jqXHR) {
			console.log("* saveItem success");
			flashStatusMsg(saveData.itemType + " saved.");
			if(callback) {
				saveData.error = false;
				callback(saveData);
			}
		},
		error: function(jqXHR, stat, err) {
			console.log("* saveItem error");
			flashStatusMsg("Error: " + saveData.itemType + " was not saved.", true);
			if(callback) {
				saveData.error = true;
				callback(saveData);
			}
		}
	});
}

function showDialog(selector) {
	$(selector).show();
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
