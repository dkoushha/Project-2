require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.model");
const MongoStore = require("connect-mongo")(session);
const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);
const flash = require("connect-flash");
const app = express();
app.use(flash());

//mongoose
mongoose
  .connect("mongodb://localhost/meetingapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Error connecting to mongo", err);
  });

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());

// Express View engine setup
app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    sourceMap: true,
  })
);

// express-session configuration
app.use(
  session({
    secret: "abc",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    }, // 1 day
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      resave: true,
      saveUninitialized: false,
      ttl: 24 * 60 * 60, // 1 day
    }),
  })
);

// associate user with a session // store the user into the session
passport.serializeUser((user, callback) => {
  callback(null, user._id);
});

// this happens on every single request (if the user is logged in // if user._id exists in the session)
// it makes the current user available as req.user
passport.deserializeUser((id, callback) => {
  User.findById(id)
    .then((user) => {
      callback(null, user);
    })
    .catch((error) => {
      callback(error);
    });
});
// passport localStrategy
passport.use(
  new LocalStrategy({
      usernameField: "email",
    },
    (username, password, callback) => {
      User.findOne({
          username,
        })
        .then((user) => {
          if (!user) {
            return callback(null, false, {
              message: "Incorrect username",
            });
          }
          if (!bcrypt.compareSync(password, user.password)) {
            return callback(null, false, {
              message: "Incorrect password",
            });
          }
          callback(null, user);
        })
        .catch((error) => {
          callback(error);
        });
    }
  )
);

// basic passport setup
app.use(passport.initialize());
app.use(passport.session());

// static engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// default value for title local
app.locals.title = "Meeting scheduler app";

const index = require("./routes/index.routes");
app.use("/", index);

const auth = require("./routes/auth.routes");
app.use("/", auth);

module.exports = app;