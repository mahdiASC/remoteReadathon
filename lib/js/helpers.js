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
    $('#myTextBox').keypress(function(e){
      if(e.keyCode==13)
        myID();
    });
});