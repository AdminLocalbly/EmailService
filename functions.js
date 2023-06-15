const mysql = require("mysql")
const fs = require("fs");
const logger = require("./logger")

const addSessionToDB =(session)=>{

}
function serialKey(){
    let alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKFMNOPQRSTUVWXYZ';
    let emailMessage1="serial"
    
    i=0;

    while(i < 20){
        let index = Math.floor(Math.random()  * alphabet.length);
        let alpha = alphabet[index];
        let number = Math.floor(Math.random() * 100);
        let newToken = alpha.concat(number);
        emailMessage1 = emailMessage1.concat(newToken);
        i++;
    }
    return emailMessage1;
}


const connectDB = ()=>{
    //connecting to the db to add the session 
    let connection = mysql.createConnection({
        host:"localblysql.mysql.database.azure.com",
        user:"localblyadmin",
        password:"mysql_2022",
        database:"registration",
        port:"3306",
        ssl:{
            cal: fs.readFileSync("./DigiCertGlobalRootCA.crt.pem")
          }
    })
    connection.connect((err)=>{
        if (err){
            //console.log("error occured while connecting to db ",err.message)
            logger.error("error occured when connecting to DB ",err );
            //throw err;
        }else{
           // console.log("<><><><><><><><><><><><><><><>CONNECTED TO DB")
           logger.info("<<><><<><><>Successfully connected to DB <><><><><><><>")
        }
    })
    return connection;
    
}

function Query(connection, sql){

 
        connection.query(sql, (err,result)=>{
            if(err){
                //console.log("Error in file function.js ", err.message)
                //throw err
                logger.error("error occured when querying the DB ",err.message );
            }
           
            if(result){
                //console.log("Result of DB request", result)
                return result;
            }else{
                //throw new Error("Empty Database");
                //console.log("error")
                logger.error("DB Query did not return any output ")
            }
           
        })
    
}

async function timeToDelete(){
    //delete session after 5 minutes 
}

module.exports ={addSessionToDB, connectDB, timeToDelete,Query,serialKey};