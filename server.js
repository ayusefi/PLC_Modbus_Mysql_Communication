const fs = require('fs');
var async = require('async');


// create a tcp modbus client
const Modbus = require('jsmodbus')
const net = require('net')

var databaseObjectraw = fs.readFileSync('databse_info.json')
var databaseObject = JSON.parse(databaseObjectraw)

// Mysql database Connection
var mysql = require('mysql');
var con = mysql.createConnection({
    host: databaseObject.host,
    user: databaseObject.user,
    password: databaseObject.password,
    database: databaseObject.database
  });

// Connect to Database
con.connect(function(err) {
    if (err) throw err;
    console.log('\x1b[32m%s\x1b[0m', "Database connected!");

    // Read PLCs from database
    var plcs_read_sql = "SELECT * FROM PLCs"
    con.query(plcs_read_sql, function (err, PLC_result, fields) {
        if (err) throw err;

        // Iterate in PLCs
        async.map(PLC_result, function(plc, callback) {
            const socket = new net.Socket()
            const client = new Modbus.client.TCP(socket, 1)
            const options = {
            'host' : plc.IP,
            'port' : plc.PORT
            }

            // Connect to read PLC
            socket.connect(options, function(){
                console.log('\x1b[32m%s\x1b[0m','PLC ' + plc.PLC_ID + ' Connected!');
            })

            // Set reading interval
            // UpdateFrequency(D100_label,5000)

            var ADDRESS_sql = "SELECT * FROM Device_Description WHERE PLC_ID = " + plc.PLC_ID
            con.query(ADDRESS_sql, function (err, ADDRESS_result, fields) {
                if (err) throw err;
                socket.on('connect', function(){

                    // Iterate in addresses of plc
                    async.map(ADDRESS_result, function(ADDRESS, callback) {
                        // Read addresses starting with D value in specified interval
                        if (ADDRESS.Label[0] == 'D'){
                            D_Frequency = ADDRESS.Frequency
                            readD()
                            function readD() {
                                dAddressStr = ADDRESS.Label
                                dAddress = dAddressStr.substring(1);
                                dAddressInt = parseInt(dAddress)
                                client.readHoldingRegisters(dAddressInt,16).then(function (resp) {
                            
                                    // Get current date and time
                                    dateTime = GetDateTime()

                                    // Get address value
                                    D_value = resp.response.body.valuesAsArray[0]

                                    // Add address log to Mysql table
                                    AddValue(plc.PLC_ID, ADDRESS.Label, D_value, dateTime)
                                }, console.error);
                                setTimeout(readD, ADDRESS.Frequency);
                            };
                        }

                        // Read addresses starting with M value in specified interval
                        if (ADDRESS.Label[0] == 'M'){
                            D_Frequency = ADDRESS.Frequency
                            readM()
                            function readM() {
                                mAddressStr = ADDRESS.Label
                                mAddress = mAddressStr.substring(1);
                                mAddressInt = 8192 + parseInt(mAddress)
                                client.readCoils(mAddressInt,16).then(function (resp) {

                                    // Get current date and time
                                    dateTime = GetDateTime()

                                    // Get address value
                                    M_value = resp.response.body.valuesAsArray[0]

                                    // Add address log to Mysql table
                                    AddValue(plc.PLC_ID, ADDRESS.Label, M_value, dateTime)

                                }, console.error);
                                setTimeout(readM, ADDRESS.Frequency);
                            };  
                        }
                    }, function(err, results) {
                        // results is an array of names
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
                    function AddValue(plc, label, value, datetime){
                        var sql = "INSERT INTO Device_Log (PLC_ID, Label, Value, Date_Time) VALUES (" + plc + ", '" + label + "', '" + value + "', '" + datetime + "')";
                        con.query(sql, function (err, result) {
                            if (err) throw err;
                            console.log("Value " + value + " inserted to PLC " + plc + " table " + label + ' at ' + datetime);
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
                })
                    
                socket.on('error', function (err) {
                    console.log('\x1b[31m%s\x1b[0m','PLC ' + plc.PLC_ID + ' could not connect!');
                })
            });
        }, function(err, results) {
            // results is an array of names
        });
    });
});

