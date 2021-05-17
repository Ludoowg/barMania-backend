const knex = require('knex')
const dotenv = require('dotenv')

dotenv.config()

//Connect database function
module.exports = function () {

    const { DATABASE_HOST: host, DATABASE_PORT: port, DATABASE_PASSWORD: password, DATABASE_USER: user, DATABASE_NAME: database } = process.env
    
    return knex({
        client: 'pg',
        connection: {
            host,
            port: parseInt(port, 10),
            user,
            password,
            database,
            ssl : { rejectUnauthorized: false }
        }
    })

}