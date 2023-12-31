const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const {
  MongoClient,
  ServerApiVersion,
  Collection,
  ObjectId,
} = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://job-fair-1170a.web.app",
      "https://job-fair-1170a.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.PROJECT_NAME}:${process.env.PROJECT_PASS}@cluster0.iimwc2a.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("middleware token", token);

  if (!token) {
    return res.status(401).send({ message: "not authorized" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .send({ message: "Token has expired. Please log in again." });
      }
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    // database Collection
    const categoryCollections = client.db("job_fair").collection("services");
    const jobsCollections = client.db("job_fair").collection("all_jobs");
    const bidProjectCollection = client.db("job_fair").collection("bidData");
    const postCollections = client.db("job_fair").collection("postData");



    // token related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1hr",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // remove token in logout user
    app.post("/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // get category
    app.get("/category", async (req, res) => {
      const cursor = categoryCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    });


    // post all forum 
    app.post('/posts', async(req, res) =>{
      try {
        const post = req.body 
        const result = await postCollections.insertOne(post)
        res.send(result)
        
      } catch (error) {
        console.log(error)
      }
    })



    // get post data 
app.get('/allpost',  async(req, res) =>{
  try {
    const data = req.query 
    // console.log(data)
    const page = parseInt(req.query.page)
    const size = parseInt(req.query.size)
    console.log('page', page, size)
    const count = await postCollections.estimatedDocumentCount()
    const result = await postCollections.find().skip(page*size).limit(size).toArray()
    res.send({result, count})
  } catch (error) {
    console.log(error)
  }
})



    // post add jobs in the database
    app.post("/jobs", async (req, res) => {
      const jobs = req.body;
      const result = await jobsCollections.insertOne(jobs);
      res.send(result);
    });

    // update added  job data
    app.put("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateJobs = req.body;
      const option = { upsert: true };
      const jobs = {
        $set: {
          jobTitle: updateJobs.jobTitle,
          deadline: updateJobs.deadline,
          priceRange: updateJobs.priceRange,
          shortDescription: updateJobs.shortDescription,
          category: updateJobs.category,
          maximumPrice: updateJobs.maximumPrice,
          minimumPrice: updateJobs.minimumPrice,
        },
      };
      const result = await jobsCollections.updateOne(filter, jobs, option);
      res.send(result);
    });

    // delete posted job
    app.delete("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollections.deleteOne(query);
      res.send(result);
    });

    // get all jobs by using category and email
    app.get("/jobs", async (req, res) => {

      const employerEmail = req.query.email;
      const category = req.query.category;

      let query = {};
      if (employerEmail) {
        query.employerEmail = employerEmail;
      }

      let catQueryObj = {};
      if (category) {
        catQueryObj.category = category;
      }

      const cursor = jobsCollections.find({ ...catQueryObj, ...query });
      const result = await cursor.toArray();

      res.send(result);
    });


    // find all jobs
    app.get('/all', async(req, res) =>{
      const searchText = req.query
      // console.log(searchText)
      const query = {
        category:{$regex: searchText.search, $options: 'i'}
      }
      const cursor = jobsCollections.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })


    app.get("/findjobs", verifyToken, async (req, res) => {

      const employerEmail = req.query.email;

      if (req.user.email != employerEmail) {
        res.status(403).send({ message: "Forbidden Access" });
        return;
      }

      let query = {};
      if (employerEmail) {
        query.employerEmail = employerEmail;
      }

      const cursor = jobsCollections.find({ ...query });
      const result = await cursor.toArray();

      res.send(result);
    });

    // get job by id
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollections.findOne(query);
      res.send(result);
    });

    // post bid on the Project data
    app.post("/bidProject", async (req, res) => {
      const data = req.body;
      const result = await bidProjectCollection.insertOne(data);
      res.send(result);
    });

    // get my bids all jobs
    app.get("/bidProject", verifyToken, async (req, res) => {
    
      const email = req.query.email;

      if (req.query.email != req.user.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      let query = {};
      if (email) {
        query.email = email;
      }
   
      const cursor = bidProjectCollection
        .find({ ...query })
        .sort({ status: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/request", async (req, res) => {
      const cursor = bidProjectCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // update job status with click Bid request reject button

    app.patch("/bidProject/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = req.body;
      console.log(req.body);
      const updateDoc = {
        $set: {
          status: updateStatus.status,
        },
      };
      console.log(updateStatus);
      const result = await bidProjectCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("JOB FAIR");
});

app.listen(port, () => {
  console.log(`PORI IS RUNNING  ${port}`);
});
