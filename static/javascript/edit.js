var crosswordId = 0;
var currSpace = {
		row: 0,
		col: 0
	};
var currClue = {
		dir: "",
		num: 0
	};
var gridLayout = [];

function initiallise() {
	$("#titleEdit").hide();
	loadCrossword();
	if(crosswordId) {
		$("#createControls").hide();
	} else {
		$("#editControls").hide();
	}
	$("#newGridBtn").on("click", makeGrid);
	$("#createBtn").on("click", createCrossword);
	$("#crosswordTitle").on("dblclick", editTitle);
	$("#titleEdit").on("keydown", checkTitleEditKey);
	//$("#titleEdit").on("blur", saveTitle);
}

/**
 * Only used here at the mo. Move to general if needed elsewhere
 */
function getURLId() {
	var urlBits = document.location.pathname.split('/');
	return urlBits[urlBits.length - 1]
}

function loadCrossword() {
	crosswordId = getURLId();
	makeGrid();
	if(crosswordId != "0") {
		console.log("crosswordId -" + crosswordId);
		$("#newGridBtn").hide();
		$("#createBtn").hide();
	}
}

function makeGrid() {
	if(gridLayout.length) {
		gridLayout = [];
		$(".gridOuter").empty();
	}

	$.ajax({
		url: "/getGridLayout/" + crosswordId,
		type: "POST",
		dataType: "json",
		success: function(data, stat, jqXHR) {
			console.log(JSON.stringify(data));
			gridLayout = data.gridLayout;
			for(row=0; row<15; row++) {
				for(col=0; col<15; col++) {
					//console.log("gridLayout[" + row + "][" + col + "] -" + gridLayout[row][col] + "-");
					if(gridLayout[row][col]) {
						cellClass = "block";
						rowCol = '';
					} else {
						cellClass = "space";
						rowCol = 'row="' + (row+1) + '" col="' + (col+1) + '" ';
					}
					if(col == 0) {
						cellClass += " rowStart";
					}
					$(".gridOuter").append('<div ' + rowCol + 'class="' + cellClass + '"></div>');
				}
			}
			groupClues();
			$(".space").on("click", spaceClick);
		},
		error: function(jqXHR, stat, err) {
			console.log("Make grid:" + stat);
			console.log(err);
		}
	});
}

function groupClues() {
	currClueNum = 1;
	for(row=1; row<=15; row++) {
		for(col=1; col<=15; col++) {
			clueStart = false;

			if($('.gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (row == 1 || !$('.gridOuter [row="' + (row-1) + '"][col="' + col + '"]')[0]) &&
			  $('.gridOuter [row="' + (row+1) + '"][col="' + col + '"]')[0]) {

				clueStart = true;
				clueRow = row;
				do {
					$('.gridOuter [row="' + clueRow + '"][col="' + col + '"]').attr('down', currClueNum);
					clueRow++;
				} while($('.gridOuter [row="' + clueRow + '"][col="' + col + '"]')[0]);
			}

			if($('.gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (col == 1 || !$('.gridOuter [row="' + row + '"][col="' + (col-1) + '"]')[0]) &&
			  $('.gridOuter [row="' + row + '"][col="' + (col+1) + '"]')[0]) {

				clueStart = true;
				clueCol = col;
				do {
					$('.gridOuter [row="' + row + '"][col="' + clueCol + '"]').attr('across', currClueNum);
					clueCol++;
				} while($('.gridOuter [row="' + row + '"][col="' + clueCol + '"]')[0]);
			}

			if(clueStart) {
				$('.gridOuter [row="' + row + '"][col="' + col + '"]').append('<div class="clueNum" clueNum="' + currClueNum + '">' + currClueNum + '</div>');
				currClueNum++;
			}
		}
	}
}

function createCrossword() {}

function editTitle() {
	$("#crosswordTitle").hide();
	$("#titleEdit").val($("#crosswordTitle").text()).show().focus(); 
	//$("#titleEdit").show().focus();
}

function checkTitleEditKey(ev) {
	console.log(ev);
	if(ev.keyCode == 13) { //enter
		console.log("Enter");
		saveTitle();
	} else if(ev.keyCode == 27) { //esc
		console.log("Esc");
		setTitle(false);
	}
}

function saveTitle(ev) {
	console.log("Save title id -" + crosswordId + "- ev -");
   	console.log(ev);
	if(crosswordId != "0") {
		//save to db and only change if success
		console.log('!= "0"');
	} else { // new crossword, don't save till create
		console.log('== "0"');
		setTitle(true);
	}
}

function setTitle(update) {
	console.log("Update -" + update);
	if(update) {
		$("#crosswordTitle").text($("#titleEdit").val());
	}
	$("#titleEdit").hide();
	$("#crosswordTitle").show();
}

function spaceClick() {
	//console.log("Click on r" + $(this).attr("row") + ",c" + $(this).attr("col"));
	//console.log("Part of (" + $(this).attr("across") + ") across, (" + $(this).attr("down") + ") down");
	//console.log("currSpace r" + currSpace.row + "c" + currSpace.col);
	if($(this).attr("row") != currSpace.row || $(this).attr("col") != currSpace.col ||
	  ($(this).attr("across") && $(this).attr("down"))) {
		if($(this).attr("row") != currSpace.row || $(this).attr("col") != currSpace.col) {
			//console.log("New space");
			dir = ($(this).attr("across") ? "across" : "down");
		} else {
			//console.log("Chage direction");
			dir = (currClue.dir == "across" ? "down" : "across");
		}

		//console.log("dir -" + dir);

		$(".gridOuter .space").css("background-color", "white");
		//console.log("Selector -" + 'gridOuter [' + dir + '="' + $(this).attr(dir) + '"]' + "-");
		$('.gridOuter [' + dir + '="' + $(this).attr(dir) + '"]').css("background-color", "yellow");

		currClue.dir = dir;
		currClue.num = $(this).attr(dir);
		currSpace.row = $(this).attr("row");
		currSpace.col = $(this).attr("col");
	}
}
