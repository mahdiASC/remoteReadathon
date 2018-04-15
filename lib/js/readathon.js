/**
 * Responsible for acting as intermediate between database and user (i.e. Controller).
 * Responsible for user interactions.
 * Responsible keeping and handling readathon specific information.
 * 
 * @author Mahdi Shadkamfarrokhi
 * @since 2018-04-02
 * @class
 */
class Readathon{
    /**
     * Readathon constructor.
     * 
     * NOTE: will begin regularly making API update calls.
     * @constructor
     */
    constructor(){
        this.airtable = new AirtableInterface;
        // button setup
        this.buttonSetup();

        // Loading up user's console
        this.updateNow(true);
        this.loopUpdate();
    }
    
    /**
     * Attaches "listener" for button
     */
    buttonSetup(){
        const self = this;
        // allow "Enter" key to click button
        $('#userID').keypress(function(e){
            if(e.keyCode==13) self.startReading();
        });

        $("#startButton").on("click",e=>{
            self.startReading();
        })
    }

    /**
     * Activates user "login"
     */
    startReading(){
        // check if number is valid
        const userID = $("#userID").val();
        $("#userID").val("");
        
        if(userID.length!==3 || isNaN(Number(userID))) alert("Invalid User ID");
    
        // loading user
        this.setUser(Number(userID));
    
        // hide login and show console
        $(".login-container").fadeOut(750,()=>$(".user-console-container").fadeIn(1500));
    }

    /**
     * Sets up the user console and stores user object.
     * 
     * @param {Number} id user's ID
     */
    setUser(id){
        this.user = new User(id);
        this.attachListeners();
        this.updateNow(true);        
    }

    /**
     * Effectively "logs out" the user by removing from console and memory.
     */
    clearUser(){
        this.dettachListeners();        
        this.user = null;
    }

    /**
     * Attaches appropriate event listeners to user console.
     */
    attachListeners(){
        // exit button
        $(".right-info").on("click",()=>{
            this.clearUser();
            $(".user-console-container").fadeOut(750,()=>$(".login-container").fadeIn(1500));    
        });

        // Grading rubric (static)
        $(".card-container").find(".card:first()").on("click",e=>{
            // cloning html, which was easier to make than using jQuery
            const guides = $(".guide-container")
            let guide = guides.eq(1);
            if(guide.length===0){
                guide = $(".guide-container").clone();
                guide.css("display","block");
            } 
            this.createPopup(guide, false);
        });

        // "Read Next Student" (makes API call then pops up info form)
        $(".card-container").find(".card:nth-child(2)").on("click",e=>{
            const available = this.user.getInfo(this.airtable.db).available;

            if(available.length>0){
                this.displayLoading();
                this.airtable.getRandStudent(this.user).then(student=>{
                    this.createStudentPopup(student);
                    this.hideLoading();
                })
            }
        })
        
        // completed (can pull from stored DB)
        $(".center-info").find("p:first()").on("click",e=>{
            const completed = this.user.getInfo(this.airtable.db).completed;
            if(completed.length===0){
                const div = $("<div />");
                div.append("<h3>No applications completed</h3>");
                this.createPopup(div, false);                
            }else{
                this.createStudentViewPopup(completed);
            }
        })

        // Holds (can pull from stored DB)
        $(".card-container").find(".card:last()").on("click",e=>{
            const holds = this.user.getInfo(this.airtable.db).held;
            if(holds.length>0){
                this.createStudentPopup(holds[0], false);                
            }
        })

        $(".center-info").find("p:eq(1)").on("click",e=>{
            const holds = this.user.getInfo(this.airtable.db).held;
            if(holds.length===0){
                const div = $("<div />");
                div.append("<h3>No applications on hold</h3>");
                this.createPopup(div, false);
            }else{
                this.createHoldsPopup(holds);                
            }
        })
    }

    /**
     * Removes appropriate event listeners from user console.
     */
    dettachListeners(){
        $(".card-container").find(".card:first()").off("click");
        $(".card-container").find(".card:nth-child(2)").off("click");
        $(".card-container").find(".card:last()").off("click");
        $(".center-info").find("p:first()").off("click");
        $(".center-info").find("p:eq(1)").off("click");
    }

