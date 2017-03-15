//AUTH
var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keyVIWCOZULuFuVKd'
});

var base = Airtable.base('appfTjwzFnNfRONRj');
var userID, temp;

function reset(){
    softReset();
    userID = undefined;
    $(".form-control").val("");
    ticker();
}

function softReset(){
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
        view: "View 3"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            temp.push(record);
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
                holdContent = holdContent + "<li>"+ ID + "<select id='"+ID+"' class='selectpicker' data-style='btn-primary'><option>0</option><option>1</option><option>2</option></select>" + "<button class='button' onclick=\""+"updateHold('"+holds[i].id+"')\" style='vertical-align:middle'>Input Data (Removes hold)</button></li>";
        }
            $("#holds").append("<ul>" + holdContent + "</ul>");
        }
    });

}

function findStudent(ID){
    // takes a number string and returns student app object
    var i = 0;
    do{
        if(temp[i].id==ID){
            console.log(temp[i])
            return temp[i];
        }
        i++;
    }while(i<temp.length);
    return undefined;
}

function updateHold(airID){
    var select = $("button[onclick=\"updateHold('"+airID+"')\"]").prev();
    $("button[onclick=\"updateHold('"+airID+"')\"]").parent().addClass("hidden");
    var val = select.val();

    temp = [];
    //getting data from DB
    base('Table 2').select({
        view: "View 3"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            temp.push(record);
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
        view: "View 3"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            temp.push(record);
        });
        fetchNextPage();
    }, function done(err) {
        if (err) { alert(err); return; }
        var student = randValidStudent(temp);
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
    if(record.fields.lock==0&&!record.fields.Score3&&!checkCurrentHold(record)){
        if(record.fields.readers){
            return !checkUserScored(record,userID);
        }else{
            return true;
        }
    }else{
        return false;
    }
}

function checkUserScored(record){
    //checks if the user has previously scored the record
    if(record.fields.readers){
        return record.fields.readers.split("+").includes(userID);
    }else{
        return false;
    }
}

function ticker(){
    temp = [];
    $("#totalPerc").text("?.??% done!");
    //getting data from DB
    base('Table 2').select({
        view: "View 3"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            temp.push(record);
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
        $("#totalPerc").text(Math.round((completed/total)*100)/100+"% done!");    
    });
}