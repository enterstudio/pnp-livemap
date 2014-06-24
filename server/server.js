var express = require('express'),
    fs = require('fs'),
    unirest = require('unirest'),
    moment = require('moment'),
    compression = require('compression'),
    _ = require('underscore');


// ~-~-~- GEO DATA MANAGEMENT

var SPOT_TRACKER_URL = 'https://api.findmespot.com/spot-main-web/consumer/rest-api/2.0/public/feed/0R5IZZaVDCOSge61TftWo67z7cM0yldZd/message.json',
    REDUCTION_FACTOR = 2,
    DELAY_IN_DAYS = 0; // must be integer

var points = _.sortBy(JSON.parse(fs.readFileSync('points.json', 'utf-8')), 'ts'),
    delayedPoints,
    reducedAndDelayedPoints,
    idsSeen = points.reduce(function(memo, pt) {
      memo[pt.id] = true;
      return memo;
    }, {});

// Setup points and the spot tracker check
buildSupportingPointArrays();
checkSpotTracker();
setInterval(checkSpotTracker, 1000 * 60 * 10); // 10 minutes


function delayPoints(points) {
  return points.filter(function(pt) {
    var daysAgo = moment().subtract('days', DELAY_IN_DAYS);
    return moment.unix(pt.ts).isBefore(daysAgo);
  });
}

function reducePoints(points, n) {
  var offset = (points.length - 1) % n;

  return points.filter(function(__, i) {
    return i % n == offset;
  });
}

function buildSupportingPointArrays() {
  delayedPoints = delayPoints(points);
  reducedAndDelayedPoints = reducePoints(delayedPoints, REDUCTION_FACTOR);
}

function getSpotPointsRequest() {
  return unirest.get(SPOT_TRACKER_URL)
}

// Attempts to add new points to each of the supporting arrays, returning true
// if at least one points was added (not a duplicate).
function addNewPoints(pts) {
  var madeChange = false;

  pts.forEach(function(pt) {
    if (!idsSeen[pt.id]) {
      idsSeen[pt.id] = true;
      points.push(pt);
      madeChange = true;
    }
  });

  if (madeChange) {
    buildSupportingPointArrays();
  }

  return madeChange;
}

function writePoints() {
  console.log('Writing points');

  fs.writeFile('points.json', JSON.stringify(points), function(err) {
    if (err) {
      console.error(err);
      // TODO setTimeout to try another write?
    }
  });
}

function checkSpotTracker() {
  console.log('Checking spot tracker for new points');

  getSpotPointsRequest().end(function(res) {
    if (!res.ok) {
      console.warn('Recieved an error response from Spot Tracker API', res.status, res.body)
      return;
    }

    var spotResponse = res.body;
    var spotPoints = spotResponse.response.feedMessageResponse.messages.message; // wtf

    // Convert to our point structure
    var pnpPoints = spotPoints.map(function(spotPt) {
      return {
        id: spotPt.id,
        ts: spotPt.unixTime,
        lat: spotPt.latitude,
        lng: spotPt.longitude
      }
    });

    if (addNewPoints(pnpPoints)) {
      writePoints();
    } else {
      console.log('No new points');
    }
  });
}


// ~-~-~- SERVER

var app = express();
app.use(compression());

// CORS
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// Returns the 30 most recent points
app.get('/points/recent', function(req, res){
  res.send(_.last(reducedAndDelayedPoints, 30));
});

// Returns a reduced set of points (1 out of every n)
app.get('/points/reduced', function(req, res){
  res.send(reducedAndDelayedPoints);
});

app.get('/points', function(req, res) {
  res.send(points);
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
