// allows users to input by hitting 'Enter'
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
	readathon.setUser(Number(userID));

	// hide login and show console
	$(".login-container").fadeOut(750,()=>$(".user-console-container").fadeIn(1500));
}

let displayError = function(err){
	alert(err);
}

// icky global!
let readathon = new Readathon;