    /**
     * Creates a popup on screen with the input element as the main content.
     * 
     * @param {jQuery} div jQuery element with content to be displayed in popup
     * @param {boolean} flag if false, will not pull from the database and update the console
     */
    createPopup(div, flag=true){
        // creates a popup window with the div (jQuery object) as the main content
        const outer_popup = $("<div/>");
        outer_popup.addClass("popup");
        $("body").append(outer_popup);
    
        const inner_popup = $("<div/>");
        inner_popup.addClass("popup-inner");
    
        outer_popup.append(inner_popup);
    
        inner_popup.append(div);
        //close button
        inner_popup.append('<a class="popup-close" data-popup-close="popup-1" href="#">x</a>');
    
        const self=this;
        $('[data-popup-close]').on('click', e=>{
            e.preventDefault();
            outer_popup.fadeOut(350,()=>{
                if(flag){
                    self.updateNow(true).then(()=>{
                        outer_popup.remove();
                    }, err=>alert(err));
                }else{
                    outer_popup.remove();                    
                }
            });
        });

        outer_popup.fadeIn(350);
    }

    /**
     * Creates a form popup of the current student's information
     * 
     * @param {Object} student record object
     * @param {boolean} flag if false, will no update from database
     */
    createStudentPopup(student, flag = true){
        const self = this;
        const div = $("<div />");
        div.addClass("student-info-container");
        // STUDENT INFO
        const studentID = student.fields["Unique Student ID"][0];
        const studentEssay = student.fields[q_key];

        div.append(`<h2>STUDENT: ${studentID}</h2>`);
        div.append(`<p id="question">${q_string}</p>`);// HARD CODED QUESTION STRING (config.js)
        div.append(`<p>${studentEssay}</p>`);
        div.append("<hr>");

        // FORM
        const form_div = $("<div />");
        form_div.addClass("form_div");
        div.append(form_div);

        // 3 radio buttons
        const options_div = $("<div />");
        options_div.addClass("options");
        form_div.append(options_div);
        
        const radio_div = $("<div />");
        radio_div.addClass("radio-container");
        options_div.append(radio_div);
        
        const explaination_dev = $("<div />");
        explaination_dev.addClass("explaination-container");
        options_div.append(explaination_dev);
        
        radio_div.append("<h2>Score</h2>");

        //filler
        explaination_dev.append("<p class='scoremeaninglabel'>[Score meaning]</p>");

        for(let i = 0; i<3; i++){
            const temp_radio_div = $("<div />");
            temp_radio_div.addClass("radio-button-container");
            radio_div.append(temp_radio_div);

            const radio_button = $(`<input type="radio" id="radio${i}" name="score" value="${i}">`);
            temp_radio_div.append(radio_button);
            temp_radio_div.append(`<label for="radio${i}">${i}</label>`);

            radio_button.on("click",e=>{
                const lead_in = `<p class='scoremeaninglabel'>A score of ${i} means:</p>`;
                
                let explaination;
                switch(i){
                    case 0:
                    explaination = "<p class='scoremeaning'>This young man is not ready, or is simply not a good fit for All Star Code.</p>";
                    break;
                    case 1:
                    explaination = "<p class='scoremeaning'>This young man may be a good fit for All Star Code.</p>";
                    break;
                    case 2:
                    explaination = "<p class='scoremeaning'>This guy gets it! He's definitely a good fit for All Star Code, and will contribute a lot to his cohort.</p>";
                    break;
                }
                
                const ex_div = $(".explaination-container");
                ex_div.fadeOut(500,()=>{
                    ex_div.html(lead_in + explaination);
                    ex_div.fadeIn(500);
                })
                
            });
        }

        // Comment
        const comment_div = $("<div />");
        form_div.append(comment_div);
        comment_div.append('<label for="comment">Comment (OPTIONAL):</label>');
        comment_div.append('<textarea id="comment" rows="3"></textarea>');

        // INPUT & HOLD BUTTONS
        const button_div = $("<div />");
        button_div.addClass("button-container");
        form_div.append(button_div);

        // createPopup will assign closing logic b/c of data-popup-close
        const hold_button = $("<button data-popup-close='popup-2'>HOLD</button>");
        button_div.append(hold_button);

        const input_button = $("<button>INPUT</button>");
        button_div.append(input_button);

        input_button.on("click",e=>{
            self.displayLoading();
            const _score = $('input[name=score]:checked').val();
            if(!_score){
                alert("Error: Score not given");
                self.hideLoading();
                return;
            }
            const score = Number(_score);
            const comment = $("#comment").val();
            self.airtable.scoreStudent(student, score, comment, self.user.id).then(()=>{
                const outer_popup = $(".popup");
                outer_popup.fadeOut(350, ()=>{
                    self.updateNow(true).then(data=>{
                        outer_popup.remove();
                    }, err=>alert(err));
                });                
            });
        });

        this.createPopup(div, flag);
    }

