const fs = require('fs');

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




const plc_labels = {
    D100_label : 'D100',
    D202_label : 'D202',
    D248_label : 'D248',
    D324_label : 'D324',
    D352_label : 'D352',
    M100_label : 'M100',
    M105_label : 'M105',
    M109_label : 'M109',
    M110_label : 'M110',
    M204_label : 'M204',
    X0_label : 'X0',
    Y3_label : 'Y3',
    Y4_label : 'Y4'
}

const plc_addrss = {
     D100 : 100,    // D100 Derecesi
     D202 : 202,    // FIRIN SETI ISI
     D248 : 248,    // AKTIF PISIRME DAKIKA
     D324 : 324,    // PISIRMEYE KALAN DAKIKA
     D352 : 352,    // PISIRMEYE KALAN SANIYE
     M100 : 8292,   // FIRIN CALISTIR
     M105 : 8297,   // FIRINCI LAMBA
     M109 : 8301,   // M109 Bilgisi
     M110 : 8302,   // PISIRME TAMAM
     M204 : 8396,      // SISTEM ACMA KAPATMA
     X0 : 0,        // M109 SW
     Y3 : 0,        // FAN SOL
     Y4 : 0        // FAN SAG
}

// PLC Variables




// Connect to Database
con.connect(function(err) {
    if (err) throw err;
    console.log('\x1b[32m%s\x1b[0m', "Database connected!");

    // Read PLCs from database
    var plcs_read_sql = "SELECT * FROM PLCs"
    con.query(plcs_read_sql, function (err, result1, fields) {
        if (err) throw err;

        // Iterate to every read PLC
        result1.forEach(plc => {
            const socket = new net.Socket()
            const client = new Modbus.client.TCP(socket, 1)
            const options = {
            'host' : plc.IP,
            'port' : plc.PORT
            }
            socket.connect(options, function(){
                console.log('\x1b[32m%s\x1b[0m','PLC ' + plc.PLC_ID + ' Connected!');
            })
            // Set reading interval
            // UpdateFrequency(D100_label,5000)
            
            var D100_sql = "SELECT * FROM Device_Description WHERE PLC_ID = " + plc.PLC_ID
            con.query(D100_sql, function (err, result2, fields) {
                if (err) throw err;
                socket.on('connect', function(){
                    
                    result2.forEach(add_label => {
                        // Read D100 value in interval
                        if (add_label.Label[0] == 'D'){
                            D_Frequency = add_label.Frequency
                            readD()
                            function readD() {
                                dAddressStr = add_label.Label
                                dAddress = dAddressStr.substring(1);
                                dAddressInt = parseInt(dAddress)
                                client.readHoldingRegisters(dAddressInt,16).then(function (resp) {
                            
                                    // Get current date and time
                                    dateTime = GetDateTime()
        
                                    // Get D100 value
                                    D_value = resp.response.body.valuesAsArray[0]
        
                                    // Add D100 log to Mysql table
                                    AddValue(plc.PLC_ID, add_label.Label, D_value, dateTime)
                                }, console.error);
                                setTimeout(readD, add_label.Frequency);
                            };
                            
                        }
                        if (add_label.Label[0] == 'M'){
                            D_Frequency = add_label.Frequency
                            readM()
                            function readM() {
                                mAddressStr = add_label.Label
                                mAddress = mAddressStr.substring(1);
                                mAddressInt = 8192 + parseInt(mAddress)
                                client.readCoils(mAddressInt,16).then(function (resp) {
        
                                    // Get current date and time
                                    dateTime = GetDateTime()
        
                                    // Get M109 value
                                    M_value = resp.response.body.valuesAsArray[0]
        
                                    // Add M109 log to Mysql table
                                    AddValue(plc.PLC_ID, add_label.Label, M_value, dateTime)
        
                                }, console.error);
                                setTimeout(readM, add_label.Frequency);
                            };
                            
                        } 

                    })

                    

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

        });
    });
    
});