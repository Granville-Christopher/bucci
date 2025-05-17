const bcrypt = require('bcryptjs')
require('dotenv').config()

const SALT = process.env.SALT;
async function passwordEncrypt(password) {
    return await bcrypt.hash(password, SALT); 
}

module.exports = {
    passwordEncrypt,
}
