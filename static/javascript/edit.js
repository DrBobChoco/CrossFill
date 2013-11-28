var crosswordId = 0;
var currSpace = {
		row: 0,
		col: 0
	};
var currClue = {
		dir: "",
		num: 0
	};

function makeGrid() {
	// call out for the gridInfo array based on crosswordId
	for(row=0; row<15; row++) {
		for(col=0; col<15; col++) {
			if(layoutInfo[row][col]) {
				cellClass = "block";
				rowCol = '';
			} else {
				cellClass = "space";
				rowCol = 'row="' + (row+1) + '" col="' + (col+1) + '" ';
			}
			if(col == 0) {
				cellClass += " rowStart";
			}
			$("#gridOuter").append('<div ' + rowCol + 'class="' + cellClass + '"></div>');
		}
	}
}

function groupClues() {
	currClueNum = 1;
	for(row=1; row<=15; row++) {
		for(col=1; col<=15; col++) {
			clueStart = false;

			if($('#gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (row == 1 || !$('#gridOuter [row="' + (row-1) + '"][col="' + col + '"]')[0]) &&
			  $('#gridOuter [row="' + (row+1) + '"][col="' + col + '"]')[0]) {

				clueStart = true;
				clueRow = row;
				do {
					$('#gridOuter [row="' + clueRow + '"][col="' + col + '"]').attr('down', currClueNum);
					clueRow++;
				} while($('#gridOuter [row="' + clueRow + '"][col="' + col + '"]')[0]);
			}

			if($('#gridOuter [row="' + row + '"][col="' + col + '"]')[0] &&
			  (col == 1 || !$('#gridOuter [row="' + row + '"][col="' + (col-1) + '"]')[0]) &&
			  $('#gridOuter [row="' + row + '"][col="' + (col+1) + '"]')[0]) {

				clueStart = true;
				clueCol = col;
				do {
					$('#gridOuter [row="' + row + '"][col="' + clueCol + '"]').attr('across', currClueNum);
					clueCol++;
				} while($('#gridOuter [row="' + row + '"][col="' + clueCol + '"]')[0]);
			}

			if(clueStart) {
				$('#gridOuter [row="' + row + '"][col="' + col + '"]').append('<div class="clueNum" clueNum="' + currClueNum + '">' + currClueNum + '</div>');
				currClueNum++;
			}
		}
	}
}

function spaceClick() {
	console.log("Click on r" + $(this).attr("row") + ",c" + $(this).attr("col"));
	console.log("Part of (" + $(this).attr("across") + ") across, (" + $(this).attr("down") + ") down");
	console.log("currSpace r" + currSpace.row + "c" + currSpace.col);
	if($(this).attr("row") != currSpace.row || $(this).attr("col") != currSpace.col ||
	  ($(this).attr("across") && $(this).attr("down"))) {
		console.log("Here we go...");
		if($(this).attr("row") != currSpace.row || $(this).attr("col") != currSpace.col) {
			console.log("New space");
			dir = ($(this).attr("across") ? "across" : "down");
		} else {
			console.log("Chage direction");
			dir = (currClue.dir == "across" ? "down" : "across");
		}

		console.log("dir -" + dir);

		$("#gridOuter .space").css("background-color", "white");
		console.log("Selector -" + 'gridOuter [' + dir + '="' + $(this).attr(dir) + '"]' + "-");
		$('#gridOuter [' + dir + '="' + $(this).attr(dir) + '"]').css("background-color", "yellow");

		currClue.dir = dir;
		currClue.num = $(this).attr(dir);
		currSpace.row = $(this).attr("row");
		currSpace.col = $(this).attr("col");
	}
}

function initiallise() {
	// derive crosswordId
	makeGrid();
	groupClues();
	$(".space").on("click", spaceClick);
}
