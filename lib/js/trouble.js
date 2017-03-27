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

var userID, temp;

function reset(){
    softReset();
    userID = undefined;
    $(".form-control").val("");
    ticker();
}

function softReset(){
    $("#paras").empty();
    $("#userReads").empty();
    $("#holds").empty();
    $("#addingHolds").empty();
    $("#currentUser").empty();
    $("#holdInput").addClass("hidden");

}

function findUser(){
    // INCLUDE text of # of finished reads
    softReset();
    userID = $("#checkUser").val();
    $("#currentUser").text(userID);
    $("#holdInput").removeClass("hidden");
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
        var completed = temp.filter(function(record){
            return checkUserScored(record);
        });
        $("#userReads").append("<h3> User has completed: "+ completed.length +" applications </h3>");
        if(completed.length>0){
            $("#userReads").append("<h5>They are:</h5>");
            var content ="";

            for(var i in completed){
                content = content + "<li>"+completed[i].fields["Unique Student ID"] + "</li>";
            }
            $("#userReads").append("<ul>" + content + "</ul>");
        }
        
        var holds = temp.filter(function(record){
            return checkCurrentHold(record);
        });

        $("#holds").append("<h3> User has "+ holds.length +" applications on hold</h3>");
        if(holds.length>0){
            $("#holds").append("<h5>They are:</h5>");
            var holdContent ="";

            for(var i in holds){
                var ID = holds[i].fields["Unique Student ID"];
                holdContent = holdContent + "<li>"+ ID + "<select id='"+ID+"' class='selectpicker' data-style='btn-primary'><option>0</option><option>1</option><option>2</option></select>" + "<textarea class='form-control' id='comments"+ID+"' rows='1'></textarea>" +"<button class='button' onclick=\""+"updateHold('"+holds[i].id+"')\" style='vertical-align:middle'>Input Data (Removes hold)</button></li>";
    }
            $("#holds").append("<ul>" + holdContent + "</ul>");
        }
    });

}

function findStudent(ID){
    // takes a record.id number string and returns student app object
    var i = 0;
    do{
        if(temp[i].id==ID){
            return temp[i];
        }
        i++;
    }while(i<temp.length);
    return undefined;
}

function findStudentByUniqID(uniqID){
    // takes a record.id number string and returns student app object
    var i = 0;
    do{
        if(temp[i].fields["Unique Student ID"]==uniqID){
            return temp[i];
        }
        i++;
    }while(i<temp.length);
    return undefined;
}

function updateHold(airID){
    //userScore
    var select = $("button[onclick=\"updateHold('"+airID+"')\"]").prev().prev();
    $("button[onclick=\"updateHold('"+airID+"')\"]").parent().addClass("hidden");
    var val = select.val();
    
    //userComment
    var select2 = $("button[onclick=\"updateHold('"+airID+"')\"]").prev();
    var userComment = select2.val();
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
        //given airID, will find userID-specific holds and return data to HTML
        var student = findStudent(airID);
        var column;
        //working with local "temp"" version to reduce pings to airtable
        if(student.fields.Score1==userID){  
            column = "Score1";
        }else if(student.fields.Score2==userID){
            column = "Score2";
        }else{
            column = "Score3";
        }
        var tempObj = {};
        tempObj[column]=Number(val);
        //adding user to readers
        tempObj["readers"] = student.fields.readers ? student.fields.readers+"+"+userID : userID;
        tempObj["comments"] = student.fields.comments ? student.fields.comments+"+"+userComment : userComment;
        base('Table 2').update(airID, tempObj, function(err, record) {
            if (err) { console.error(err); return; }
            alert("Record "+ student.fields["Unique Student ID"] + " updated successfully");
        });    
    });
}

function makeHold(){
    //updates HTML with a "Unique Student ID" number of held valid randomly selected student app from airtable
    //calling this function will find a valid student and put a hold on them
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
        var student = randValidStudent(temp);
        if (err) { alert(err); return; }
        if (!student) { alert("No more valid students left"); return; }
        var column;
        if(!student.fields.Score1){  
            column = "Score1";
        }else if(!student.fields.Score2){
            column = "Score2";
        }else{
            column = "Score3";
        }

        var tempObj = {};
        tempObj[column]=Number(userID);
        base('Table 2').update(student.id, tempObj, function(err, record) {
            if (err) { console.error(err); return; }
            $("#addingHolds").append("<p>"+student.fields["Unique Student ID"]+"</p>");
            alert("Record "+ student.fields["Unique Student ID"] + " being held");
        });
    });
}

function randValidStudent(array){
    var filtered = array.filter(function(student){
        return checkValidRecord(student);
    })
    return filtered[Math.floor(Math.random()*filtered.length)];
}

