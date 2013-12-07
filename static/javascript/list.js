function initiallise() {
	console.log("init");
	$.ajax({
		url: "/getCrosswordList",
		//url: "/getGridLayou/0",
		type: "POST",
		datatype: "json",
		success: function(data, stat, jqXHR) {
			console.log("success");
			console.log(stat);
			console.log(crosswords);
			var crosswords = data.crosswords;
			for(i=0; i<crosswords.length; i++) {
				$(".crosswordList").append('<li><a href="/edit/' + crosswords[i]._id + '">' + crosswords[i].title + '</a></li>');
			}
		},
		error: function(jqXHR, stat, err) {
			console.log("Get crossword list:" + stat);
			console.log(err);
		}
	});
	console.log("After ajax");
}
