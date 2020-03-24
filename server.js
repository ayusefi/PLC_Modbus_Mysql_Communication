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

    UpdateFrequency(D0_label,5000)

    // Select M100 frequency from table
    con.query("SELECT Frequency FROM Device_Description WHERE label = '" + M100_label + "'", function (err, result, fields) {
        if (err) throw err;
        global.Kapi_Frequency = result[0].Frequency
        console.log('Kapi Interval: ' + global.Kapi_Frequency);
      }); 
    
    // Select D0 frequency from table
    con.query("SELECT Frequency FROM Device_Description WHERE label = '" + D0_label + "'", function (err, result, fields) {
        if (err) throw err;
        global.Sicaklik_Frequency = result[0].Frequency
        console.log('Sicaklik Interval: ' + global.Sicaklik_Frequency);
        }); 
    
    // Connect to PLC
    socket.on('connect', function () {

        // Read Kapi value in interval
        function readKapi() {
            client.readCoils(M100,16).then(function (resp) {
                value = resp.response.body.valuesAsArray
                console.log(value[9])
            }, console.error);
            setTimeout(readKapi, global.Kapi_Frequency);
        };
        readKapi();
          
        // Read Sicaklik value in interval
        function readSicaklik() {
            client.readHoldingRegisters(D0,16).then(function (resp) {
                value = resp.response.body.valuesAsArray
                console.log(value[0])
            }, console.error);
            setTimeout(readSicaklik, global.Sicaklik_Frequency);
        };
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

// // Create a table
// var sql = "CREATE TABLE Device_Log (Label VARCHAR(30), Value VARCHAR(255), Date_Time DATETIME)"
// var sql_Drop_table = "DROP TABLE Device_Description"
// con.query(sql, function (err, result) {
//     if (err) throw err;
//     console.log("Table created");
// });

// // Insert into a table
// var sql = "INSERT INTO Device_Description (Label, Frequency, Description) VALUES ('M100', 60, 'Opens/Closes Door')";
// con.query(sql, function (err, result) {
//     if (err) throw err;
//     console.log("1 record inserted");
// });

// // Show Tables in database
// var sql_Show_Tables = "SHOW TABLES"
// con.query(sql_Show_Tables, function (err, result) {
//     if (err) throw err;
//     console.log(result);
// });