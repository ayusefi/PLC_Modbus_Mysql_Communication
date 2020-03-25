// Mysql database Connection
var mysql = require('mysql');
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Memak123",
    database: "mydb"
  });

// create a tcp modbus client
const Modbus = require('jsmodbus')
const net = require('net')
const socket = new net.Socket()
const client = new Modbus.client.TCP(socket, 1)
const options = {
'host' : '192.168.3.250',
'port' : 502
}
socket.connect(options, function(){
	console.log('PLC Connected!');
})

// PLC Variables
const M100 = 8292  // Kapi
const M100_label = 'M100'
const D0 = 1000    // Sicaklik
const D0_label = 'D0'

// Connect to Database
con.connect(function(err) {
    if (err) throw err;
    console.log("Database connected!");

    // Set reading interval
    UpdateFrequency(D0_label,5000)

    // Select M100 frequency from table
    var kapi_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + M100_label + "'"
    con.query(kapi_sql, function (err, result, fields) {
        if (err) throw err;
        global.Kapi_Frequency = result[0].Frequency
        console.log('Kapi Interval: ' + global.Kapi_Frequency);
      }); 
    
    // Select D0 frequency from table
    var sicaklik_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + D0_label + "'"
    con.query(sicaklik_sql, function (err, result, fields) {
        if (err) throw err;
        global.Sicaklik_Frequency = result[0].Frequency
        console.log('Sicaklik Interval: ' + global.Sicaklik_Frequency);
        }); 
    
    // Connect to PLC
    socket.on('connect', function () {

        // Read Kapi value in interval
        readKapi();
          
        // Read Sicaklik value in interval
        readSicaklik();
        
    });
    socket.on('error', function (err) {
        console.log(err);
    })
});

// Function to update frequency value of given label device
function UpdateFrequency(label, frequency){
    var sql = "UPDATE Device_Description SET Frequency = " + frequency + " WHERE label = '" + label + "'";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record updated");
    });
}

// Function to insert label, value and dateTime to table Device_Log
function AddValue(label, value, datetime){
    var sql = "INSERT INTO Device_Log (Label, Value, Date_Time) VALUES ('" + label + "', '" + value + "', '" + datetime + "')";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Value " + value + " inserted to table " + label + ' at ' + datetime);
    });
}

// Function to get date and time
function GetDateTime(){
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;
    return dateTime
}

// Function to read value of kapi
function readKapi() {
    client.readCoils(M100,16).then(function (resp) {

        // Get current date and time
        dateTime = GetDateTime()

        // Get Kapi value
        kapi_value = resp.response.body.valuesAsArray[9]

        // Add kapi log to Mysql table
        AddValue(M100_label, kapi_value, dateTime)

    }, console.error);
    setTimeout(readKapi, global.Kapi_Frequency);
};

// Function to read value of sicaklik
function readSicaklik() {
    client.readHoldingRegisters(D0,16).then(function (resp) {
        
        // Get current date and time
        dateTime = GetDateTime()

        // Get Sicaklik value
        sicaklik_value = resp.response.body.valuesAsArray[0]

        // Add Sicaklik log to Mysql table
        AddValue(D0_label, sicaklik_value, dateTime)

    }, console.error);
    setTimeout(readSicaklik, global.Sicaklik_Frequency);
};

//     //     // Kapi write
//     // client.writeSingleCoil(8292,0).then(function (resp) {
    
//     //     // resp will look like { fc: 1, byteCount: 20, coils: [ values 0 - 13 ], payload: <Buffer> } 
//     //     value = resp.response.body.valuesAsArray
//     //     console.log(value[9])
//     //     // value.forEach(function(value){
//     //     //     if(value==1){
//     //     //         console.log(value)
//     //     //     }
//     //     // })
            
//     // }, console.error);

//         // client.writeDiscreteInputs(2, false).then(function (resp) {
    
//         //     // resp will look like { fc: 1, byteCount: 20, coils: [ values 0 - 13 ], payload: <Buffer> } 
//         //     value = resp.response.body.valuesAsArray
//         //     console.log(value)
//         //     // value.forEach(function(value){
//         //     //     if(value==1){
//         //     //         console.log(value)
//         //     //     }
//         //     // })
                
//         // }, console.error);

//     // // alarm
//     // client.readDiscreteInputs(0,16).then(function (resp) {
//     //     // resp will look like { fc: 1, byteCount: 20, coils: [ values 0 - 13 ], payload: <Buffer> } 
//     //     value = resp.response.body.valuesAsArray
//     //     console.log(value)
//     // }, console.error);