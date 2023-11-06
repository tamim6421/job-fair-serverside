
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
    const bidProjectCollection = client.db('job_fair').collection('bidData')
   


// get category 
app.get('/category', async(req, res) =>{
    const cursor = categoryCollections.find()
    const result = await cursor.toArray()
    res.send(result)
})



    // post add jobs in the database 
    app.post('/jobs', async(req, res) =>{
        const jobs = req.body 
        console.log(jobs)
        const result = await jobsCollections.insertOne(jobs)
        res.send(result)
    })



    // update added  job data 
app.put('/jobs/:id', async(req, res) =>{
  const id = req.params.id 
  const filter = {_id: new ObjectId(id)}
  const updateJobs = req.body 
  // console.log(updateJobs)
  const option = {upsert: true}
  const jobs ={
    $set:{
      jobTitle:updateJobs.jobTitle,
       deadline:updateJobs.deadline,
       priceRange:updateJobs.priceRange,
       shortDescription:updateJobs.shortDescription,
       category:updateJobs.category,
       maximumPrice:updateJobs.maximumPrice,
       minimumPrice:updateJobs.minimumPrice

    }
  }
  const result = await jobsCollections.updateOne(filter, jobs, option)
  res.send(result)
})


// delete posted job 
app.delete('/jobs/:id', async(req, res) =>{
  const id = req.params.id 
  const query = {_id: new ObjectId(id)}
  const result = await jobsCollections.deleteOne(query)
  res.send(result)
})



// get all jobs by using category and email
app.get('/jobs', async (req, res) => {
  const employerEmail = req.query.employerEmail;
  const category = req.query.category;

  let query = {};
  if (employerEmail) {
    query.employerEmail = employerEmail;
  }

  let catQueryObj = {};
  if (category) {
    catQueryObj.category = category;
  }

  console.log('email', query);
  console.log('cat', catQueryObj);

  const cursor = jobsCollections.find({ ...catQueryObj, ...query });
  const result = await cursor.toArray();

  res.send(result);
});







// get job by id 
app.get('/jobs/:id', async(req, res) =>{
  const id = req.params.id 
  const query = {_id: new ObjectId(id)}
  const result = await jobsCollections.findOne(query)
  res.send(result)
})




// post bid on the Project data 
app.post('/bidProject', async(req, res) =>{
  const data = req.body 
  console.log(data)
  const result = await bidProjectCollection.insertOne(data)
  res.send(result)
})

// get my bids all jobs 
app.get('/bidProject', async(req, res) =>{
  const cursor = bidProjectCollection.find()
  const result = await cursor.toArray()
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