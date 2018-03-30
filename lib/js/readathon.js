// Responsible for acting as intermediate between database and user
// Responsible for website and user interactions

class Readathon{
    constructor(){
        this.airtable = new AirtableInterface;
        // Loading up user's console
        this.attachListeners();
        this.updateAll();
    }

    setUser(num){
        this.user = new User(num);
        this.updateAll();        
    }

    clearUser(){
        this.user = null;
    }

    attachListeners(){
        // $(".card").first().on("click",()=>console.log("blah"))
        // exit button "logs out"
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

    updateAll(){
        // setInterval to continuously call on self
        this.airtable.getData().then(data_arr=>{
            console.log(data_arr);
            this.updateInfo(data_arr);
        },(err)=>alert(err))

    }

    updateInfo(data_arr){
        // update the HTML elements (login progress bar upper right of user console)
        
        let metaData = this.getInfo();
        // login progress bar
        
        // readathon meta data for user console

        // user meta data
        if(this.user){
            let userMetaData = this.user.getInfo(data_arr);
            console.log(userMetaData);
        }
    }

    getInfo(data_arr){
        let output = {};

        output.totalCompletedNum = data_arr.filter(x=>x.fields.readers.split("+").length===3).length;
        output.totalNum = data_arr.length;

        return output;
    }
}