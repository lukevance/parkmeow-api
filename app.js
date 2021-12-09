require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.VERIFY_SERVICE_SID;

const client = require('twilio')(accountSid, authToken);

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Let me park right meow!');
});

app.post('/send-code', (req, res) => {
    try {
        if (req.body && req.body.phone) {
            client.verify.services(serviceSid)
             .verifications
             .create({to: req.body.phone, channel: 'sms'})
             .then(verification => {
                 console.log(verification.status);
                 res.send(`you are: ${verification.status}`);
             });    
        } else {
            throw 'No phone number provided!'
        }
    } catch (error) {
        console.log(error);
        res.send(`your number ${req.body.phone} is not valid. Please provide another.`);    
    }
});

// verify the code the user provided, return a temp authtoken (store the token somewhere)
app.post('/verify-code', (req, res) => {
    client.verify.services(serviceSid)
      .verificationChecks
      // TODO fix from twilio's sample
      .create({to: '+15017122661', code: '1234'})
      .then(verification_check => console.log(verification_check.status));
})

// create a new parking session, validate via the temp authtoken

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})