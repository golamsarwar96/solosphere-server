const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 9000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i16dm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const jobsCollection = client.db("solosphere").collection("jobs");
    const bidsCollection = client.db("solosphere").collection("bids");

    //Jobs Related API's
    app.post("/add-job", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      console.log(jobData);
      res.send(result);
    });

    //Get a specific data or jobs using id
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    //Get All jobs data.
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    //advanced all jobs get method
    app.get("/all-jobs", async (req, res) => {
      const filter = req.query.filter;
      let query = {};
      if (filter) {
        query.category = filter;
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    //get all jobs posted by a specific user
    app.get("/jobs/:email", async (req, res) => {
      const email = req.params.email;
      //Nested object er value use korte "" bebohar korechi
      const query = { "buyer.email": email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    //Update a specific data or jobs
    app.put("/updated-job/:id", async (req, res) => {
      const id = req.params.id;
      jobData = req.body;
      const updated = {
        $set: jobData,
      };
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await jobsCollection.updateOne(query, updated, options);
      res.send(result);
    });
    //Delete job
    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });

    //bid related api's
    app.post("/add-bid", async (req, res) => {
      const bidData = req.body;
      // step - 0 : Check if this user has already bid on this job
      const query = { email: bidData.email, job_id: bidData.job_id };
      // const alreadyExist = await bidsCollection.findOne(query);
      // if (alreadyExist) {
      //   return res.status(400).send("You have already placed a bit.");
      // }
      //step - 1 : get the data from the request body
      const result = await bidsCollection.insertOne(bidData);
      //step - 2 Bidcount
      const filter = { _id: new ObjectId(bidData.jobId) };
      const update = {
        //bidCount : 1 means incrementing by 1
        $inc: { bid_count: 1 },
      };
      const updateBidCount = await jobsCollection.updateOne(filter, update);
      console.log(updateBidCount);
      res.send(result);
    });

    //get all bids for a specific user

    app.get("/bids/:email", async (req, res) => {
      const isBuyer = req.query.buyer;
      const email = req.params.email;
      let query = {};
      if (isBuyer) {
        query.buyer = email;
      } else {
        query.email = email;
      }
      const result = await bidsCollection.find(query).toArray();
      res.send(result);
    });

    //UPDATE BID STATUS
    app.patch("/bid-status-update/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updated = {
        $set: {
          status,
        },
      };
      const result = await bidsCollection.updateOne(filter, updated);
      res.send(result);
    });

    // bid request separately
    // app.get("/bid-request/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = { buyer: email };
    //   const result = await bidsCollection.find(query).toArray();
    //   res.send(result);
    // });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello from SoloSphere Server....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
