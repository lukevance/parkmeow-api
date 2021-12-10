require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.VERIFY_SERVICE_SID;
const airtableKey = process.env.AIRTABLE_API_KEY;
const airtableBaseID = process.env.AIRTABLE_BASE_ID;

const client = require('twilio')(accountSid, authToken);

const Airtable = require('airtable');
const base = new Airtable({apiKey: airtableKey}).base(airtableBaseID);

const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

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
                 res.json({status: verification.status});
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
      .create({to: req.body.phone, code: req.body.code})
      .then(verification_check => {
          console.log(verification_check.status);
          // TODO save user to db with token, return token with status
          let poorAuthToken = getRandomInt(100000, 999999);
          base('Users').create([
            {
              "fields": {
                "number": req.body.phone,
                "auth_token": poorAuthToken
              }
            }
          ], (err, records) => {
            if (err) {
                console.error(err);
                res.json(err);
            } else {
                console.log(records);
                if (records.length > 0) {
                    res.json(records[0].fields);
                } else {
                    res.json(records);
                }
            }
            return;
          });
      });
});

// create a new parking session, validate via the temp authtoken
app.post('/parking-session', (req, res) => {
    if (!req.body.auth_token) res.status(401).send('No auth_token provided');
    if (!req.body.amount || !req.body.license_plate) res.status(422).send('Missing required fields.');
    // check for auth_token before creating
    base('Users').select({
        view: 'Grid view',
        filterByFormula: "{auth_token} = "  + req.body.auth_token
    }).firstPage((err, records) => {
        if (err) { 
            console.error(err); 
            res.send(err);
            return;
        } else if (records.length < 1) {
            res.status(401).send('Bad auth_token');
            return;
        }
        const items = records.map(rec => rec.fields);
        // create new session data
        base('Parking_Sessions').create([
            {
              "fields": {
                  "license_plate": req.body.license_plate,
                  "amount": req.body.amount,
                  "location_code": req.body.location_code,
                  "user_phone": items[0].phone
              }
            }
          ], (err, records) => {
            if (err) {
              console.error(err);
              res.json(err);
              return;
            }
            const createdItem = records.map(rec => rec.fields);
            res.status(201).json(createdItem);
          });
    });
});



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});