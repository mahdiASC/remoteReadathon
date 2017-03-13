// TO DO LIST
// REMAKE SITE TO INCLUDE USER INPUT W/UNIQUE ID
// RANDOMLY ASSIGN STUDENT USER HAS NOT ALREADY REVIEWED
// INCLUDE PERCENTAGE OF TOTAL REVIEWED WITH 3 TOTAL (3RD COLUMN WITH VALUE / TOTAL)
// MAKE RECORD OF UNIQUE IDS
// PUT HOLD ON RECORD BEING REVIEWED
// ALLOW STUDENT SELECT W/INPUT
// ON WINDOW CLOSE- REMOVE HOLD

//AUTH
var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keyVIWCOZULuFuVKd'
});

var base = Airtable.base('appfTjwzFnNfRONRj');

//Will contain all records as an array
var temp = [];
var keys, questions;
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
    if (err) { console.error(err); return; }
    //Getting "keys" - v. long column names, but using them as titles!
    keys = Object.keys(temp[0].fields).filter((text)=>text.search(/\?/)!=-1); //finding anything with a question mark = a question!
    //Adding 1 to questions "number" then resorting
    questions = keys.map((text)=>(Number(text.slice(0,1))+1)+text.slice(1));
    keys.sort();
    questions.sort();
    var content;
    for(var i in temp){
        content = "<option>"+ temp[i].fields["Unique Student ID"] +"</option>";
        $("#allIDs").append(content);
    }
});

var userID;
function myID(){
    //not checking for if ID is in DB
    userID = $(".form-control").val();
    $(".form-control").val("");
    if(checkValidID(userID)){
        $("#userID").toggleClass("hidden");
        $("#userMenu").toggleClass("hidden");    
    }else{
        alert("Invalid User ID");
    }

    
}

function checkValidID(input){
    var num = Number(input);
    if (num>99 && num<1000){ //ID's must be over 99 and less than 1000
        return true;
    }else{
        return false;
    }
}

function nextStud(){

}

function goBack(){
    $("#userMenu").toggleClass("hidden");
    $("#userID").toggleClass("hidden");
    userID=undefined; //just in case!
}

function problem(){

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

function mySearch(){
    //Clear before adding
    $("#paras").empty();
    var studAirID = findStudent($("#allIDs").val());
    base('Table 2').find(studAirID, function(err, record) {
        if (err) { 
            $("#paras").append("SOMETHING WENT WRONG!-STUDENT NOT FOUND!");
            for (var i in err){
                $("#paras").append("<h2>" + err[i] + "</h2>"); 
            }
            return; 
        }else{
            //Once student record found, checking if space avail for giving score

            if(record.fields.Score1&&record.fields.Score2&&record.fields.Score3){
                $("#paras").append("STUDENT ALREADY HAS 3 ESSAY SCORES!");
            }else{
                var content;
                $("#paras").append("<h1> STUDENT: "+ record.fields["Unique Student ID"]  +"</h1>");
                for(k in keys){
                    content = "<h2>" + questions[k] +"</h2>";
                    content = content + "<p>" + record.fields[keys[k]] + "</p>";
                    $("#paras").append(content);
                }
                $("#input").toggleClass("hidden");
                $("#selector").toggleClass("hidden");
            }
        }
    });
}

function enterData(){
    //Clear before adding
    $("#paras").empty();
    var data = Number($("#userData").val());
    var studAirID = findStudent($("#allIDs").val());

    base('Table 2').find(studAirID, function(err, record) {
        if (err) { 
            $("#paras").append("SOMETHING WENT WRONG!-STUDENT NOT FOUND!");
            for (var i in err){
                $("#paras").append("<h2>" + err[i] + "</h2>"); 
            }
            return; 
        }else{
            var column;
            //Once student record found, checking if space avail for giving score
            if(record.fields.Score1&&record.fields.Score2&&record.fields.Score3){
                $("#paras").append("STUDENT ALREADY HAS 3 ESSAY SCORES!");
            }else{
                if(!record.fields.Score1){  
                    column = "Score1";
                }else if(!record.fields.Score2){
                    column = "Score2";
                }else{
                    column = "Score3";
                }

                var tempObj = {};
                tempObj[column] = data;
                base('Table 2').update(record.id, tempObj, function(err, record) {
                        if (err) { 
                            for (var i in err){
                            $("#paras").append("<h2>" + err[i] + "</h2>"); 
                            }
                            return; 
                        }else{
                            $("#input").toggleClass("hidden");
                            $("#selector").toggleClass("hidden");
                            $("#paras").append("<h2>SUBMISSION SUCCESSFUL!</h2>"); 
                        }
                });
            }
        }
    });
}
