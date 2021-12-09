require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.VERIFY_SERVICE_SID;

const express = require('express');
const app = express();
const port = 3000;

const client = require('twilio')(accountSid, authToken);

app.get('/', (req, res) => {
  res.send('Let me park right meow!');
});

app.post('/send-code', (req, res) => {
    client.verify.services(process.env.VERIFY_SERVICE_SID)
             .verifications
             .create({to: process.env.MY_PHONE, channel: 'sms'})
             .then(verification => {
                 console.log(verification.status);
                 res.send(`you are: ${verification.status}`);
             });
    res.send();
})

// verify the code the user provided, return a temp authtoken (store the token somewhere)
app.post('/verify-code', (req, res) => {
    client.verify.services(process.env.VERIFY_SERVICE_SID)
      .verificationChecks
      // TODO fix from twilio's sample
      .create({to: '+15017122661', code: '1234'})
      .then(verification_check => console.log(verification_check.status));
})

// create a new parking session, validate via the temp authtoken

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})