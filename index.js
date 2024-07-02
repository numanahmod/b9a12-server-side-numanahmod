const express = require('express');
const app = express();
const {   ObjectId } = require('mongodb');
const cors = require('cors');
const jwt =  require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware



app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1vvlral.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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



    // collections
const packageCollection = client.db('ddPackageDb').collection('addPackage');

const reviewGuideCollection = client.db('ddPackageDb').collection('reviewGuide');

const cartCollection = client.db('ddPackageDb').collection('carts');

const bookingCollection = client.db('ddPackageDb').collection('bookedPackage');

const userCollection = client.db('ddPackageDb').collection('users')

const guidesCollection = client.db('ddPackageDb').collection('TouristGuides')

const storiesCollection = client.db('ddPackageDb').collection('stories')

//jwt 
app.post('/jwt', async (req, res) =>{
  const user = req.body;
  const token = jwt.sign( user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h'});
  res.send({token});
})

// users related api
app.post('/users', async (req, res) =>{
  const user = req.body;
   // insert email if user does not exist :
   const query = {email: user.email}
   const existingUser = await userCollection.findOne(query);
   if(existingUser){
    return res.send({message: 'User already exists', insertedId: null})
   }
    const result = await userCollection.insertOne(user);
    res.send(result)
})
// middlewares
const verifyToken = (req, res, next) =>{
  console.log('inside verify token', req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({message: 'unauthorized access'})
    
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}
// use verify admin after verifyToken 
const verifyAdmin = async (req, res, next) =>{
  const email = req.decoded.email;
  const query = {email: email};
  const user = await userCollection.findOne(query);
  const  isAdmin = user?.role === 'admin';
  if(!isAdmin){
    return res.status(403).send({ message: 'forbidden access'});

  }
  next();
}
// get user data
app.get('/users', verifyToken, verifyAdmin, async(req, res) =>{
  const result = await userCollection.find().toArray();
  res.send(result);
})

// admin api 
app.get('/users/admin/:email', verifyToken, async (req, res) =>{
  const email = req.params.email;
  if(email !== req.decoded.email){
    return res.status(403).send({message: 'forbidden access'})
  }
  const query = {email: email};
  const user = await userCollection.findOne(query);
  let admin = false;
  if(user) {
    admin = user?.role === 'admin';
  }
res.send({ admin })
})



// delete a usr
app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await userCollection.deleteOne(query)
  res.send(result)
})
//make admin 
app.patch('/users/admin/:id',verifyToken, verifyAdmin, async(req, res) =>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result)
})
//add package /admin work
app.post('/package', async (req, res) =>{
  const packageItem = req.body;

    const result = await packageCollection.insertOne(packageItem);
    res.send(result)
})
app.get('/package', async (req, res) =>{
    const result = await packageCollection.find().toArray();
    res.send(result)
})
//get a single pack dtls

app.get('/packageDetails/:id', async(req, res) =>{
  const id = req.params.id
  const query = {_id: new ObjectId(id) }
  const result = await packageCollection.findOne(query)
  res.send(result)
})
//get a single guide dtls

app.get('/guideDetails/:id', async(req, res) =>{
  const id = req.params.id
  const query = {_id: new ObjectId(id) }
  const result = await guidesCollection.findOne(query)
  res.send(result)
})


// cart collection 
app.post('/carts', async (req, res) =>{
  const cartItem = req.body;

    const result = await cartCollection.insertOne(cartItem);
    res.send(result)
})
app.get('/carts', async (req, res) =>{
  const email = req.query.email;
  const query = {email: email}
  const result = await cartCollection.find(query).toArray();
  res.send(result)
})
// book form 
app.post('/myBookings', async (req, res) =>{
  const bookingData = req.body;
  const result = await bookingCollection.insertOne(bookingData);
  res.send(result) 
})
// get all bookings
app.get('/allBookings', async(req, res) =>{
  const result = await bookingCollection.find().toArray();
  res.send(result);
})
// get bookings
app.get('/myBookings', async (req, res) =>{
  const email = req.query.email;
  const query = {email: email}
  const result = await bookingCollection.find(query).toArray();
  res.send(result)
}) 

// delete a Booking
app.delete('/deleteABooking/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await bookingCollection.deleteOne(query)
  res.send(result)
})
// delete a wishList
app.delete('/deleteAWishList/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await cartCollection.deleteOne(query)
  res.send(result)
})
//Tourist guides
app.get('/touristGuides', async (req, res) =>{
  const result = await guidesCollection.find().toArray();
  res.send(result)
})
// review collection 
app.post('/reviews', async (req, res) =>{
  const reviewItems = req.body;
    const result = await reviewGuideCollection.insertOne(reviewItems);
    res.send(result)
})
//review 
app.get('/reviewsOfGuide', async (req, res) =>{
  const result = await reviewGuideCollection.find().toArray();
  res.send(result)
})

//get a single type dtls

app.get('/typeDetails/:id', async(req, res) =>{
  const id = req.params.id
  const query = {_id: new ObjectId(id) }
  const result = await packageCollection.findOne(query)
  res.send(result)
})
// review collection 
app.post('/stories', async (req, res) =>{
  const reviewItems = req.body;
    const result = await storiesCollection.insertOne(reviewItems);
    res.send(result)
})

app.get('/stories', async (req, res) =>{
  const result = await storiesCollection.find().toArray();
  res.send(result)
})
//get a story  dtls

app.get('/storyDetails/:id', async(req, res) =>{
  const id = req.params.id
  const query = {_id: new ObjectId(id) }
  const result = await storiesCollection.findOne(query)
  res.send(result)
})
//get a single guide dtls

// app.get('/guideDetails/:id', async(req, res) =>{
//   const id = req.params.id
//   const query = {_id: new ObjectId(id) }
//   const result = await guidesCollection.findOne(query)
//   res.send(result)
// })




    // await client.connect();
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
    res.send('Assignment 12 is going')
})

app.listen(port, () =>{
    console.log(`Assignment 12 is going on ${port} `);
})