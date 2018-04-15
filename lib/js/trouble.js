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
        const self = this;
        $("#stud-button").on("click",function(){
            const studentID = Number($("#studentID").val());
            $("#studentID").val("");
            const student = self.findStudentByID(studentID);
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
        const studTable = $(".student-info");
        studTable.empty();
        
        const id = student.fields["Unique Student ID"][0];
        const essay = student.fields.essay_raw[0];
        studTable.append(`<h2>Student #${id}</h2>`);
        studTable.append("<hr>");
        studTable.append(`<p class="stud-essay">${essay}</p>`);
        const table = $("<table />");
        table.append("<tr> <th>Score 1</th> <th>Score 2</th><th>Score 3</th> <th>Total</th></tr>");

        const score1 = student.fields["Score1"]!==undefined? student.fields["Score1"] : "N/A";
        const score2 = student.fields["Score2"]!==undefined? student.fields["Score2"] : "N/A";
        const score3 = student.fields["Score3"]!==undefined? student.fields["Score3"] : "N/A";
        const total = score1 + score2 + score3;
        if(typeof total === "string") total = "N/A";
        table.append(`<tr> <td> ${score1}</td> <td> ${score2}</td><td> ${score3}</td> <td>${total}</td></tr>`);
        studTable.append(table);
        
        // readers
        if(student.fields.readers){
            const readers = student.fields.readers.split("+").join(", ");
            const div = $("<div />");
            const str = "Readers: " + readers;
            div.append(`<h3>${str}</h3>`);
            studTable.append(div);
        }
        //comments
        if(student.fields.comments){
            const div = $("<div />");
            div.append(`<h3 class="comments">Comments</h3>`);                   
            const ol = $("<ol/>");
            div.append(ol);
            const comments = student.fields.comments.split("+");
            for(const comment of comments){
                ol.append(`<li>${comment}</li>`);
            }
            studTable.append(div);
        }

    }

    pullInfo(){
        const output = {};
        // total applications
        output.total = this.airtable.db.length;
        output.realTotal = output.total*3;

        // total completed and partial
        output.completed = 0;
        output.totalPartials = 0;
        const userHash = {};
        for(const row of this.airtable.db){
            // completed reads
            if(row.fields.readers){
                const readers = row.fields.readers.split("+");
                if(readers.length===3) output.completed++;
                for(let i = 0; i<readers.length; i++){
                    const reader = readers[i];
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
            for(const score of scores){
                const scoreNum = row.fields[score];
                if(scoreNum!==undefined){
                    if(scoreNum>100){
                        const reader = scoreNum;
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
        const users = Object.keys(this.data.users).sort((a,b)=>{
            return this.data.users[b].completed - this.data.users[a].completed;
        });
        const leaderboard = $(".leaderboard");
        leaderboard.empty();
        const table = $("<table />");
        table.append("<tr> <th>User ID</th> <th>Completed</th><th>Held</th> <th>Avg. Score</th><th>Contribution %</th></tr>");
        for(const user of users){
            const userData = this.data.users[user];
            const id = user;
            const completed = userData.completed;
            const held = userData.held;
            const contPerc =  ( (completed + held ) / this.data.realTotal *100 ).toPrecision(3);
            let avgScore;
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
        const totalPerc = (this.data.completed/this.data.total*100).toPrecision(4);
        $(".totals").find("p").text(`${totalPerc}%`);

        // real totals
        $(".real-totals").find("h3").text(`${this.data.totalPartials} out of ${this.data.realTotal}`);
        const realPerc = (this.data.totalPartials/this.data.realTotal*100).toPrecision(4);
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

new Trouble;
