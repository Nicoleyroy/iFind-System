const express = require('express')
const connectDB = require('./db')
const app = express()
const connectToDB = require('./mongodb')
const UserModel = require('./src/models/user')
connectToDB()

app.use(express.json({ extended: true }))

//routes

app.post('/user', (req,res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'body input is invalid' })
    }

    const user = UserModel.create({
        name,
        email,
        password
    })

    res.json({ data: user, message: 'User created' })
})

app.listen(4000, () => {
    console.log("Server started on port 4000")
})  