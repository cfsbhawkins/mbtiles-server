var express = require("express"),
  app = express(),
  MBTiles = require('mbtiles'),
  p = require("path"),
  fs = require("fs"),
  compression = require("compression"),
  helmet = require('helmet');;
app.use(compression()); //Compress all routes
app.use(helmet());

var BreakPoint = {};

// path to the mbtiles; default is the server.js directory
var tilesDir = __dirname + '/tiles/';

// Set return header
function getContentType(t) {
  var header = {};

  // CORS
  header["Access-Control-Allow-Origin"] = "*";
  header["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept";

  // Cache
  header["Cache-Control"] = "public, max-age=3600";

  // request specific headers
  if (t === "png") {
    header["Content-Type"] = "image/png";
  }
  if (t === "jpg") {
    header["Content-Type"] = "image/jpeg";
  }
  if (t === "pbf") {
    header["Content-Type"] = "application/x-protobuf";
    header["Content-Encoding"] = "gzip";
  }

  return header;
}

// single tile system cannon
app.get('/:s/:z/:x/:y.:t', function (req, res) {
  new MBTiles(p.join(tilesDir, req.params.s + '.mbtiles'), function (err, mbtiles) {
    mbtiles.getTile(req.params.z, req.params.x, req.params.y, function (err, tile, headers) {
      if (err) {
        let header = {};
        header["Access-Control-Allow-Origin"] = "*";
        header["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept";
        header["Content-Type"] = "text/plain";
        res.set(header);
        res.status(404).send('Tile rendering error: ' + err + '\n');
      } else {
        res.set(getContentType(req.params.t));
        res.send(tile);
      }
    });
    if (err) console.log("error opening database");
  });
});

// all tiles
app.get('/all/:z/:x/:y.:t', function (req, res) {
  let files = findFilesInDir(tilesDir, '.mbtiles');
  let found = false;
  try {
    for (var i = 0; i < files.length; i++) {
      new MBTiles(files[i], function (err, mbtiles) {
        mbtiles.getTile(req.params.z, req.params.x, req.params.y, function (err, tile, headers) {
          if (!err) {
            res.set(getContentType(req.params.t));
            res.send(tile);
            found = true;
            throw new BreakPoint();
          }
        });
        if (err) console.log("error opening database");
      });
    }
  } catch (BreakPoint) {

  }

  if (!found) {
    let header = {};
    header["Access-Control-Allow-Origin"] = "*";
    header["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept";
    header["Content-Type"] = "text/plain";
    res.set(header);
    res.status(404).send('Tile rendering error: ' + err + '\n');
  }
});

function findFilesInDir(startPath, filter) {
  var results = [];
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = p.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filename, filter)); //recurse
    }
    else if (filename.indexOf(filter) >= 0) {
      results.push(filename);
    }
  }
  return results;
}

// start up the server
console.log('Starting Tile Server');
console.log('Listening on port: 80');
app.listen(80);
