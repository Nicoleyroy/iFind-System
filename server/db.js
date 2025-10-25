const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Nyx:nicoleyroy@ifind.srcyztd.mongodb.net/?retryWrites=true&w=majority&appName=ifind";
const localDB = 'mongodb://localhost:27017/'



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const dbName = "ifind-db"

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("dbName");
    const col = db.collection("people");

            let personDocument = {

                "name": { "first": "Alan", "last": "Turing" },
                "birth": new Date(1912, 5, 23), // June 23, 1912
                "death": new Date(1954, 5, 7), // June 7, 1954
                "contribs": [ "Turing machine", "Turing test",
                "Turingery" ],
                "views": 1250000
            }

            const p = await col. insertOne(personDocument) ;
            console.log(myDoc);

            const myDoc = await col.findOne();
            const updatedDoc = await col.updateOne({
                _id: myDoc._id
            }, {
                $set: {
                    name: {
                        first: "Dexter",
                        last: "Peralta",
                    }
                }
            });
            console.log(updatedDoc);

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);