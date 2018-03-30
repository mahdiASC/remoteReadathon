// hover over specific elements shows explaination
$("#showholdexplain").hover(function(e){
	var x = e.pageX;
    var y = e.pageY;
    $("#holdexplain").css({
		"left": x,
		"top": y,
		"display":"block"
		});
	}, function(){
		$("#holdexplain").css({"display":"none"});
})

// allows users to input with hitting 'Enter'
$(document).ready(function(){
    $('#userID').keypress(function(e){
      if(e.keyCode==13)
	  document.getElementById("startButton").click();
    });
});

let startReading = function(){
	// check if number is valid
	let userID = $("#userID").val();
	$("#userID").val("");
	
	if(userID.length!==3 || isNaN(Number(userID))){
		if(userID==="blah"){
			window.location.href = "./trouble.html";
		}else{
			return displayError("Invalid User ID");
		}
	}

	// loading user
	readathon.setUser(userID);

	// hide login container
	hideElement($(".login-container"));
	// show console container
	showElement($(".user-console-container"));
}

let displayError = function(err){
	alert(err);
}

let hideElement = function(elem){
	elem.css({"display":"none"});
}

let showElement = function(elem){
	elem.css({"display":"initial"});
}
