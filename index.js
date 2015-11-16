var crypto = require('crypto');
var _ = require('underscore');
var request = require('request');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');
// var favicon = require("serve-favicon");

var API_BASE = '/api/v1/opinio/';
var method = 'POST';
var host = 'deliver.opinioapp.com';
var path = '/api/v1/orders';
var accessKey = '<insert opinio access key>';
var secretKey = '<insert opinio secret key>';

var app = express();
var httpServer = http.createServer(app);

app.set('case sensitive routing', true);
app.use(bodyParser.json({strict: false}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(API_BASE, function ie9NoCache(req, res, next) {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
  res.set("Pragma", "no-cache"); // HTTP 1.0.
  res.set("Expires", 0); // Proxies.
  next();
});
// app.use(favicon('favicon.ico'));
// app.use(conf.signedCookie);
app.use(compression());
app.use(express.static('vendor'));

app.get('/', function(req, res) {
    res.sendFile('index.html', {root: __dirname })
});

app.post(API_BASE + 'orders/', createOrder);
app.post(API_BASE + 'merchants/', createMerchant);
app.delete(API_BASE + 'orders/:id/', deleteOrder);

var port = 4000;
httpServer.listen(port, function () {
  console.log("Express http server listening on port " + port);
});

function sortAndEncode(params){
  var p = _.pairs(params);
  var psorted = _.sortBy(p, function(p) {
    return p[0];
  });
  var qstring = '';
  for (var i = 0; i < psorted.length; i++) {
    psorted[i][0] = encodeURIComponent(psorted[i][0]);
    psorted[i][1] = encodeURIComponent(psorted[i][1]);
    qstring += psorted[i][0] + '=' + psorted[i][1];
    if (i < psorted.length - 1) {
      qstring += '&';
    }
  };
  return qstring;
};

function genHash(qstring, method, path){
  var nl = '\n';
  var encode_request = method + nl + host + nl + path + nl + accessKey + nl + '&' + qstring + nl + '&SignatureVersion=1' + nl + '&SignatureMethod=HmacSHA1';
  var sig = crypto.createHmac("SHA1", secretKey)
    .update(encode_request)
    .digest('base64');
  return sig;
}

function createOrder(req, res, next){
  var params = req.body;
  console.log(params);
  method = 'POST';
  path = '/api/v1/orders';

  var qstring = sortAndEncode(params);
  var sig = genHash(qstring, method, path);
  var url = "http://" + host + path;

  var options = {
    url: url,
    headers: {
      'Authorization': 'Opinio ' + accessKey + ':' + sig
    },
    form: params
  };

  request.post(options, function(err, httpResponse){
    console.log(httpResponse.statusCode);
    console.log(httpResponse.body);
    return res.status(httpResponse.statusCode).send(JSON.parse(httpResponse.body));
  });
};

function deleteOrder(req, res, next){
  var id = req.params.id;
  var params = {
    'is_cancelled': 1
  };
  method = 'PUT';
  path = '/api/v1/orders/' + id;

  var qstring = sortAndEncode(params);
  var sig = genHash(qstring, method, path);
  var url = "http://" + host + path;
  var options = {
    url: url,
    headers: {
      'Authorization': 'Opinio ' + accessKey + ':' + sig
    },
    form: params
  };

  request.put(options, function(err, httpResponse){
    return res.status(httpResponse.statusCode).send(JSON.parse(httpResponse.body));
  });
};

function createMerchant(req, res, next){
  var params = req.body;
  method = 'POST';
  path = '/api/v1/merchants';

  var qstring = sortAndEncode(params);
  var sig = genHash(qstring, method, path);
  var url = "http://" + host + path;

  var options = {
    url: url,
    headers: {
      'Authorization': 'Opinio ' + accessKey + ':' + sig
    },
    form: params
  };

  request.post(options, function(err, httpResponse){
    return res.status(httpResponse.statusCode).send(httpResponse.body);
  });
}