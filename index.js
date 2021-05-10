const express = require('express');
const app = express();
const port = 3000;
//const router = require('./API.js')
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(process.env.PORT || port, () => console.log(`Example app listening at http://localhost:${port}`));