//Dependencies

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors())

const port = 3000;

//Knex Connect 

const database = require('knex')({
  client: 'pg',
  connection: {
    host : 'ec2-34-193-113-223.compute-1.amazonaws.com',
    port : '5432',
    user : 'irygyvyjmzluyb',
    password : '184b80a4a95ed1fbd72709dd2727c404ed345b9bb0c12bd085a7835feb640d6a',
    database : 'd5lockamu7mij0',
    ssl : { rejectUnauthorized: false }
  }
})


app.get('/data', (req, res) => res.send('Hello World!'));


app.get('/', async (req /* Requete du client */ , res /* Reponse du serveur */) => {
    database.select('*').from('bar').then(bars => res.send(bars))
 })

/*app.get('/data/:id', async (req, res) => {
   const id = req.params.id;

   const dataFromDB = await knex('data')
   .where({
        numero: id
      })
   .select('*')

   if (dataFromDB.length === 0) {
      res.status(404).send({ Error: "Pokemon not found" });
      return;
   }

   const dataToSend = JSON.parse(dataFromDB[0].details);
   res.send(dataToSend);
})
*/

app.listen(process.env.PORT || port, () => console.log(`Example app listening at http://localhost:${port}`));

//module.exports = app;
