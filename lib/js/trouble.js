//AUTH
var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keyVIWCOZULuFuVKd'
});

var base = Airtable.base('appfTjwzFnNfRONRj');
var userID, temp;

function reset(){
    userID = undefined;
    $("userReads").empty();
    $(".form-control").val("");
}

function findUser(){
    // INCLUDE text of # of finished reads
    $("#userReads").empty();
    $(".form-control").val("");
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
            if(record.fields.readers){
                return record.fields.readers.split("+").includes(userID);
            }else{
                return false;
            }
        });
        console.log(completed);
        $("#userReads").append("<h3> User has completed: "+ completed.length +" applications </h3>");
        $("#userReads").append("<h5>They are:</h5>");
        var content ="";

        for(var i in completed){
            content = content + "<li>"+completed.fields["Unique Student ID"] + "</li>";
        }
        $("#userReads").append("<ul>" + content + "</ul>");
        
        var holds = temp.filter(function(record){
            return record.fields.Score1==userID||record.fields.Score2==userID||record.fields.Score3==userID;
        });

        $("#holds").append("<h3> User has "+ holds.length +" applications on hold</h3>");
        $("#holds").append("<h5>They are:</h5>");
        var holdContent ="";

        for(var i in holds){
            holdContent = holdContent + "<li>"+holds.fields["Unique Student ID"] + "</li>";
        }
        $("#userReads").append("<ul>" + holdContent + "</ul>");
        
    });

}

function outputHolds(array){
    //given array, will find userID-specific holds and return data to HTML

}

function getHolds(num){
    //returns a number of held valid randomly selected student apps from airtable

}

function ticker(){
    setTimeout(function(){
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
        ticker();
    });
    },5000);
}

ticker();