
'use strict';

//mongoose file must be loaded before all other files in order to provide
// models to other modules
// install MongoDb https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-20-04

const express = require('express'),
  router = express.Router(),
  bodyParser = require('body-parser'),
  swaggerUi = require('swagger-ui-express'),
  swaggerDocument = require('./swagger.json');

const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/swagger-demo3');

const UserSchema = new Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {type: String},
  permission: {type: String}
});

mongoose.model('User', UserSchema);
const User = require('mongoose').model('User');

const app = express();

//rest API requirements
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

//middleware for create
const createUser = function (req, res, next) {
  var user = new User(req.body);

  user.save(function (err) {
    if (err) {
      next(err);
    } else {
      res.json(user);
    }
  });
};

const updateUser = function (req, res, next) {
  User.findByIdAndUpdate(req.body._id, req.body, {new: true}, function (err, user) {
    if (err) {
      next(err);
    } else {
      res.json(user);
    }
  });
};

const deleteUser = function (req, res, next) {
  req.user.remove(function (err) {
    if (err) {
      next(err);
    } else {
      res.json(req.user);
    }
  });
};

const getAllUsers = function (req, res, next) {
  User.find(function (err, users) {
    if (err) {
      next(err);
    } else {
      res.json(users);
    }
  });
};

const getOneUser = function (req, res) {
  res.json(req.user);
};

const getByIdUser = function (req, res, next, id) {
  User.findOne({_id: id}, function (err, user) {
    if (err) {
      next(err);
    } else {
      req.user = user;
      next();
    }
  });
};

router.route('/users')
  .post(createUser)
  .get(getAllUsers);

router.route('/users/:userId')
  .get(getOneUser)
  .put(updateUser)
  .delete(deleteUser);

// В основном функция router.param () запускает функцию обратного вызова всякий раз, когда пользователь направляется к параметру. 
// Эта функция обратного вызова будет вызываться только один раз в цикле ответа на запрос, 
// даже если пользователь обращается к параметру несколько раз.
router.param('userId', getByIdUser);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', router);

app.listen(3000);
module.exports = app;
