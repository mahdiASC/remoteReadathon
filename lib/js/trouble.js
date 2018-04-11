// Want Stats on users
// -real completed %
// -public completed %
// -list of userIDs and their # completed and sorted

// Allow clearing holds of applicants by Student ID
// View Student by ID
let airtable_base = "appp7JEOISSACpFWf"; // specific table (check API)
let table_name = "Readathon"; // specific tab in table by name
let table_view = "Grid view"; // specific view in tab by name
let scores = ["Score1","Score2","Score3"]; // column name of scores
let apiKey = "keyVIWCOZULuFuVKd" // be sure the change this after!

/**
 * Responsible for acting as intermediate between database and user (i.e. Controller). * 
 * Allows user to view all user and student data.
 * 
 * @author Mahdi Shadkamfarrokhi
 * @since 2018-04-09
 * @class
 */
class Trouble{
    constructor(){
        this.airtable = new AirtableInterface;
        this.getData();
        this.addListeners();
    }

    addListeners(){
        let self = this;
        $("#stud-button").on("click",function(){
            let studentID = Number($("#studentID").val());
            $("#studentID").val("");
            let student = self.findStudentByID(studentID);
            if(student){
                $(".student-info").show();
                $(".leaderboard").hide();
                self.displayStudent(student);
            }
        })

        $("#update").first().on("click",function(){
            self.getData();
        });

        $("#lead-button").on("click",function(){
            $(".student-info").hide();
            $(".leaderboard").show();
        });        
    }

    getData(){
        this.airtable.getData().then(data=>this.updateDisplay(),err=>alert(err));
    }
    
    findStudentByID(id){
        return this.airtable.db.find(student=>student.fields["Unique Student ID"][0]===id);
    }

    displayStudent(student){
        let studTable = $(".student-info");
        studTable.empty();
        
        let id = student.fields["Unique Student ID"][0];
        let essay = student.fields.essay_raw[0];
        studTable.append(`<h2>Student #${id}</h2>`);
        studTable.append("<hr>");
        studTable.append(`<p class="stud-essay">${essay}</p>`);
        let table = $("<table />");
        table.append("<tr> <th>Score 1</th> <th>Score 2</th><th>Score 3</th> <th>Total</th></tr>");

        let score1 = student.fields["Score1"]!==undefined? student.fields["Score1"] : "N/A";
        let score2 = student.fields["Score2"]!==undefined? student.fields["Score2"] : "N/A";
        let score3 = student.fields["Score3"]!==undefined? student.fields["Score3"] : "N/A";
        let total = score1 + score2 + score3;
        if(typeof total === "string") total = "N/A";
        table.append(`<tr> <td> ${score1}</td> <td> ${score2}</td><td> ${score3}</td> <td>${total}</td></tr>`);
        studTable.append(table);
        
        // readers
        if(student.fields.readers){
            let readers = student.fields.readers.split("+").join(", ");
            let div = $("<div />");
            let str = "Readers: " + readers;
            div.append(`<h3>${str}</h3>`);
            studTable.append(div);
        }
        //comments
        if(student.fields.comments){
            let div = $("<div />");
            div.append(`<h3 class="comments">Comments</h3>`);                   
            let ol = $("<ol/>");
            div.append(ol);
            let comments = student.fields.comments.split("+");
            for(let comment of comments){
                ol.append(`<li>${comment}</li>`);
            }
            studTable.append(div);
        }

    }

    pullInfo(){
        let output = {};
        // total applications
        output.total = this.airtable.db.length;
        output.realTotal = output.total*3;

        // total completed and partial
        output.completed = 0;
        output.totalPartials = 0;
        let userHash = {};
        for(let row of this.airtable.db){
            // completed reads
            if(row.fields.readers){
                let readers = row.fields.readers.split("+");
                if(readers.length===3) output.completed++;
                for(let i = 0; i<readers.length; i++){
                    let reader = readers[i];
                    if(!userHash[reader]){
                        userHash[reader] = {
                            held: 0,
                            completed: 0,
                            scores: []
                        }
                    }
                    userHash[reader].completed++;
                    output.totalPartials++;
                    // in case hold in first spot
                    let k = i;
                    while(row.fields[scores[k]]>100) k++;
                    userHash[reader].scores.push(row.fields[scores[k]]);
                }
            }

            // holds
            for(let score of scores){
                let scoreNum = row.fields[score];
                if(scoreNum!==undefined){
                    if(scoreNum>100){
                        let reader = scoreNum;
                        if(!userHash[reader]){
                            userHash[reader] = {
                                held: 0,
                                completed: 0,
                                scores: []
                            }
                        }
                        userHash[reader].held++;
                    }
                }
            }
        }

        output.users = userHash;
        this.data = output;
    }

    displayLeaderboard(){
        let users = Object.keys(this.data.users).sort((a,b)=>{
            return this.data.users[b].completed - this.data.users[a].completed;
        });
        let leaderboard = $(".leaderboard");
        leaderboard.empty();
        let table = $("<table />");
        table.append("<tr> <th>User ID</th> <th>Completed</th><th>Held</th> <th>Avg. Score</th><th>Contribution %</th></tr>");
        for(let user of users){
            let userData = this.data.users[user];
            let id = user;
            let completed = userData.completed;
            let held = userData.held;
            let contPerc =  ( (completed + held ) / this.data.realTotal *100 ).toPrecision(3);
            let avgScore;
            if(id == 908) console.log(userData);  //OMIT
            if(userData.scores.length>0){
                avgScore = (userData.scores.reduce((acc,val)=>acc+val)/userData.scores.length).toPrecision(2);
            }else{
                avgScore = 0;
            }
            table.append(`<tr><td>${id}</td><td>${completed}</td><td>${held}</td><td>${avgScore}</td><td>${contPerc}%</td></tr>`);
        }
        leaderboard.append(table);
    }

    updateInfoDisplay(){
        //public totals
        $(".totals").find("h3").text(`${this.data.completed} out of ${this.data.total}`);
        let totalPerc = (this.data.completed/this.data.total*100).toPrecision(4);
        $(".totals").find("p").text(`${totalPerc}%`);

        // real totals
        $(".real-totals").find("h3").text(`${this.data.totalPartials} out of ${this.data.realTotal}`);
        let realPerc = (this.data.totalPartials/this.data.realTotal*100).toPrecision(4);
        $(".real-totals").find("p").text(`${realPerc}%`);
    }

    updateDisplay(){
        this.pullInfo();        
        this.updateInfoDisplay();
        this.displayLeaderboard();
    }
}

$(document).ready(function(){
    $('#studentID').keypress(function(e){
      if(e.keyCode==13)
	  document.getElementById("stud-button").click();
    });
});
let x = new Trouble;