//AUTH
var Airtable = require('airtable');
Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: 'keyVIWCOZULuFuVKd'
});

var base = Airtable.base('appS5m8z65jdIRJ4H');

base('Part I').find('recnx0RYgM1JQ6fXY', function(err, record) {
    if (err) { console.error(err); return; }
    console.log(record);
});