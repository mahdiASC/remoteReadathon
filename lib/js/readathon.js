// Responsible for acting as intermediate between database and user
// Responsible for website and user interactions

class Readathon{
    constructor(){
        this.airtable = new AirtableInterface;
        // Loading up user's console
        this.attachListeners();
        this.updateNow(true);
        this.loopUpdate();
    }

    setUser(id){
        this.user = new User(id);
        this.updateNow(true);        
    }

    clearUser(){
        this.user = null;
    }

    attachListeners(){
        // $(".card").first().on("click",()=>console.log("blah"))
        // exit button "logs out"
        $(".right-info").on("click",()=>{
            this.clearUser();
        	$(".user-console-container").fadeOut(750,()=>$(".login-container").fadeIn(1500));    
        });
        // setUser
    }

    createPopup(div){
        // creates a popup window with the div (jQuery object) as the main content
        let outer_popup = $("<div/>");
        outer_popup.addClass("popup");
    
        let inner_popup = $("<div/>");
        inner_popup.addClass("popup-inner");
    
        outer_popup.append(inner_popup);
    
        inner_popup.append(div);
        //close buttons
        inner_popup.append('<p><a data-popup-close="popup-2" href="#">Close</a></p><a class="popup-close" data-popup-close="popup-2" href="#">x</a>');
    
        $("body").append(outer_popup);
        outer_popup.fadeIn(350);
    
        $('[data-popup-close]').on('click', function (e) {
            outer_popup.fadeOut(350);
            e.preventDefault();
            outer_popup.remove();
        });
    }

    displayLoading(){
        $.showLoading({
            name: "line-scale"
        });
    }

    hideLoading(){
        $.hideLoading();
    }

    loopUpdate(){
        // setInterval to continuously call on self
        console.log("loopUpdate called")
        setInterval(()=>{
            this.updateNow();
        },updateSecs*1000);
    }

    updateNow(flag){
        console.log("updateNow called")
        
        if(flag) this.displayLoading();

        this.airtable.getData().then(data_arr=>{
            this.updateInfo(data_arr);
            if(flag) this.hideLoading();
        },(err)=>alert(err))
    }

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

    setProgressBar(perc){
        let progressBar = $(".progress-bar").css({"width":`${perc}%`});

        let percSpan = $(".progress-bar-container").find("p span").text(perc.toPrecision(3));
    }
}