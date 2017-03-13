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
