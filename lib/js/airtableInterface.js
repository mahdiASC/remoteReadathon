class AirtableInterface{
    constructor(){
        let Airtable = require('airtable');
        Airtable.configure({
            endpointUrl: 'https://api.airtable.com',
            apiKey: apiKey
        });

        this.base = Airtable.base(airtable_base);
    }

    getData(){
        return new Promise((resolve, reject)=>{
            let temp = [];
            this.base(table_name).select({
                view: table_view
            }).eachPage(function page(records, fetchNextPage) {
                temp = temp.concat(records);
                fetchNextPage();
            }, function done(err) {
                if (err) { 
                    reject(err); 
                }else{
                    resolve(temp);
                }     
            });
        });
    }
}