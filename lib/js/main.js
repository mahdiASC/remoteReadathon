//AUTH
var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keyVIWCOZULuFuVKd'
});

var base = Airtable.base('appfTjwzFnNfRONRj');

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
        $("#but3").toggleClass("hidden");
        $("#userStats").toggleClass("hidden");

        loadStart();
    }else{
        alert("Invalid User ID");
    }
}

function loadStart(){
    temp=[];
    //loading statistics
    $("#userTotal").empty();
    $("#readathonStat").empty();

    // "waiting" modal
    $.showLoading({
        name: "line-scale"
    })
    //getting data from DB
    base('Table 2').select({
        view: "View 3"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function(record) {
            temp.push(record);
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    }, function done(err) {
        if (err) { alert(err); return; }
        var stats = getCompleted(temp, userID);
        $("#readathonStat").text(stats.completed + " out of "+stats.total+" TOTAL apps done = " + Math.round((stats.completed/stats.total)*100)/100+"% done!");
        
        $(".list-group").empty();
        for(var i in stats.list){
            $(".list-group").append("<li>"+ stats.list[i]+"</li>")
        }
        if(checkUserDone(userID)){
            $("#but1").addClass("hidden");
            $("#userTotal").text("There are no more apps for you to complete - Thank you!");
        }else{
            // there is a record the user has not completed AND it is not currently being reviewed
            $("#userTotal").text("You've completed " + stats.previous + " app(s)!");
        }    
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

function checkUserDone(userID){
    // checks if there are any valid spots for the user to fill out
    return !temp.some(function(record){
        return checkValidRecord(record,userID);
    })
}

function checkValidRecord(record,userID){
    if(record.fields.lock==0&&!record.fields.Score){
        if(record.fields.readers){
            return !checkUserScored(record,userID);
        }else{
            return true;
        }
    }else{
        return false;
    }
}

function toggleReview(){
    // sets up going into and out of grading session
    $("#but1").toggleClass("hidden");
    $("#but2").toggleClass("hidden");
    $("#but3").toggleClass("hidden");
    $("#userStats").toggleClass("hidden");
    $("#input").toggleClass("hidden");
}
var selectedStudent;

function getRandStudent(userID){
    //sets up for review a random student the user has not completed AND is not currently under review
    selectedStudent = undefined;
    toggleReview();
    $("#paras").empty(); //clear old data
    $.showLoading({
        name: "line-scale"
    })
    temp = [];
    base('Table 2').select({
            view: "View 3"
        }).eachPage(function page(records, fetchNextPage) {
            // This function (`page`) will get called for each page of records.
            records.forEach(function(record) {
                temp.push(record);
            });

            // To fetch the next page of records, call `fetchNextPage`.
            // If there are more records, `page` will get called again.
            // If there are no more records, `done` will get called.
            fetchNextPage();
        }, function done(err) {
            if (err) { 
                alert(err); 
                $.hideLoading();
            }else if(checkUserDone(userID)){
                //just in case user clicks in between all apps being completed
                console.log("checked")
                //going back
                // toggleReview();
                var stats = getCompleted(temp, userID);
                $("#readathonStat").text(stats.completed + " out of "+stats.total+" TOTAL apps done = " + Math.round((stats.completed/stats.total)*100)/100+"% done!");
                $("#but1").css("class","button hidden");
                $("#userTotal").text("There are no more apps for you to complete - Thank you!");
            }else{
                var valids = temp.filter(function(record){
                    //record doesn't include user && record not locked && available space
                    return checkValidRecord(record,userID);
                })
                //random valid student
                selectedStudent = valids[Math.floor(Math.random()*valids.length)];

                // locking record then printing info to page
                base('Table 2').update(selectedStudent.id, {lock: 1}, function(err, record) {
                        if (err) { 
                            alert(err);
                            $.hideLoading(); 
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
                        $.hideLoading();
                        return;
                });
            }$.hideLoading();
        });
}


function getCompleted(array, userID){
    //takes array of airtable records and returns object of stats of completed apps
    // {total, completed, previous}
    var total = array.length;
    var completed = array.filter(function(obj){
        if(typeof obj.fields.Score3 == "number"){
            return true;
        }else{
            return false;
        }
    }).length;
    var list = [];
    var previous = array.filter(function(obj){
        if(checkUserScored(obj, userID)){
            list.push(obj.fields["Unique Student ID"]);
            return true;
        }else{
            return false;
        }
    }).length;

    return {
        total: total,
        completed: completed,
        previous: previous,
        list: list
    };
}

function checkUserScored(record,userID){
    //checks if the user has previously scored the record
    if(record.fields.readers){
        return record.fields.readers.split("+").includes(userID);
    }else{
        return false;
    }
}

function goBack(){
    $("button[id^='but']").each(function(indx,obj){
        $(this).addClass("hidden");
    });
    $("#userID").toggleClass("hidden");
    $("#userStats").toggleClass("hidden");
    userID=undefined; //just in case!
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
    $.showLoading({
        name: "line-scale"
    })
    base('Table 2').find(selectedStudent.id, function(err, record) {
        if (err) { 
            alert(err);
            toggleReview();
            $.hideLoading();
            return; 
        }else{
            var column;
            //Once student record found, checking if space avail for giving score
            if(record.fields.Score3){
                alert("Application no longer valid! - try another");
                toggleReview();
                $.hideLoading();
            }else{
                if(!record.fields.Score1){  
                    column = "Score1";
                }else if(!record.fields.Score2){
                    column = "Score2";
                }else{
                    column = "Score3";
                }

                var tempObj = {};
                tempObj[column] = Number($("#userData").val());
                //unlocking!
                tempObj["lock"] = 0;

                //adding user to readers
                tempObj["readers"] = record.fields.readers ? record.fields.readers+"+"+userID : userID;
                //resetting student
                selectedStudent = undefined;
                base('Table 2').update(record.id, tempObj, function(err, record) {
                        if (err) { 
                            alert(err);
                            toggleReview();
                            $.hideLoading();
                        }else{
                            alert("Submission Successful!");
                            toggleReview();
                        }
                        loadStart();
                });
            }
        }
    });
}
