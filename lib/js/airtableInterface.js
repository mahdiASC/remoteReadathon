/**
 * Responsible interacting with the airtable database (Model).
 * Responsible keeping and handling database specific information.
 * @author Mahdi Shadkamfarrokhi
 * @since 2018-04-02
 * @class
 */
class AirtableInterface{

    /**
     * AirtableInterface constructor.
     * @constructor
     * @requires 'airtable' npm package (client side).
     */
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
     * @param {Function} specFunc an optional callback function taking an array of records. Resolve value is passed into getData's resolve.
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
     * Will reserve a random available student for the user in the database.
     * @param {User} user the current user object
     * @return a promise with a record object as resolve() argument
     */
    getRandStudent(user){
        return new Promise((res,rej)=>{
            this.getData(temp_arr=>{
                return new Promise((sec_res, sec_rej)=>{
                    let valids_arr = user.getInfo(temp_arr).available;
                    if(valids_arr.length==0) sec_rej("There are no more availabe students for you to grade.");
                    this.holdStudent(this.randStudent(valids_arr), user.id).then(student=>{
                        sec_res(student)
                    },err=>sec_rej(err));
                })
            }).then(student=>res(student), err=>rej(err));
        });
    }

    /**
     * Returns a random individual record from input array.
     * @param {Array} valids_arr array of valid student records
     */
    randStudent(valids_arr){
        return valids_arr[Math.floor(Math.random()*valids_arr.length)];
    }

    /**
     * Grabs student from internal database by ID. 
     * 
     * NOTE: this does not make an API request.
     * @param {String} studentID unique id of student
     */
    getStudent(studentID){
        return this.db.find(x=>x.id==studentID);
    }

    /**
     * Reserves student for user in database.
     * @param {Object} student record object of student
     * @param {Number} userID user's ID
     */
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
     * @param {Object} student record object of student
     * @param {Number} score 0-2 user score input
     * @param {Number} userID user's id
     * @param {string} comment user's comment input
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
                readerData = student.fields.readers + `+${userID}`;
            }
            tempObj.readers = readerData;
            
            // adding comment
            let commentData = comment;
            if(student.fields.comments){
                commentData = student.fields.comments + `+${comment}`;
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

}