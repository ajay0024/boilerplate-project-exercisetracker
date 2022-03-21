const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bodyParser = require("body-parser")

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// Basic Configuration
const mySecret = process.env['MONGO_URI'];
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }]
});

const exerciseSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },

});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  // console.log(req.body)
  newUserName = req.body.username;
  // console.log(newUserName);
  const newUser = new User({ username: newUserName })
  newUser.save(function(err, data) {
    if (err) return done(err);
    // console.log(data)
    res.json({ username: data.username, _id: data._id })
  })
});

app.get('/api/users', (req, res) => {
  let query = User.find();
  query.select('username _id').exec(function(err, data) {
    if (err) return done(err);
    // console.log(data)
    res.json(data)
  })
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const newExercise = new Exercise({ user: req.params._id, description: req.body.description, duration: req.body.duration })
  if (!isNaN(Date.parse(req.body.date))) {
    // console.log("D : ", req.body.date)
    // console.log("Help Null")
    newExercise.date = new Date(req.body.date);
  }

  newExercise.save(function(err, data) {
    // console.log(data)
    if (err) return console.log(err);
    User.findById(req.params._id, function(err, d) {
      if (err) return console.log(err)
      d.log.push(data._id)
      d.save(function(err, d3) {
        if (err) return done(err);
        res.json({ _id: d3._id, username: d3.username, date: data.date.toDateString(), duration: data.duration, description: data.description })
      })
    })
    // res.json(data);
  })
});

// app.get('/api/users/:_id/logs', (req, res) => {

//   let toDate = new Date(8640000000000000);
//   let fromDate = new Date(-8640000000000000);
//   let limit = Number.MAX_VALUE;

//   if ("from" in req.query) {
//     fromDate = new Date(req.query.from);
//   }
//   if ("to" in req.query) {
//     toDate = new Date(req.query.to);
//   }
//   if ("limit" in req.query) {
//     limit = parseInt(req.query.limit);
//   }
//   console.log("Entering log with fowlloing parameters", req.params, req.query)
//   User.
//     findById(req.params._id).
//     populate({ path: 'log', select: 'description date duration', match: { date: { $gte: fromDate, $lte: toDate } }, options: { limit: limit } }).
//     exec(function(err, data) {
//       if (err) return console.log(err);
//       const logData = data.log.map(obj => {
//         return {
//           date: obj.date.toDateString(),
//           description: obj.description,
//           duration: obj.duration
//         }
//       })
//       let jsonObj = { _id: data._id, username: data.username, count: data.log.length, log: logData }
//       if ("from" in req.query) {
//         jsonObj.from = new Date(req.query.from).toDateString();
//       }
//       if ("to" in req.query) {
//         jsonObj.to = new Date(req.query.to).toDateString();
//       }
//       if ("limit" in req.query) {
//         jsonObj.limit = parseInt(req.query.limit);
//       }
//       // console.log(jsonObj);
//       res.json(jsonObj);
//     })
// });

app.get('/api/users/:_id/logs', (req, res) => {
  var startTime=Date.now()
  let toDate = new Date(8640000000000000);
  let fromDate = new Date(-8640000000000000);
  let limit = Number.MAX_VALUE;

  if ("from" in req.query) {
    fromDate = new Date(req.query.from);
  }
  if ("to" in req.query) {
    toDate = new Date(req.query.to);
  }
  if ("limit" in req.query) {
    limit = parseInt(req.query.limit);
  }
  console.log("Entering log with fowlloing parameters", req.params, req.query)
  User.
    findById(req.params._id).
    populate({ path: 'log', select: 'description date duration'}).
    exec(function(err, data) {
      if (err) return console.log(err);

      let logData = data.log.filter(obj => {
        return  obj.date>=fromDate && obj.date<=toDate
      })

      logData = logData.map(obj => {
        return {
          date: obj.date.toDateString(),
          description: obj.description,
          duration: obj.duration
        }
      })
      logData=logData.slice(0,limit)

      let jsonObj = { _id: data._id, username: data.username, count: logData.length, log: logData }

      res.json(jsonObj);
      console.log("Response time in ms : ", Date.now()-startTime)
    })
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
