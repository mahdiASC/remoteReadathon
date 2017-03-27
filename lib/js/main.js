// Alumni max 1 per app

//AUTH
var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keyVIWCOZULuFuVKd'
});

//fake
// var base = Airtable.base('appfTjwzFnNfRONRj');

//real
var base = Airtable.base('appwP7h3O1QziFUUw');

//Will contain all records as an array
var temp;
var keys, questions;


var userID;
function myID(){
    //not checking for if ID is in DB
    userID = $(".form-control").val();
    $(".form-control").val("");
    
    if(checkValidID(userID)){
        $("#userID").toggleClass("hidden");
        $("#but1").toggleClass("hidden");
        $("#but2").toggleClass("hidden");
        $("#userStats").toggleClass("hidden");
        loadStart();
    }else{
        if(userID=="blah"){
            window.location.href = "./trouble.html";
        }else{
            alert("Invalid User ID");
        }
    }
}

function loadStart(){
    temp=[];
    //loading statistics
    $("#userTotal").empty();

    // "waiting" modal
    $.showLoading({
        name: "line-scale"
    })
    //getting data from DB
    base('Table 2').select({
        view: "Eligible NYC"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function(record) {
            if(record.fields["on-time"]=="Yes"){
                temp.push(record);
            }
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    }, function done(err) {
        if (err) { alert(err); return; }
        //Getting stats for HTML update
        var stats = getCompleted();
        
        $("#priorReads").empty();
		var readContent = ""
        for(var i in stats.previous){
			readContent = readContent + "<li>"+ stats.previous[i]+"</li>";
            // $("#priorReads").append("<li>"+ stats.previous[i]+"</li>")
        }
		$("#priorReads").append("<ul>" + readContent + "</ul>");
        
        $("#priorHolds").empty();
        if(stats.holds.length>0){
            // $("#priorHolds").append("<h5>They are:</h5>");
            var holdContent ="";

            for(var i in stats.holds){
                var ID = stats.holds[i].fields["Unique Student ID"];
                holdContent = holdContent + "<li>"+ ID + "<button class='smallbutton' onclick=\""+"readHold('"+stats.holds[i].id+"')\" style='vertical-align:middle'>Read and Score</button></li>";
        }
            $("#priorHolds").append("<ul>" + holdContent + "</ul>");
        }


        if(checkUserDone()){
            $("#but1").addClass("hidden");
            $("#userTotal").text("There are no more apps for you to complete - Thank you!");
        }else{
            // there is a record the user has not completed AND it is not currently being reviewed
            $("#userTotal").text("You've completed " + stats.previous.length + " app(s) and have "+stats.holds.length+" on hold.");
        }

        // Adding input for holds
         var holds = temp.filter(function(record){
            return checkHold(record);
        });

        $.hideLoading();
    });
}

function checkValidID(input){
    var num = Number(input);
    if (num>99 && num<1000){ //ID's must be over 99 and less than 1000
        return true;
    }else{
        return false;
    }
}

function checkUserDone(){
    // checks if there are any valid spots for the user to fill out
    // Valid means record NOT complete and NOT on hold by use and NOT already read by user
    return !temp.some(function(record){
        return checkValidRecord(record,userID);
    })
}

function checkHold(record){
    //returns true if user already has hold on a record
    //false otherwise
    return record.fields.Score1==Number(userID)||record.fields.Score2==Number(userID)||record.fields.Score3==Number(userID);
}

function checkValidRecord(record){
    // returns true if the record is an open valid record for the user
    // Valid means record NOT complete and NOT on hold by user and NOT already read by user and (if user is alum NOT held by another alumni)
    var otherAlum = record.fields.readers ? !record.fields.readers.split("+").some((user)=>Number(user)>899) : true; //true if no allumni already read
    var alumn = Math.floor(Number(userID)/100)==9 ? !(record.fields.Score1>899||record.fields.Score2>899||record.fields.Score3>899)&&!otherAlum: false;

    return !checkHold(record)&&!checkUserScored(record)&&!checkCompleteRecord(record)&&!alumn;
}

function checkUserScored(record){
    //checks if the user has previously scored the record
    if(record.fields.readers){
        return record.fields.readers.split("+").includes(userID);
    }else{
        return false;
    }
}

function checkCompleteRecord(record){
    //returns true if a record if completely graded
    return record.fields.Score1<99&&record.fields.Score2<99&&record.fields.Score3<99
}

function reviewOn(){
    // sets up going into and out of grading session
    $("#but1").addClass("hidden");
    $("#but2").addClass("hidden");
    $("#userStats").addClass("hidden");
    $("#input").removeClass("hidden");
    $("#comments").val("");
}
var selectedStudent;

function getRandStudent(){
    //sets up for review a random student the user has not completed AND is not currently under review
    selectedStudent = undefined;
    reviewOn();
    $("#paras").empty(); //clear old data
    $.showLoading({
        name: "line-scale"
    })
    temp = [];
    base('Table 2').select({
            view: "Eligible NYC"
        }).eachPage(function page(records, fetchNextPage) {
            records.forEach(function(record) {
		    if(record.fields["on-time"]=="Yes"){
			temp.push(record);
		    }
            });

            fetchNextPage();
        }, function done(err) {
            if (err) { 
                alert(err); 
            }else{
                var valids = temp.filter(function(record){
                    //record doesn't include user && record not locked && available space
                    return checkValidRecord(record);
                })
                //random valid student
                selectedStudent = valids[Math.floor(Math.random()*valids.length)];

                // holding record then printing info to page
                var column;
                if(!selectedStudent.fields.Score1){  
                    column = "Score1";
                }else if(!selectedStudent.fields.Score2){
                    column = "Score2";
                }else{
                    column = "Score3";
                }
                var tempObj = {};
                tempObj[column]=Number(userID);
                base('Table 2').update(selectedStudent.id, tempObj, function(err, record) {
                        if (err) { 
                            alert(err); 
                        }
                        //printing info to page once locked
                        var content;
                        $("#paras").append("<h1> STUDENT: "+ selectedStudent.fields["Unique Student ID"]  +"</h1>");
                        keys = Object.keys(selectedStudent.fields).filter((text)=>text.search(/\?/)!=-1); //finding anything with a question mark = a question!
                        //Adding 1 to questions "number" then resorting
                        keys.sort();
                        for(k in keys){
                            content = "<h2>" + (Number(keys[k].slice(0,1))+1)+keys[k].slice(1) +"</h2>";
                            content = content + "<p>" + record.fields[keys[k]] + "</p>";
                            $("#paras").append(content);
                        }
                });
            }
            $.hideLoading();
        });
}


function getCompleted(){
    //takes "temp" array of airtable records and returns object of stats of apps
    // total = number of total apps
    // completed = number of completed apps
    // previous = array of strings (student ids) user has already scored
    // holds = array of records user still has on hold

    var total = temp.length;
    var completed = 0;
    var previous = [];
    var holds=[];
    temp.forEach(function(record){
        if(checkCompleteRecord(record)){
            completed++;
        }

        if(checkUserScored(record)){
            previous.push(record.fields["Unique Student ID"]);
        }else if(checkHold(record)){
            holds.push(record);
        }
    });

    return {
        total: total,
        completed: completed,
        previous: previous,
        holds: holds
    };
}



function goBack(){
    // $("[id^='but']").addClass("hidden");
    // $("#userID").removeClass("hidden");
    // $("#userStats").addClass("hidden");
    // userID=undefined; //just in case!
    window.location.replace("index.html");
}

function reviewOff(){
    $("#but1").toggleClass("hidden");
    $("#but2").toggleClass("hidden");
    $("#userStats").toggleClass("hidden");
    $("#input").toggleClass("hidden");
    loadStart();
}

function findStudent(ID){
    // takes a number string and returns student id (unique ID in Airtable)
    var i = 0;
    do{
        if(temp[i].fields["Unique Student ID"]==Number(ID)){
            return temp[i].id;
        }
        i++;
    }while(i<temp.length);
    return undefined;
}

function enterData(){
    //Clear before adding
    $("#paras").empty();
    var userScore = Number($('input[name=score]:checked').val());
	$('input[name="score"]').prop('checked', false);
	$("#scoremeaning").html("");
    var userComment = $("#comments").val();
    $.showLoading({
        name: "line-scale"
    })
    base('Table 2').find(selectedStudent.id, function(err, record) {
        if (err) { console.error(err); return; }
        var column;
        if(record.fields.Score1==Number(userID)){
            column = "Score1";
        }else if(record.fields.Score2==Number(userID)){
            column = "Score2";
        }else{
            column = "Score3";
        }
        var tempObj = {};
        tempObj[column] = userScore;
        //adding user to readers
        tempObj["readers"] = record.fields.readers ? record.fields.readers+"+"+userID : userID;
        tempObj["comments"] = record.fields.comments ? record.fields.comments+"+"+userComment : userComment;
        //resetting student
        base('Table 2').update(record.id, tempObj, function(err, record) {
                if (err) { 
                    alert(err);
                }else{
                    alert("Record "+ record.fields["Unique Student ID"] + " updated successfully");                  
                }
                reviewOff();
                $.hideLoading();
        });
    });
    
}

function findStudent(ID){
    // takes a number string of record.id and returns student app object
    var i = 0;
    do{
        if(temp[i].id==ID){
            return temp[i];
        }
        i++;
    }while(i<temp.length);
    return undefined;
}

function readHold(airID){
    // Will setup reading screen akin to randStudent
    // var select = $("button[onclick=\"updateHold('"+airID+"')\"]").prev();
    // $("button[onclick=\"updateHold('"+airID+"')\"]").parent().addClass("hidden");
    // var val = select.val();
    selectedStudent = findStudent(airID);
    reviewOn();
    $("#paras").empty(); //clear old data
    $.showLoading({
        name: "line-scale"
    })
    base('Table 2').find(selectedStudent.id, function(err, record) {
        if (err) { 
            alert(err);
            reviewOff(); 
        }
        //printing info to page once locked
        var content;
        $("#paras").append("<h1> STUDENT: "+ selectedStudent.fields["Unique Student ID"]  +"</h1>");
        keys = Object.keys(selectedStudent.fields).filter((text)=>text.search(/\?/)!=-1); //finding anything with a question mark = a question!
        keys.sort();
        for(k in keys){
            content = "<h2>" + (Number(keys[k].slice(0,1))+1)+keys[k].slice(1) +"</h2>";
            content = content + "<p>" + record.fields[keys[k]] + "</p>";
            $("#paras").append(content);
        }
        $.hideLoading();
    });
}


function ticker(){
    //simply shows percentage of total app read
    temp = [];
    //getting data from DB
    base('Table 2').select({
        view: "Eligible NYC"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            if(record.fields["on-time"]=="Yes"){
                temp.push(record);
            }
        });
        fetchNextPage();
    }, function done(err) {
        if (err) { alert(err); return; }
        var total = temp.length;
        var completed = temp.filter(function(record){
            return checkCompleteRecord(record);
        })

        $("#readathonStat").text(completed.length + " out of "+ total+" TOTAL apps done = " + Math.round((completed.length/total)*100)+"% done!");
    });
}

function scoremeaning(score){
	var res = "<p class='scoremeaninglabel'>A score of "+score+" means:</p>";
	if (score==0){
		res = res+"<p class='scoremeaning'>This young man is not ready, or is simply not a good fit for All Star Code.</p>";
	}
	else if (score==1){
		res = res+"<p class='scoremeaning'>This young man may be a good fit for All Star Code. He did a fine job on his application and we should give him a second look.</p>";
	}
	else if (score==2){
		res = res+"<p class='scoremeaning'>This guy gets it! He's definitely a good fit for All Star Code, and will contribute a lot to his cohort.</p>";
	}
	else{
		res="";
	}
	$("#scoremeaning").html(res);
}

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

ticker();

$(document).ready(function(){
    $('#myTextBox').keypress(function(e){
      if(e.keyCode==13)
        myID();
    });
});
