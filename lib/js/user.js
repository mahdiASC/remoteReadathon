/**
 * Responsible keeping and handling user specific information.
 * 
 * @author Mahdi Shadkamfarrokhi
 * @since 2018-04-02
 * @class
 */
class User{
    /**
     * User constructor.
     * @param {Number} id user's ID
     * @constructor
     */
    constructor(id){
        this.id = id;
    }

    /**
     * Parses database records into user specific information.
     * @param {Array} data_arr Array of database record objects
     * @return object parsing input array into completed, available, and held records arrays
     */
    getInfo(data_arr){
        const output = {};
        
        output.completed = [];
        output.held = [];
        output.available = [];

        data_arr.forEach(x=>{
            
            let completed = false;
            // Completed
            if(x.fields.readers){
                if(x.fields.readers.split("+").includes(this.id.toString())){
                    completed = true;
                    output.completed.push(x);
                };
            }

            if(!completed){
                let holding = false;
                // Holding
                for(const score of scores){
                    if(x.fields[score]!==undefined){
                        if(x.fields[score]==this.id){
                            holding = true;
                            output.held.push(x);
                        }
                    }
                }

                // Not Holding : avail. for reg. user & poss. avail. for alum.
                if(!holding){
                    // Record must have available room for scoring
                    
                    if(scores.some(score=>x.fields[score]===undefined)){
                        // Alumni share pool
                        if(this.id > 899){
                            // avail to alumni? (held)
                            const check1 = scores.every(score=>{
                                if(x.fields[score]!==undefined){
                                    return x.fields[score]<=899; // scores and users are less than 900
                                }else{
                                    return true;
                                }
                            });
        
                            // avail to alumni? (readers)
                            const check2 = true;

                            if(x.fields.readers){
                                check2 = x.fields.readers.split("+").every(readerID=>Number(readerID)<=899);
                            }
        
                            if(check1 && check2){
                                output.available.push(x);
                            }
                        }else{
                            output.available.push(x);
                        }
                    }
                }
            }
        });

        return output;
    }
}