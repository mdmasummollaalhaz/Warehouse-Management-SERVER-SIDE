const express = require("express")
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { decode } = require("jsonwebtoken");
const port = process.env.PORT || 6001

// middleware
app.use(cors())
app.use(express.json())

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        console.log('decodes', decoded)
        req.decoded = decoded
        next()
    })


}

// connect with mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ab5rv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const collectionBooks = client.db('warehouse').collection('books')
        const myBooksCollection = client.db('warehouse').collection('mybooks')

        app.get('/books', async (req, res) => {
            const query = {}
            const cursor = collectionBooks.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/books/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await collectionBooks.findOne(query)
            res.send(result)

        })

        app.get('/my-books/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await myBooksCollection.findOne(query)
            res.send(result)

        })

        // auth
        app.post('/login', async (req, res) => {
            const user = req.body
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send({ accessToken })
        })

        // Add new Book
        app.post('/books', async (req, res) => {
            const newBook = req.body
            const result = await collectionBooks.insertOne(newBook)
            res.send(result)
        })

        // my book collection api
        app.post('/my-books', async (req, res) => {
            const myBooks = req.body
            const result = await myBooksCollection.insertOne(myBooks)
            res.send(result)
        })

        app.get('/my-books', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                const query = { email: email }
                const cursor = myBooksCollection.find(query)
                const myBooks = await cursor.toArray(cursor)
                res.send(myBooks)
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }


        })

        // // Delete my Books
        app.delete('/my-books/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await myBooksCollection.deleteOne(query)
            res.send(result)
        })




        // Delete Book
        app.delete('/books/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await collectionBooks.deleteOne(query)
            res.send(result)

        })

        // Book deliver api
        app.put('/books/:id', async (req, res) => {
            const id = req.params.id
            const updateQty = req.body
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    quantity: updateQty.quantity
                }
            }
            const result = await collectionBooks.updateOne(filter, updateDoc, options);
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Server running")
})



app.listen(port, () => {
    console.log("Listing Server from", port)
})