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
        // Loading up user's console
        this.attachListeners();
        // this.dettachListeners();
        this.updateNow(true);
        this.loopUpdate();
    }

    /**
     * Sets up the user console and stores user object.
     * 
     * @param {Number} id user's ID
     */
    setUser(id){
        this.user = new User(id);
        this.updateNow(true);        
    }

    /**
     * Effectively "logs out" the user by removing from console and memory.
     */
    clearUser(){
        // this.dettachListeners();        
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

        // "Read Next Student" (makes API call then pops up info form)
        $(".card-container").find(".card:nth-child(2)").on("click",e=>{
            this.displayLoading();
            this.airtable.getRandStudent(this.user).then(student=>{
                this.createStudentPopup(student);
                this.hideLoading();
            })
        })

        // Holds (can pull from stored DB)
        $(".card-container").find(".card:last()").on("click",e=>{
            console.log(e);
            let holds = this.user.getInfo(this.airtable.db).held;
            
            
        })
    }

    /**
     * Removes appropriate event listeners from user console.
     */
    dettachListeners(){
    }

    /**
     * Creates a popup on screen with the input element as the main content.
     * 
     * @param {jQuery} div jQuery element with content to be displayed in popup
     * @param {jQuery} input_button jQuery element responsible for inputing user response into database
     * @param {Object} student record from database
     */
    createPopup(div, input_button, student){
        // creates a popup window with the div (jQuery object) as the main content
        let self = this;
        let outer_popup = $("<div/>");
        outer_popup.addClass("popup");
    
        let inner_popup = $("<div/>");
        inner_popup.addClass("popup-inner");
    
        outer_popup.append(inner_popup);
    
        inner_popup.append(div);
        //close button
        inner_popup.append('<a class="popup-close" data-popup-close="popup-2" href="#">x</a>');
    
        $('[data-popup-close]').on('click', function (e) {
            outer_popup.fadeOut(350,()=>{
                self.updateNow(true).then(data=>{
                    outer_popup.remove();
                }, err=>alert(err));
            });
        });

        input_button.on("click",e=>{
            self.displayLoading();

            let score = Number($('input[name=score]:checked').val());
            let comment = $("#comment").val();
            self.airtable.scoreStudent(student, score, comment, self.user.id).then(()=>{
                outer_popup.fadeOut(350, ()=>{
                    self.updateNow(true).then(data=>{
                        outer_popup.remove();
                    }, err=>alert(err));
                });                
            });
        });
        $("body").append(outer_popup);
        outer_popup.fadeIn(350);
    }

    /**
     * Creates a form popup of the current student's information
     * 
     * @param {Object} student record object
     */
    createStudentPopup(student){
        let self = this;
        let div = $("<div />");
        div.addClass("student-info-container");
        // STUDENT INFO
        let studentID = student.fields["Unique Student ID"][0];
        let studentEssay = student.fields[q_key];

        div.append(`<h2>STUDENT: ${studentID}</h2>`);
        div.append(`<p>${q_string}</p>`);// HARD CODED QUESTION STRING (config.js)
        div.append(`<p>${studentEssay}</p>`);

        // FORM
        let form_div = $("<div />");
        div.append(form_div);

        // 3 radio buttons
        let radio_div = $("<div />");
        radio_div.addClass("radio-container");
        form_div.append(radio_div);
        
        let explaination_dev = $("<div />");
        explaination_dev.addClass("explaination-container");
        form_div.append(explaination_dev);
        
        for(let i = 0; i<3; i++){
            let radio_button = $(`<input type="radio" id="radio${i}" name="score" value="${i}">`);
            radio_div.append(`<label for="radio${i}">${i}</label>`);
            radio_div.append(radio_button);
            radio_button.on("click",e=>{
                let lead_in = `<p class='scoremeaninglabel'>A score of ${i} means:</p>`;
               
                let explaintion;
                switch(i){
                    case 0:
                        explaintion = "<p class='scoremeaning'>This young man is not ready, or is simply not a good fit for All Star Code.</p>";
                        break;
                    case 1:
                        explaintion = "<p class='scoremeaning'>This young man may be a good fit for All Star Code. He did a fine job on his application and we should give him a second look.</p>";
                        break;
                    case 2:
                        explaintion = "<p class='scoremeaning'>This guy gets it! He's definitely a good fit for All Star Code, and will contribute a lot to his cohort.</p>";
                        break;
                }

                let ex_div = $(".explaination-container");
                ex_div.fadeOut(500,()=>{
                    ex_div.html(lead_in + explaintion);
                    ex_div.fadeIn(500);
                })
                
            });
        }

        // Comment
        let comment_div = $("<div />");
        form_div.append(comment_div);
        comment_div.append('<label for="comment">Comment (OPTIONAL):</label>');
        comment_div.append('<textarea id="comment" rows="3"></textarea>');

        // INPUT & HOLD BUTTONS
        let button_div = $("<div />");
        button_div.addClass("button-container");
        form_div.append(button_div);

        let input_button = $("<button>INPUT</button>");
        button_div.append(input_button);

        // createPopup will assign closing logic b/c of data-popup-close
        let hold_button = $("<button data-popup-close='popup-2'>HOLD</button>");
        button_div.append(hold_button);

        this.createPopup(div, input_button, student);
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
            },(err)=>alert(err))
        })
    }

    /**
     * Updates the website with pertinent information.
     * 
     * @param {Array} data_arr Array of record objects
     */
    updateInfo(data_arr){
        // update the HTML elements (login progress bar upper right of user console)
        
        let metaData = this.getInfo(data_arr);
        // LOGIN PROGRESS BAR
        
        // readathon meta data for user console
        let perc = metaData.totalCompletedNum / metaData.totalNum * 100;
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

            let userMetaData = this.user.getInfo(data_arr);

            // completed
            $(".center-info").find("p:first() span").text(userMetaData.completed.length);

            // held
            $(".card-container").find("p:last() span").text(userMetaData.held.length);

            // available
            $(".center-info").find("p:last() span").text(userMetaData.available.length);

        }
    }

    /**
     * Parses readathon specific information.
     * 
     * @param {Array} data_arr Array of record objects
     * @return object with readathon specific information: total number of application and total number completed.
     */
    getInfo(data_arr){
        let output = {};
        
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
        let progressBar = $(".progress-bar").css({"width":`${perc}%`});

        let percSpan = $(".progress-bar-container").find("p span").text(perc.toPrecision(3));
    }
}