
const express = require('express');
const logger = require('./logger')      //import winston logger
const helmet = require('helmet')
const cors = require('cors')
const { EmailClient } = require("@azure/communication-email");

const {connectDB,addSessionToDB,timeToDelete,Query,serialKey} = require("./functions")
const app = express()
app.use(helmet())
app.use(cors())
app.use(helmet())
app.use(express.json())
require("dotenv").config();


// This code demonstrates how to fetch your connection string
// from an environment variable.
const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];
const emailClient = new EmailClient(connectionString);

//PORT THE SERVICE IS RUNNING AT 
let port = process.env.PORT   


/*
    reciverEmail has a dedfault email. This is for initialization purposes only
    This value is edited later by the value received from the user's request body [email]
*/
let receiverEmailAddress = "ericmwas01@gmail.com" 
let emailSubject = "Authenticate Azure Service"

/*
PART of v2 will be used to send better UI email to the client 
*/ 
let emailMessage = `<html>
                        <h1>Click the button to access Konectify Services</h1>
                        <body>
                            <p id="demo">{{session}}</p>
                            <button onclick="alert("Hey there something")">Click Me</button>
                        </body>  
                    </html>`


let displayName = "localblyRegister"
let SenderEmail = "DoNotReply@8313646a-dbd9-48bf-8bad-d2e18481addf.azurecomm.net"
let finalEmailMessage="Below is your special key From Eric .\n\nEnter it in homepage to complete account creation \n\n\n"
let footnote = "\n\nThe key will expire in 5 minutes"
let serialkey = serialKey();
let finalEmailMessage1 = finalEmailMessage.concat(serialkey)
let finalEmailMessage2 =  finalEmailMessage1.concat(footnote)

async function pollEmailService(senderEmail, emailSubject,emailMessage){
    const message = {
        senderAddress: senderEmail,
        //htmlBody:"<html><h1>Hello World</h1></html>",
        content: {
            subject: emailSubject,
            plainText:"Return this value",
            plainText:emailMessage,
           // html: emailMessage,
        }, 
        recipients: {
          to: [
            {
              address: receiverEmailAddress,
              displayName: displayName,
            },
          ],
        },
      };

    
    const POLLER_WAIT_TIME = 10
    try {
       
        const poller = await emailClient.beginSend(message);
        
            //connect to db then send the session ID[emailMessage1] in the database
           
            let connection =  connectDB();   
            let sql =   `INSERT INTO sessionids(sessionIDs,email) VALUES ('${serialkey}', '${receiverEmailAddress}');`
            let result = Query(connection, sql) 
           
            let timeout =  1000* 60 * 5; // time after which the function will run 
            //emailMessage1 is  the sessionID it is a randomly generated string consisting of different alphanumeric characters
            let sql_delete = `DELETE FROM sessionids WHERE sessionIDs= '${serialkey}';`
           
            //if the db has been updated with the session id 
            //then start a timeout function that will expire after 5 minutes 
            //timeout to delete the session from the db after 5 minutes 
           
           setTimeout(()=>{Query(connection, sql_delete)}, timeout);
           // console.log("Deleted session from Db session of email\n\n Client did not authenticate in time ", receiverEmailAddress)
            logger.info("Deleted session from Db session of email\n\n Client did not authenticate in time ", receiverEmailAddress)
            if (!poller.getOperationState().isStarted) {
                throw "Poller was not started."
            }
             //make poller an async functionality 
            let timeElapsed = 0;
            
            while(!poller.isDone()) {
            poller.poll();
            //console.log("Email send polling in progress");
            logger.info("Email send polling in progress")
    
            await new Promise(resolve => setTimeout(resolve, POLLER_WAIT_TIME * 1000));
            timeElapsed += 10;
    
            if(timeElapsed > 18 * POLLER_WAIT_TIME) {
                throw "Polling timed out.";
            }
            }
           // console.log("<<<<<<<<<<<<<<<<<<email polling service" + poller.getResult.status)
            if(poller.getResult().status === KnownEmailSendStatus.Succeeded) {
                //console.log(`Successfully sent the email (operation id: ${poller.getResult().id})`);
                logger.info(`Successfully sent the email (operation id: ${poller.getResult().id})`)
            }
            else {
                throw poller.getResult().error;
            }
        } catch (e) {
            //console.log("line 141 error",e);
            logger.error("App.js poller Email Service  ", e)
        }
}
        

  
app.post("/ConfirmSessionID",(req,res)=>{
          //  console.log("confirming Session ID ")
            logger.info("confirming Session ID ")
            try {
                let sessionID = req.body.sessionID;
                if (!sessionID){
                    logger.error("Did not receive session ID")
                }
                let sql = `select * from sessionids where sessionIDs = '${sessionID}'`
                let result = Query(connection, sql) 
                if (!result ){
                    logger.error("Session Key has expired")
                    res.statusMessage("Session Key has expired")
                }
            } catch (error) {
                console.log("Failed to connect to DB ", error.message)
                logger.error("Failed to connect to DB line 148 app.js")
            }
            
    })
     
    //route to send verfication email
  app.post('/sendEmail',(req,res)=>{
    
    let email = req.body.Email;
    let subject = req.body.subject; 
    let message = req.body.message; 
    if(email){
        receiverEmailAddress = email;
     }
   
    message = "Hey there this is eric Mwangi " 
    res.status(200).json(
        {
            "message":"Check your email to authenticate"
        }).end()
    pollEmailService(email, subject, message);
  })
  



 



app.listen(port,()=>{
    console.log(port);
    logger.info(`search engine server running on port ${port}`);
    //Emitting the event 
});