    /**
     * Displays array of students without form option.
     * 
     * @param {Array} students records from database
     */
    createStudentViewPopup(students){
        const main_div = $("<div />");
        main_div.append("<h2>completed</h2>")
        for(const student of students){
            const div = $("<div />");
            div.addClass("student-info-container");
            main_div.append(div);
            // STUDENT INFO
            const studentID = student.fields["Unique Student ID"][0];
            const studentEssay = student.fields[q_key];
            
            div.append("<hr>");
            div.append(`<h2>STUDENT: ${studentID}</h2>`);
            div.append(`<p>${studentEssay}</p>`);
        }
        this.createPopup(main_div, false);
    }

    /**
     * Displays user holds and allows for immediate lookup.
     * 
     * @param {Array} holds records from database
     */
    createHoldsPopup(holds){
        const self = this;
        const main_div = $("<div />");
        main_div.append("<h2>On Hold</h2>")
        main_div.append("<hr>");
        for(const student of holds){
            const div = $("<div />");
            div.addClass("student-info-container");
            main_div.append(div);
            // STUDENT INFO
            const studentID = student.fields["Unique Student ID"][0];
            const button = $(`<button class="student-held-button">Revisit Student ${studentID}</button>`)
            div.append(button);

            button.on("click",e=>{
                const outer_popup = $(".popup");                
                outer_popup.fadeOut(350,()=>{
                    outer_popup.remove();
                    self.createStudentPopup(student, false);
                });
            });
        }
        this.createPopup(main_div, false);
    }

    /**
     * Creates a loading screen, which prevents user interaction.
     * @requires loading.js library
     */
    displayLoading(){
        $.showLoading({
            name: "line-scale"
        });
    }

    /**
     * Removes loading screen, restoring user interaction.
     * 
     * @requires loading.js library
     */
    hideLoading(){
        $.hideLoading();
    }

    /**
     * Continually calls on Airtable API for updates on a regular basis.
     */
    loopUpdate(){
        setInterval(()=>{
            this.updateNow();
        },updateSecs*1000);
    }

    /**
     * Promist that makes the API call to retreive data and update the website with pertinent information.
     * @param {boolean} flag if true, will activate loading screen.
     */
    updateNow(flag){
        return new Promise((resolve, reject)=>{
            if(flag) this.displayLoading();
            this.airtable.getData().then(data_arr=>{
                this.updateInfo(data_arr);
                if(flag) this.hideLoading();
                resolve();
            },err=>reject(err));
        })
    }

    /**
     * Updates the website with pertinent information.
     * 
     * @param {Array} data_arr Array of record objects
     */
    updateInfo(data_arr){
        // update the HTML elements (login progress bar upper right of user console)
        
        const metaData = this.getInfo(data_arr);
        // LOGIN PROGRESS BAR
        
        // readathon meta data for user console
        const perc = metaData.totalCompletedNum / metaData.totalNum * 100;
        this.setProgressBar(perc);
        
        // total completed num
        $(".left-info").find("p span:first()").text(metaData.totalCompletedNum);

        // total num
        $(".left-info").find("p span:nth-child(2)").text(metaData.totalNum);
        
        // perc done
        $(".left-info").find("p span:last()").text(perc.toPrecision(3));

        // USER META DATA
        if(this.user){
            // user id number
            $(".center-info").find("h2 span").text(this.user.id);

            const userMetaData = this.user.getInfo(data_arr);

            // completed
            $(".center-info").find("p:first() span").text(userMetaData.completed.length);
            
            // held
            const heldL = userMetaData.held.length;
            if(heldL===0){
                $(".card-container").find(".card:last()").addClass("inactive").removeClass("active");
            }else{
                $(".card-container").find(".card:last()").addClass("active").removeClass("inactive");
            }
            $(".center-info").find("p:eq(1) span").text(heldL);


            // available
            const availL = userMetaData.available.length;
            if(availL===0){
                $(".card-container").find(".card:nth-child(2)").addClass("inactive").removeClass("active");                
            }else{
                $(".card-container").find(".card:nth-child(2)").addClass("active").removeClass("inactive");                
            }
            $(".center-info").find("p:last() span").text(availL);

        }
    }

    /**
     * Parses readathon specific information.
     * 
     * @param {Array} data_arr Array of record objects
     * @return object with readathon specific information: total number of application and total number completed.
     */
    getInfo(data_arr){
        const output = {};
        
        output.totalNum = data_arr.length;
        output.totalCompletedNum = data_arr.filter(x=>{
            if(x.fields.readers){
                return x.fields.readers.split("+").length===3
            }else{
                return false;
            }
        }).length;

        return output;
    }

    /**
     * Updates the progress bar on the "login" screen.
     * 
     * @param {Number} perc percentage of completed readathon applications
     */
    setProgressBar(perc){
        const progressBar = $(".progress-bar").css({"width":`${perc}%`});

        const percSpan = $(".progress-bar-container").find("p span").text(perc.toPrecision(3));
    }
}