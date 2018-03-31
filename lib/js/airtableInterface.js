class AirtableInterface{
    constructor(){
        let Airtable = require('airtable');
        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: apiKey
        });

        this.base = Airtable.base(airtable_base);
    }

    /**
     * Makes API call for data.
     * @param {*} specFunc an optional callback function taking an array of records. Resolve value is passed into getData's resolve.
     */
    getData(specFunc){
        return new Promise((resolve, reject)=>{
            let self = this;
            self.db = [];
            self.base(table_name).select({
                view: table_view
            }).eachPage(function page(records, fetchNextPage) {
                self.db = self.db.concat(records);
                fetchNextPage();
            }, function done(err) {
                if (err) { 
                    reject(err); 
                }else{
                    if(specFunc){
                        specFunc(self.db).then(data=>resolve(data),err=>reject(err));
                    }else{
                        resolve(self.db);
                    }
                }     
            });
        });
    }

    /**
     * Will reserve a spot on the database and returns the record for visualization.
     * @param {*} user the current user object
     * @return a promise with a record object as resolve() argument
     */
    getRandStudent(user){
        return new Promise((res,rej)=>{
            this.getData(temp_arr=>{
                return new Promise((sec_res, sec_rej)=>{
                    let valids_arr = user.getInfo(temp_arr).available;
                    this.holdStudent(this.randStudent(valids_arr), user.id).then(student=>{
                        sec_res(student)
                    },err=>sec_rej(err));
                })
            }).then(student=>res(student), err=>rej(err));
        });
    }

    /**
     * Returns a random individual record.
     * @param {*} valids_arr array of valid student records
     */
    randStudent(valids_arr){
        return valids_arr[Math.floor(Math.random()*valids_arr.length)];
    }

    /**
     * Grabs student from internal DB for by ID (does NOT make API call)
     * @param {*} studentID unique id of student
     */
    getStudent(studentID){
        return this.db.find(x=>x.id==studentID);
    }

    holdStudent(student, userID){
        return new Promise((res,rej)=>{
            let column;
            let i = 0;
            while(!column && i < scores.length){
                if(student.fields[scores[i]]==undefined){
                    column = scores[i];
                }
                i++;
            }

            if(!column){
                rej(`Student: ${student.id} could not be held`);
            }

            var tempObj = {};
            tempObj[column]=userID;

            this.base(table_name).update(student.id, tempObj, function(err, record) {
                if (err) { 
                    rej(err); 
                }
                res(record);
            });
        });
    }

    /**
     * Inputs the user's scoring info into the database for the given student. Resolves with the student obj.
     * @param {Student} student 
     * @param {int} score 0-2 
     * @param {int} userID 
     * @param {string} comment
     */
    scoreStudent(student, score, comment, userID){
        return new Promise((resolve, reject)=>{
            // assumed student has data for user's hold
            let column;
            let i = 0;
            while(!column && i < scores.length){
                console.log()
                if(student.fields[scores[i]]==userID){
                    column = scores[i];
                }
                i++;
            }
    
            // user not supposed to grade student 
            if(!column){
                reject(`Student: ${student.id} could not be scored`);
            }

            var tempObj = {};
            // changing hold to score
            tempObj[column] = score;
            
            // adding user to readers
            let readerData = userID.toString();
            if(student.fields.readers){
                let temp = student.fields.readers.split("+");
                temp.push(userID);
                readerData = temp.join("+");
            }
            tempObj.readers = readerData;
            
            // adding comment
            let commentData = comment;
            if(student.fields.comments){
                let temp = student.fields.comments.split("+");
                temp.push(comment);
                commentData = temp.join("+");
            }
            tempObj.comments = commentData;

            this.base(table_name).update(student.id, tempObj, function(err, record) {
                if (err) { 
                    reject(err); 
                }
                resolve(record);
            });

        })
    }

    /**
     * Removes all holds in db
     */
    removeHolds(){

    }
}