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
// arrays of clue numbers
var acrossClues = [];
var downClues = [];

function initiallise() {
	$("#titleEdit").hide();
	$("#dlgOverlay").hide();
	crosswordId = getURLId();
	if(crosswordId != "0") {
		$("#createControls").hide();
		$("#statusMsg").hide();
		$("#gridOuter").on("click", ".space", spaceClick);
		$("#gridOuter").on("dblclick", ".space", editAnswer);
		$("#enterWord").on("click", editAnswer);
		// Answers
		$("#answerEditHolder").on("keydown", ".answerEdit", checkAnswerEditKey);
		$("#answerEditHolder").on("keyup", ".answerEdit", function(){$(this).next().focus();});
		$("#answerUse").on("click", null, "dialog", saveAnswer);
		$("#answerCancel").on("click", function() { $("#dlgOverlay").hide(); });
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
				if(data.clues) {
					fillClues(data.clues);
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
			clueStart = false;

			if($('#gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (row == 1 || !$('#gridOuter [row="' + (row-1) + '"][col="' + col + '"]')[0]) &&
			  $('#gridOuter [row="' + (row+1) + '"][col="' + col + '"]')[0]) {

				clueStart = true;
				downClues.push(currAnswerNum);
				clueRow = row;
				do {
					$('#gridOuter [row="' + clueRow + '"][col="' + col + '"]').attr('down', currAnswerNum);
					clueRow++;
				} while($('#gridOuter [row="' + clueRow + '"][col="' + col + '"]')[0]);
			}

			if($('#gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (col == 1 || !$('#gridOuter [row="' + row + '"][col="' + (col-1) + '"]')[0]) &&
			  $('#gridOuter [row="' + row + '"][col="' + (col+1) + '"]')[0]) {

				clueStart = true;
				acrossClues.push(currAnswerNum);
				clueCol = col;
				do {
					$('#gridOuter [row="' + row + '"][col="' + clueCol + '"]').attr('across', currAnswerNum);
					clueCol++;
				} while($('#gridOuter [row="' + row + '"][col="' + clueCol + '"]')[0]);
			}

			if(clueStart) {
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
}

function getAnswer(dir, num) { //pass nothing to get currently selected answer
	//console.log("* getAnswer");
	if(!dir) {
		dir = currClueAnswer.dir;
	}
	if(!num) {
		num = currClueAnswer.num;
	}
	var answerText = "";
	var answerCells = $('#gridOuter [' + dir + '="' + num + '"] p');
	for(var i=0; i<answerCells.length; i++) {
		answerText += $(answerCells[i]).text();
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
		for(i=0; i<acrossClues.length; i++) {
			if(answers.across[acrossClues[i]]) {
				setAnswer(answers.across[acrossClues[i]], "across", acrossClues[i]);
			}
		}
	}
	if(answers.down) {
		for(i=0; i<downClues.length; i++) {
			if(answers.down[downClues[i]]) {
				setAnswer(answers.down[downClues[i]], "down", downClues[i]);
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
	$("#dlgOverlay").show();
	$("#answerEditHolder :first").focus();
}

function checkAnswerEditKey(ev) {
	console.log(ev);
	if(ev.keyCode == 13) { //enter
		console.log("Enter");
		ev.data = "dialog";
		saveAnswer(ev);
	} else if(ev.keyCode == 27) { //esc
		console.log("Esc");
		$("#dlgOverlay").hide();
	}
}

function saveAnswer(ev) {
	//console.log("* saveAnswer");
	var answer = "";
	if(ev.data == "dialog") {
		var letters = $("#answerEditHolder .answerEdit");
		for(var i=0; i<letters.length; i++) {
			answer += $(letters[i]).val();
		}
	}
	//console.log("About to save answer: " + answer);
	saveItem({itemType:"answer", direction:currClueAnswer.dir, number:currClueAnswer.num, itemData:answer.toUpperCase()}, answerCB);
}

function answerCB(saveData) {
	if(!saveData.error) {
		setAnswer(saveData.itemData);
		$("#dlgOverlay").hide();
	}
}

//================ Clue Stuff ================

function clueClick() {
	//hilight clue and answer
	console.log("* clueClick");
	$("#gridOuter .space").css("background-color", "white");
	$(".clueHolder").css("background-color", "white");
	$(this).css("background-color", HILIGHT);
	console.log('space: #gridOuter [' + $(this).attr("dir") + '="' + $(this).attr("clueNum") + '"]')
	$('#gridOuter [' + $(this).attr("dir") + '="' + $(this).attr("clueNum") + '"]').css("background-color", HILIGHT);
	currClueAnswer.dir = $(this).attr("dir");
	currClueAnswer.num = $(this).attr("clueNum");
}

function makeClues() {
	console.log("* makeClues");
	var i;
	for(i=0; i<acrossClues.length; i++) {
		//console.log("Appending " + acrossClues[i] + " across");
		$("#acrossClues").append('<div><div class="clueHolder" dir="across" clueNum="' + acrossClues[i] + '"><span class="clueNum">' + acrossClues[i] + '</span><span class="clue" dir="across" clueNum="' + acrossClues[i] + '"></span><input type="text" class="clueEdit" dir="across" clueNum="' + acrossClues[i] + '"></div></div>');
	}
	for(i=0; i<downClues.length; i++) {
		$("#downClues").append('<div><div class="clueHolder" dir="down" clueNum="' + downClues[i] + '"><span class="clueNum">' + downClues[i] + '</span><span class="clue" dir="down" clueNum="' + downClues[i] + '"></span><input type="text" class="clueEdit" dir="down" clueNum="' + downClues[i] + '"></div></div>');
	}
	$(".clueEdit").hide();
}

function fillClues(clues) {
	var i;
	if(cluess.across) {
		for(i=0; i<acrossClues.length; i++) {
			if(clues.across[acrossClues[i]]) {
				$('.clue[dir="across"][clueNum="' + acrossClues[i] + '"]').text(clues.across[acrossClues[i]]);
			}
		}
	}
	if(clues.down) {
		for(i=0; i<downClues.length; i++) {
			if(clues.down[downClues[i]]) {
				$('.clue[dir="down"][clueNum="' + downClues[i] + '"]').text(clues.down[downClues[i]]);
			}
		}
	}
}

function editClue() {
	$('.clueHolder .clueEdit[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').val($('.clueHolder .clue[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').text());
	$('.clueHolder .clue[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').hide();
	$('.clueHolder .clueEdit[dir="' + currClueAnswer.dir + '"][clueNum="' + currClueAnswer.num + '"]').show();
}

function checkClueEditKey(ev) {
	//console.log(ev);
	if(ev.keyCode == 13) { //enter
		//console.log("Enter");
		saveItem({itemType:"clue", direction:currClueAnswer.dir, number:currClueAnswer.num, itemData:$(this).val().toUpperCase()}, clueCB);
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

function flashStatusMsg(msg, error) {
	var color = 'black';
	if(error) {
		color = 'red';
	}
	$("#statusMsg").text(msg).css('color', color).show().delay(2000).fadeOut(1000);
}