function checkCurrentHold(record){
    //returns true if user already has hold on a record
    //false otherwise
    return record.fields.Score1==Number(userID)||record.fields.Score2==Number(userID)||record.fields.Score3==Number(userID);
}

function checkValidRecord(record){
    // returns true if the record is an open valid record for the user
    // Valid means record NOT complete and NOT on hold by user and NOT already read by user
    return !checkHold(record)&&!checkUserScored(record)&&!checkCompleteRecord(record);
}

function checkCompleteRecord(record){
    //returns true if a record if completely graded
    return record.fields.Score1<99&&record.fields.Score2<99&&record.fields.Score3<99
}

function checkHold(record){
    //returns true if user already has hold on a record
    //false otherwise
    return record.fields.Score1==Number(userID)||record.fields.Score2==Number(userID)||record.fields.Score3==Number(userID);
}

function checkUserScored(record){
    //checks if the user has previously scored the record
    if(record.fields.readers){
        return record.fields.readers.split("+").includes(userID);
    }else{
        return false;
    }
}

function makeSpecHold(){
    //updates HTML with a "Unique Student ID" number of held valid randomly selected student app from airtable
    //calling this function will find a valid student and put a hold on them
    temp = [];
    var input = $("#specHold").val();
    $("#specHold").val("");
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
        var student = findStudentByUniqID(Number(input));
        if (!student) {alert("Student "+ input +" could not be found!"); return;}
        if (err) { alert(err); return; }
        
        var column;
        if(!student.fields.Score1){  
            column = "Score1";
        }else if(!student.fields.Score2){
            column = "Score2";
        }else{
            column = "Score3";
        }

        var tempObj = {};
        tempObj[column]=Number(userID);
        base('Table 2').update(student.id, tempObj, function(err, record) {
            if (err) { console.error(err); return; }
            $("#addingHolds").append("<p>"+student.fields["Unique Student ID"]+"</p>");
            alert("Record "+ student.fields["Unique Student ID"] + " being held");
        });
    });
}

function randAlRead(){
    // returns random valid Alumni Read
    var valids = temp.filter(function(record){
        //valid record is NOT completed and is NOT held by another alumni and has NOT been scored by another alumni
        var otherAlum = record.fields.readers ? !record.fields.readers.split("+").some((user)=>Number(user)>899) : true;
        return !checkCompleteRecord(record)&&!(record.fields.Score1>899||record.fields.Score2>899||record.fields.Score3>899)&&otherAlum;
    })
    return valids[Math.floor(Math.random()*valids.length)];
}

function genAlRead(obj){
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
        var randPick = randAlRead();
        if (!randPick){ $(obj).text("No more valid records for alumni");; return; }
        if (err) { alert(err); return; }
        $(obj).text(randPick.fields["Unique Student ID"]);
    });

}


function readStudent(){
    var selectedStudent;
    var uniqID = $("#readStudent").val();
    $("#readStudent").val()
    $("#paras").empty(); //clear old data
    temp = [];
    var newWin = window.open('','Print-Window');
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
        selectedStudent = findStudentByUniqID(Number(uniqID));
        if(!selectedStudent){alert("Student " +uniqID+" could not be found!"); return;}
        if (err) { alert(err); return; }
        base('Table 2').find(selectedStudent.id, function(err, record) {
            if (err) { alert(err); return;}
            //printing info to page once locked
            var content;
            // $("#paras").append("<h1> STUDENT: "+ selectedStudent.fields["Unique Student ID"]  +"</h1>");
            content = "<h3> STUDENT: "+ selectedStudent.fields["Unique Student ID"]  +"</h3>";
            //setting up window to print in
            
            keys = Object.keys(selectedStudent.fields).filter((text)=>text.search(/\?/)!=-1); //finding anything with a question mark = a question!
            keys.sort();
            for(k in keys){
                content = content + "<h5>" + (Number(keys[k].slice(0,1))+1)+keys[k].slice(1) +"</h5>";
                content = content + "<p>" + record.fields[keys[k]] + "</p>";
                // $("#paras").append(content);
            }
            content = content + "<label for='comments'>Comments</label><textarea class='form-control' rows='3'></textarea>";
            content = content + "<h3>Grade:</h3>";
            newWin.document.open();
            newWin.document.write('<html><body onload="window.print()">'+content+'</body></html>');
            newWin.document.close();
        });
    });    
}

function ticker(){
    temp = [];
    $("#totalPerc").text("?.??% done!");
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
        var completed = temp.filter(function(obj){
        if(typeof obj.fields.Score3 == "number"){
            return true;
        }else{
            return false;
        }}).length;
        $("#totalPerc").text(Math.round((completed/total)*100)+"% done!");    
    });
}