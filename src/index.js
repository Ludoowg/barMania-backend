//Dependencies
const dotenv = require('dotenv')
dotenv.config()
const { connect } = require('node-mailjet')
const initDatabase = require('../database')
const { Pool } = require('pg')
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const app = express();

app.use(cors())
app.use(bodyParser.json())


const database = initDatabase()

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: parseInt(process.env.DATABASE_PORT, 10),
    ssl : { rejectUnauthorized: false },
    connectionString: 'postgres://irygyvyjmzluyb:184b80a4a95ed1fbd72709dd2727c404ed345b9bb0c12bd085a7835feb640d6a@ec2-34-193-113-223.compute-1.amazonaws.com:5432/d5lockamu7mij0'
})

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

app.get('/', async (req, res) => {
    res.send('toto')
})

app.get('/toto', async (req, res) => {
    res.send(process.env.DATABASE_USER)
})

app.post('/', async (req, res) => {
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

app.get('/infosUser/:email', async (req, res) => {
    const { email } = req.params
    database('utilisateur').where('email', email).select(['pseudo', 'email', 'password', 'idevenement'])
    .then(function(result) {
        res.status(200).send(result[0])
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
    pool.query(`
                    SELECT * FROM
                        (SELECT idbar, nombar, rue, ville, codepostal, numerotel, latitude, longitude, ('8000' * acos(cos(radians(${latitude})) * cos(radians(latitude)) *
                        cos(radians(longitude) - radians(${longitude})) +
                        sin(radians(${latitude})) * sin(radians(latitude))))
                        AS distance
                        FROM bar) AS distance
                    WHERE distance < '11260'
                    ORDER BY distance ASC;`, (error, results) => {
        if (error) {
            throw error
        }
        res.status(200).json(results.rows)
    })
})

app.post('/profilPseudo', async (req, res) => {
    database('utilisateur').where('email', '=', req.body.email).update({pseudo: req.body.pseudo}).then(res.sendStatus(200))
})

app.post('/profil', async (req, res) => {
    database('utilisateur').count('email').where('email', req.body.emailModif).then(function(result) {
        if(result[0].count == '0') {
            database('utilisateur').where('email', '=', req.body.emailActuel).update({email: req.body.emailModif}).update({pseudo: req.body.pseudo}).then(res.sendStatus(200))
        }
        else {
            res.status(400).send(JSON.stringify('Cette adresse email est déjà utilisée.'))
        }
    })
})

app.post('/profilPassword', async (req, res) => {
    database('utilisateur').where('email', '=', req.body.email).update({password: req.body.password}).then(res.sendStatus(200))
})


app.get('/liste_evenements/:latitude/:longitude', async (req, res) => {
    const { latitude, longitude } = req.params
    pool.query(`
                SELECT DISTINCT * FROM
                    (SELECT idbar, nombar, rue, ville, codepostal, numerotel, latitude, longitude, ('8000' * acos(cos(radians(${latitude})) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(${longitude})) +
                    sin(radians(${latitude})) * sin(radians(latitude))))
                    AS distance
                    FROM bar) AS distance
                    LEFT OUTER JOIN evenement
                    ON evenement.idbar = distance.idbar
                WHERE distance < '13260'
                AND idevenement IS NOT NULL
                ORDER BY distance ASC;`, (error, results) => {
        if (error) {
            throw error
        }
        res.status(200).json(results.rows)
    })
})

app.post('/inscriptionEvenement', async (req, res) => {
    database('utilisateur').where('email', '=', req.body.email).update({idevenement: req.body.idEvenement}).then( () => {
        database('evenement').where('idevenement', '=', req.body.idEvenement).update({nbpersonneinscrit: req.body.nbInscrit + 1}).then(res.sendStatus(200))
    })
})

app.post('/desinscriptionEvenement', async (req, res) => {
    database('utilisateur').where('email', '=', req.body.email).update({idevenement: null}).then( () => {
        database('evenement').where('idevenement', '=', req.body.idEvenement).update({nbpersonneinscrit: req.body.nbInscrit - 1}).then(res.sendStatus(200))
    })
})

app.get('/binks', async (req, res) => {
    database('utilisateur').select('*').from('bar').then(function(result) {
        res.send(result)
    })
})

app.listen(process.env.PORT, () => console.log(`App listening at http://localhost:${process.env.PORT}`))



/*
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

 app.get('/binks', async (req, res) => {
    database('utilisateur').select('*').from('bar').then(function(result) {
        res.send(result)
    })
})

app.listen(process.env.PORT, () => console.log(`App listening at http://localhost:${process.env.PORT}`))

//Binbinkstest
*/