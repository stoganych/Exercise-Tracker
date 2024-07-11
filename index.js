const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const cors = require('cors');
const mongoose = require("mongoose");
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);
mongoose.set('toJSON', { getters: true });

const convertDate = function (date) {
  new Date(date).toDateString();
}

const SchemaUser = new mongoose.Schema({
  username: { type: String, required: true }
})

const SchemaExercise = new mongoose.Schema({
  userid: {type: String },
  username: { type: String },
  description: { type: String },
  duration: { type: Number },
  date: { type: String },
});

const userModel = mongoose.model("user", SchemaUser);
const exerciseModel = mongoose.model("exercise", SchemaExercise);




app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req, res) => {
  new userModel({
    username: req.body.username
  })
    .save()
    .then((user) => {
      res.json({
        username: user.username,
        _id: user._id
      });
    })
});

app.get("/api/users", (req, res) => {
  userModel
    .find({})
    .then((data) => {
      res.json(data)
    })
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date ? req.body.date : new Date().toISOString().substring(0, 10);
  userModel
    .findById(userId)
    .then((userInDb) => {
      new exerciseModel({
        userid: userInDb._id,
        username: userInDb.username,
        description: description,
        duration: parseInt(duration),
        date: date
      })
        .save()
        .then(exercise => {
          res.json({
            _id: exercise.userid,
            username: exercise.username,
            description: exercise.description,
            duration: exercise.duration,
            date: new Date(exercise.date).toDateString()
          })
        })
        .catch(err => {
          console.error(err);
          res.json({ message: 'Exercise creation failed!' });
        })
    })
    .catch((err) => {
      console.error(err);
      res.json({ message: 'There are no users with that ID in the database!' });
    })
})

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
	const to = req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
	const limit = Number(req.query.limit) || 0;
  console.log(from, to)
  exerciseModel
    .find({ userid: userId , date: {$gte: from, $lte: to }})
    .limit(limit)
    .then((userExercises) => {
      const count = userExercises.length;
      const username = userExercises[0].username;
      const userid = userExercises[0].userid;
      const logs = userExercises.map((exercise) => {
        return { description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString() }
      })
      res.json({
        username: username,
        count: count,
        _id: userid,
        log: logs
      })
    })
    .catch((err) => {
      console.error(err);
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
