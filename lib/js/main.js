// TO DO LIST
// Have an id selection (sorted) and allow user to read and input number, which updates database
// Allowing submit should check to see if there's available space (population of grade should go in order)

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


function findStudent(ID){
    // takes a number string and returns student Object (row in Airtable)
    var i = 0;
    console.log(temp[i].fields);
    do{
        if(temp[i].fields["Unique Student ID"]==Number(ID)){
            return temp[i];
        }
        i++;
    }while(temp[i].fields["Unique Student ID"]!=Number(ID) && i<temp.length);
    
    return undefined;
}

function mySearch(){
    // current student based on ID
    var obj = findStudent($("#allIDs").val());

    //Clear before adding
    $("#paras").empty();

    if(obj){
        var content;
        for(k in keys){
            content = "<h2>" + questions[k] +"</h2>";
            content = content + "<p>" + obj.fields[keys[k]] + "</p>";
            $("#paras").append(content);
        }
    }else{
        $("#paras").append("SOMETHING WENT WRONG!");
    }
    
}


// base('Table 2').find('rechuJ57M85sYXhkG', function(err, record) {
//     if (err) { console.error(err); return; }
//     console.log(record);
//     temp = record;
// });