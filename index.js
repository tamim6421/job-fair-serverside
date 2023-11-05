
const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion, Collection, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000 


// middleware 
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.PROJECT_NAME}:${process.env.PROJECT_PASS}@cluster0.iimwc2a.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // database Collection
    const categoryCollections = client.db('job_fair').collection('services')
    const jobsCollections = client.db('job_fair').collection('all_jobs')


// get category 
app.get('/category', async(req, res) =>{
    const cursor = categoryCollections.find()
    const result = await cursor.toArray()
    res.send(result)
})

// get all jobs 
app.get('/jobs', async(req, res) =>{
  // console.log(req.query.category)

  let query = {}
  if(req.query?.category){
    query={category: req.query.category}
  }
    const cursor = jobsCollections.find(query)
    const result = await cursor.toArray()
    res.send(result)
})

// get job by id 
app.get('/jobs/:id', async(req, res) =>{
  const id = req.params.id 
  const query = {_id: new ObjectId(id)}
  const result = await jobsCollections.findOne(query)
  res.send(result)
})



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('JOB FAIR')
  })
  
  app.listen(port, () => {
    console.log(`PORI IS RUNNING  ${port}`)
  })