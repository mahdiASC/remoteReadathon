class User{
    constructor(id){
        this.id = id;
    }

    // returns obj of user data 
    getInfo(data_arr){
        let output = {};
        
        output.completed = [];
        output.held = [];
        output.available = [];

        data_arr.forEach(x=>{
            
            // Completed
            if(x.fields.readers){
                if(x.fields.readers.split("+").includes(this.id)){
                    x.completed = true;
                    output.completed.push(x);
                };
            }

            // Holding
            for(let score of scores){
                if(x.fields[score]!==undefined){
                    if(x.fields[score]==this.id){
                        x.held = true;
                        output.held.push(x);
                    }
                }
            }

            // Available
            if(
                scores.some(score=>x.fields[score]===undefined) // every score 
                && !x.completed
                && !x.held
            ){
                // Alumni share pool
                if(Number(this.id) > 899){
                    if(
                        scores.every(score=>{
                            if(x.fields[score]!==undefined){
                                return x.fields[score]<900;
                            }else{
                                return false;
                            }
                        })
                        && x.fields.readers.split("+").every(reader=>Number(reader)<899)
                    ){
                        output.available.push(x);
                    }
                }else{
                    output.available.push(x);
                }
            }
        });

        return output;
    }
}