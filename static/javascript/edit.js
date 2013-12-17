var crosswordId = 0;
var gridLayout = [];
var currSpace = {
		row: 0,
		col: 0
	};
var currAnswer = {
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
		$("#enterWord").on("click", editAnswer);
	} else {
		$("#editControls").hide();
		$("#newGridBtn").on("click", loadCrossword);
		$("#createBtn").on("click", createCrossword);
	}
	// Handlers
	// Title
	$("#crosswordTitle").on("dblclick", editTitle);
	$("#titleEdit").on("keydown", checkTitleEditKey);
	$("#titleEdit").on("blur", function() { setTitle(false); });
	// Answers
	//$("#answerEdit").on("keydown", checkAnswerEditKey);
	$("#answerUse").on("click", null, "dialog", saveAnswer);
	$("#answerCancel").on("click", function() { $("#dlgOverlay").hide(); });
	// Questions

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
			if(data.title) {
				$("#crosswordTitle").text(data.title);
			}
			if(data.answer) {
				fillAnswers(data.answer);
			}
			//set up clue entries as needed by grid
			//fill clue entries
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
	if(crosswordId != "0") {
		$(".space").on("click", spaceClick);
		$(".space").on("dblclick", editAnswer);
	}
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
				$('#gridOuter [row="' + row + '"][col="' + col + '"]').append('<div class="clueNum" clueNum="' + currAnswerNum + '">' + currAnswerNum + '</div>');
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
			dir = (currAnswer.dir == "across" ? "down" : "across");
		}

		//console.log("dir -" + dir);

		$("#gridOuter .space").css("background-color", "white");
		//console.log("Selector -" + 'gridOuter [' + dir + '="' + $(this).attr(dir) + '"]' + "-");
		$('#gridOuter [' + dir + '="' + $(this).attr(dir) + '"]').css("background-color", "#FFFA97");

		currAnswer.dir = dir;
		currAnswer.num = $(this).attr(dir);
		currSpace.row = $(this).attr("row");
		currSpace.col = $(this).attr("col");
	}
	$("#enterWord").removeAttr("disabled");
}

function getAnswer(dir, num) { //pass nothing to get currently selected answer
	//console.log("* getAnswer");
	if(!dir) {
		dir = currAnswer.dir;
	}
	if(!num) {
		num = currAnswer.num;
	}
	var answerText = "";
	//var thisLetter;
	var answerCells = $('#gridOuter [' + dir + '="' + num + '"] p');
	//var allSpaces = true;
	for(var i=0; i<answerCells.length; i++) {
		//thisLetter = $(answerCells[i]).text();
		//console.log("Got " + thisLetter);
		//answerText += thisLetter; // poss charAt(0) as a safeguard?
		answerText += $(answerCells[i]).text();
		//if(thisLetter != " ") {
		//	allSpaces = false;
		//}
	}
	//if(allSpaces) {
	//	answerText = "";
	//}
	//console.log("Returning " + answerText);
	return answerText;
}

function setAnswer(newAnswer, dir, num) {
	if(!dir) {
		dir = currAnswer.dir;
	}
	if(!num) {
		num = currAnswer.num;
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
	$("#answerPrompt").text("Answer for " + currAnswer.num + " " + currAnswer.dir + ":");
	$("#answerEditHolder").empty();
	var answer = getAnswer();
	for(var i=0; i<answer.length; i++) {
		$("#answerEditHolder").append('<input type="text" size="1" maxlength="1" value="' + answer.charAt(i) + '" class="answerEdit">');
	}
	$(".answerEdit").on("keydown", checkAnswerEditKey);
	$(".answerEdit").on("keypress", function(){$(this).next().focus();});
	$("#dlgOverlay").show();
	$("#answerEditHolder :first").focus();
	//$("#answerEdit").attr("maxlength", $('#gridOuter [' + currAnswer.dir + '="' + currAnswer.num + '"]').length).val(getAnswer()).focus();
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
	saveItem({itemType:"answer", direction:currAnswer.dir, number:currAnswer.num, itemData:answer.toUpperCase()}, answerCB);
}

function answerCB(saveData) {
	if(!saveData.error) {
		setAnswer(saveData.itemData);
		$("#dlgOverlay").hide();
	}
}

//================ Clue Stuff ================

function editClue() {
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
