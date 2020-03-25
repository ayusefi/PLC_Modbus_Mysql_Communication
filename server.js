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
const D100 = 100    // Sicaklik Derecesi
const D100_label = 'D100'
const D202 = 202    // FIRIN SETI ISI
const D202_label = 'D202'
const D248 = 248    // AKTIF PISIRME DAKIKA
const D248_label = 'D248'
const D324 = 324    // PISIRMEYE KALAN DAKIKA
const D324_label = 'D324'
const D352 = 352    // PISIRMEYE KALAN SANIYE
const D352_label = 'D352'
const M100 = 8292   // FIRIN CALISTIR
const M100_label = 'M100'
const M105 = 8297   // FIRINCI LAMBA
const M105_label = 'M105'
const M109 = 8301   // Kapi Bilgisi
const M109_label = 'M109'
const M110 = 8302   // PISIRME TAMAM
const M110_label = 'M110'
const M204 = 8396      // SISTEM ACMA KAPATMA
const M204_label = 'M204'
const X0 = 0        // KAPI SW
const x0_label = 'X0'
const Y3 = 0        // FAN SOL
const Y3_label = 'Y3'
const Y4 = 0        // FAN SAG
const Y4_label = 'Y4'

// Connect to Database
con.connect(function(err) {
    if (err) throw err;
    console.log("Database connected!");

    // Set reading interval
    // UpdateFrequency(D100_label,5000)
    
    // Select D100 frequency from table
    var sicaklik_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + D100_label + "'"
    con.query(sicaklik_sql, function (err, result, fields) {
        if (err) throw err;
        global.Sicaklik_Frequency = result[0].Frequency
        console.log('Sicaklik Interval: ' + global.Sicaklik_Frequency);
    });

    // Select D202 frequency from table
    var set_sicaklik_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + D202_label + "'"
    con.query(set_sicaklik_sql, function (err, result, fields) {
        if (err) throw err;
        global.Set_Sicaklik_Frequency = result[0].Frequency
        console.log('Set Sicaklik Interval: ' + global.Set_Sicaklik_Frequency);
        });

    // Select D248 frequency from table
    var pisirme_dk_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + D248_label + "'"
    con.query(pisirme_dk_sql, function (err, result, fields) {
        if (err) throw err;
        global.Pisirme_Dk_Frequency = result[0].Frequency
        console.log('Pisirme Dk Interval: ' + global.Pisirme_Dk_Frequency);
    });

    // Select D324 frequency from table
    var pisirmeye_kalan_dk_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + D324_label + "'"
    con.query(pisirmeye_kalan_dk_sql, function (err, result, fields) {
        if (err) throw err;
        global.Pisirmeye_Kalan_Dk_Frequency = result[0].Frequency
        console.log('Pisirmeye Kalan Dk Interval: ' + global.Pisirmeye_Kalan_Dk_Frequency);
    });

    // Select D352 frequency from table
    var pisirmeye_kalan_sn_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + D352_label + "'"
    con.query(pisirmeye_kalan_sn_sql, function (err, result, fields) {
        if (err) throw err;
        global.Pisirmeye_Kalan_Sn_Frequency = result[0].Frequency
        console.log('Pisirmeye Kalan Sn Interval: ' + global.Pisirmeye_Kalan_Sn_Frequency);
    });

    // Select M100 frequency from table
    var firin_calistir_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + M100_label + "'"
    con.query(firin_calistir_sql, function (err, result, fields) {
        if (err) throw err;
        global.Firin_Calistir_Frequency = result[0].Frequency
        console.log('Firin calistir Interval: ' + global.Firin_Calistir_Frequency);
    });

    // Select M105 frequency from table
    var firinci_lamba_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + M105_label + "'"
    con.query(firinci_lamba_sql, function (err, result, fields) {
        if (err) throw err;
        global.Firinci_Lamba_Frequency = result[0].Frequency
        console.log('Firinci Lamba Interval: ' + global.Firinci_Lamba_Frequency);
    });

    // Select M109 frequency from table
    var kapi_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + M109_label + "'"
    con.query(kapi_sql, function (err, result, fields) {
        if (err) throw err;
        global.Kapi_Frequency = result[0].Frequency
        console.log('Kapi Interval: ' + global.Kapi_Frequency);
    }); 

    // Select M110 frequency from table
    var pisirme_tamam_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + M110_label + "'"
    con.query(pisirme_tamam_sql, function (err, result, fields) {
        if (err) throw err;
        global.Pisirme_Tamam_Frequency = result[0].Frequency
        console.log('Pisirme Tamam Interval: ' + global.Pisirme_Tamam_Frequency);
    });
    
    // Select M204 frequency from table
    var sistem_acma_sql = "SELECT Frequency FROM Device_Description WHERE label = '" + M204_label + "'"
    con.query(sistem_acma_sql, function (err, result, fields) {
        if (err) throw err;
        global.Sistem_Acma_Frequency = result[0].Frequency
        console.log('Pisirme Tamam Interval: ' + global.Sistem_Acma_Frequency);
    });
    
    // Connect to PLC
    socket.on('connect', function () {

        // Read Sicaklik value in interval
        readSicaklik();

        // Read Set Sicaklik value in interval
        readSetSicaklik()

        // Read pisirme dakika value in interval
        readPisirmeDk()

        // Read pisirmeye kalan dakika value in interval
        readPisirmeyeKalanDk()

        // Read pisirmeye kalan saniye value in interval
        readPisirmeyeKalanSn()
        
        // Read Firin Calistir value in interval
        readFirinCalistir();

        // Read Firinci Lamba value in interval
        readFirinciLamba();

        // Read Kapi value in interval
        readKapi();

        // Read Pisirme Tamam value in interval
        readPisirmeTamam();
        
        // Read Sistem Acma Kapatma value in interval
        readSistemAcma();

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

// Function to read value of sicaklik
function readSicaklik() {
    client.readHoldingRegisters(D100,16).then(function (resp) {
        
        // Get current date and time
        dateTime = GetDateTime()

        // Get Sicaklik value
        sicaklik_value = resp.response.body.valuesAsArray[0]

        // Add Sicaklik log to Mysql table
        AddValue(D100_label, sicaklik_value, dateTime)

    }, console.error);
    setTimeout(readSicaklik, global.Sicaklik_Frequency);
};

// Function to read value of set sicaklik
function readSetSicaklik() {
    client.readHoldingRegisters(D202,16).then(function (resp) {
        
        // Get current date and time
        dateTime = GetDateTime()

        // Get Sicaklik value
        set_sicaklik_value = resp.response.body.valuesAsArray[0]

        // Add Sicaklik log to Mysql table
        AddValue(D202_label, set_sicaklik_value, dateTime)

    }, console.error);
    setTimeout(readSetSicaklik, global.Set_Sicaklik_Frequency);
};

// Function to read value of pisirme dakika
function readPisirmeDk() {
    client.readHoldingRegisters(D248,16).then(function (resp) {
        
        // Get current date and time
        dateTime = GetDateTime()

        // Get Sicaklik value
        pisirme_dk_value = resp.response.body.valuesAsArray[0]

        // Add Sicaklik log to Mysql table
        AddValue(D248_label, pisirme_dk_value, dateTime)

    }, console.error);
    setTimeout(readPisirmeDk, global.Pisirme_Dk_Frequency);
};

// Function to read value of pisirmeye kalan dakika
function readPisirmeyeKalanDk() {
    client.readHoldingRegisters(D324,16).then(function (resp) {
        
        // Get current date and time
        dateTime = GetDateTime()

        // Get Sicaklik value
        pisirmeye_kalan_dk_value = resp.response.body.valuesAsArray[0]

        // Add Sicaklik log to Mysql table
        AddValue(D324_label, pisirmeye_kalan_dk_value, dateTime)

    }, console.error);
    setTimeout(readPisirmeyeKalanDk, global.Pisirmeye_Kalan_Dk_Frequency);
};

// Function to read value of pisirmeye kalan dakika
function readPisirmeyeKalanSn() {
    client.readHoldingRegisters(D352,16).then(function (resp) {
        
        // Get current date and time
        dateTime = GetDateTime()

        // Get Sicaklik value
        pisirmeye_kalan_sn_value = resp.response.body.valuesAsArray[0]

        // Add Sicaklik log to Mysql table
        AddValue(D352_label, pisirmeye_kalan_sn_value, dateTime)

    }, console.error);
    setTimeout(readPisirmeyeKalanSn, global.Pisirmeye_Kalan_Sn_Frequency);
};

// Function to read value of firin calistir
function readFirinCalistir() {
    client.readCoils(M100,16).then(function (resp) {

        // Get current date and time
        dateTime = GetDateTime()

        // Get Kapi value
        firin_calistir_value = resp.response.body.valuesAsArray[0]

        // Add kapi log to Mysql table
        AddValue(M100_label, firin_calistir_value, dateTime)

    }, console.error);
    setTimeout(readFirinCalistir, global.Firin_Calistir_Frequency);
};

// Function to read value of firinci lamba
function readFirinciLamba() {
    client.readCoils(M105,16).then(function (resp) {

        // Get current date and time
        dateTime = GetDateTime()

        // Get Kapi value
        firinci_lamba_value = resp.response.body.valuesAsArray[0]

        // Add kapi log to Mysql table
        AddValue(M105_label, firinci_lamba_value, dateTime)

    }, console.error);
    setTimeout(readFirinciLamba, global.Firinci_Lamba_Frequency);
};

// Function to read value of kapi
function readKapi() {
    client.readCoils(M109,16).then(function (resp) {

        // Get current date and time
        dateTime = GetDateTime()

        // Get Kapi value
        kapi_value = resp.response.body.valuesAsArray[0]

        // Add kapi log to Mysql table
        AddValue(M109_label, kapi_value, dateTime)

    }, console.error);
    setTimeout(readKapi, global.Kapi_Frequency);
};

// Function to read value of kapi
function readPisirmeTamam() {
    client.readCoils(M110,16).then(function (resp) {

        // Get current date and time
        dateTime = GetDateTime()

        // Get Kapi value
        pisirme_tamam_value = resp.response.body.valuesAsArray[0]

        // Add kapi log to Mysql table
        AddValue(M110_label, pisirme_tamam_value, dateTime)

    }, console.error);
    setTimeout(readPisirmeTamam, global.Pisirme_Tamam_Frequency);
};

// Function to read value of Sistem Acma Kapatma
function readSistemAcma() {
    client.readCoils(M204,16).then(function (resp) {

        // Get current date and time
        dateTime = GetDateTime()

        // Get Kapi value
        sistem_acma_value = resp.response.body.valuesAsArray[0]

        // Add kapi log to Mysql table
        AddValue(M204_label, sistem_acma_value, dateTime)

    }, console.error);
    setTimeout(readSistemAcma, global.Sistem_Acma_Frequency);
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