//Dependencies
const dotenv = require('dotenv')
dotenv.config()
import { connect } from 'node-mailjet'
const initDatabase = require('../database')
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();

app.use(cors())
app.use(bodyParser.json())


const database = initDatabase()

function sendEmail(recipient){

    const mailjet = connect(
        process.env.MAILJET_API_KEY, 
        process.env.MAILJET_API_SECRET
    ) 

    return mailjet
    .post("send", { version: 'v3.1'}) 
    .request( {
        Messages: [
            {
                From: {Email: 'ludovic.geran@efrei.net', Name: 'Ludovic'},
                To: [recipient],
                Subject: 'Merci de votre inscription sur BarMania!',
                TextPart: 'default  text',
                HTMLPart: 'Nous sommes très heureux de votre inscription ! Vous allez adorer trouver des bars près de chez vous!'
            }
        ]
     })
     .then(console.log)
}

async function main(usermail, username){
    await sendEmail({Email: usermail, Name: username})
    console.log("After mail")
    }


app.post('/inscription', async (req, res) => {
    //database.select('*').from('bar').then(bars => res.send(bars))
    database('utilisateur').count('email').where('email', req.body.email).then(function(result) {
        if(result[0].count == '0') {
            database('utilisateur').insert({pseudo: req.body.pseudo, nom: req.body.nom, prenom: req.body.prenom, email: req.body.email, password: req.body.mdp}).then(res.sendStatus(200))
            main(req.body.email,req.body.prenom)
        }
        else {
            res.status(400).send(JSON.stringify('Cette adresse email est déjà utilisée.'))
        }
    })
})

app.post('/connexion', async (req, res) => {
    database('utilisateur').where({email: req.body.email}).select(['email', 'password']).then(function(result) {
        if(result.length != 0) {
            if(result[0].email == req.body.email && result[0].password == req.body.mdp) {
                res.sendStatus(200)
            }
            else {
                res.status(400).send(JSON.stringify('L\'adresse email ou le mot de passe est incorrect.'))
            }
        }
        else {
            res.status(400).send(JSON.stringify('L\'adresse email ou le mot de passe est incorrect.'))
        }
    })
})

app.get('/listebars/:latitude/:longitude', async (req, res) => {
    const { latitude, longitude } = req.params

    console.log(req.params.latitude, req.params.longitude)
})

//main("geranludovic@gmail.com", "ludo")

app.listen(process.env.PORT, () => console.log(`App listening at http://localhost:${process.env.PORT}`))
