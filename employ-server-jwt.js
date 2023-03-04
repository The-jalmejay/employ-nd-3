let express = require("express");
let passport = require("passport");
let jwt = require("jsonwebtoken");
let JWTStrategy = require("passport-jwt").Strategy;
let ExtractJWT = require("passport-jwt").ExtractJwt;
const { employees } = require("./employData");

let app = express();
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH,DELETE,HEAD"
  );
  res.header("Access-Control-Expose-Headers", "X-Auth-Token");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept,Authorization"
  );
  next();
});
var port = process.env.PORT||2410;

const cookiesParser = require("cookie-parser");
app.use(cookiesParser("abcdef-347891"));
app.use(passport.initialize());
app.listen(port, () => console.log(`Node app listening on port jai~ ${port}!`));

const params = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: "jwtsecret23456789",
};
const jwtExpirySeconds = 300;

let strategyAll = new JWTStrategy(params, function (token, done) {
  console.log("IN JWTStrategy", token);
  let user1 = employees.find((e) => e.empCode === token.id);
  console.log("employe", user1);
  if (!user1) {
    return done(null, false, { message: "Incorrect username or password" });
  } else return done(null, user1);
});

passport.use(strategyAll);

app.post("/login", function (req, res) {
  console.log("In Login");
  let { empCode, name } = req.body;
  // console.log(req.body);
  let log = employees.find((e) => e.empCode === +empCode && e.name === name);
  // console.log("log",log);
  let it = {
    empCode: log.empCode,
    name: log.name,
  };
  console.log(it);
  if (!log) {
    res.sendStatus(401);
  } else {
    let payload = { id: log.empCode };
    let token = jwt.sign(payload, params.secretOrKey, {
      algorithm: "HS256",
      expiresIn: jwtExpirySeconds,
    });
    res.cookie("userdata", { user: name, track: [] }, { signed: true });
    // console.log("X-Auth-Token", token);
    res.setHeader("X-Auth-Token", token);
    res.send(payload);
  }
});
app.get("/logout", function (req, res) {
  res.clearCookie("userdata");
  res.send("Logout completed");
});
app.get(
  "/myDetails",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    let userdata = req.signedCookies.userdata;
    console.log("IN GET /myDetails", userdata);
    userdata={user:req.user.name,track:userdata.track};
    userdata.track.push({ url: "/myDetails", date: Date.now() });
    res.cookie("userdata", userdata, { signed: true });
    res.send(req.user);
  }
);
app.get("/company", function (req, res) {
  let userdata = req.signedCookies.userdata;
  if (!userdata) userdata = { user: "Guest", track: [] };
  userdata.track.push({ url: "/company", date: Date.now() });
  res.cookie("userdata", userdata, { signed: true });
  res.send(" Welcome to the Employee Portal of XYZ Company !");
});

app.get(
  "/myJuniors",
  passport.authenticate("jwt", { session: false }),
  function (req, res) {
    console.log("IN GET /myJuniors", req.user);
    let user = req.user;
    let userdata = req.signedCookies.userdata;
    console.log(userdata);
    userdata={user:req.user.name,track:userdata.track};
    if (!user) res.status(403).send("forbidden");
    else {
      let log = employees.find((e) => e.empCode === +user.empCode);
      let { designation, department } = log;
      let arr = employees.filter((e) => e.department === department);
      console.log(arr);
      if (designation === "VP" || designation === "Manager") {
        if (designation === "VP") {
          arr = arr.filter(
            (e) => e.designation === "Trainee" || designation === "Manager"
          );
        }
        if (designation === "Manager") {
          arr = arr.filter((e) => e.designation === "Trainee");
        }
        userdata.track.push({ url: "/myJuniors", date: Date.now() });
        res.cookie("userdata", userdata, { signed: true });
        res.send(arr);
      } else {
        userdata.track.push({ url: "/myJuniors", date: Date.now() });
        res.cookie("userdata", userdata, { signed: true });
        res.send("Your Trainer");
      }
    }
  }
);

app.get("/track", function (req, res) {
  let userdata = req.signedCookies.userdata;
  console.log(userdata);
  res.send(userdata);
});
