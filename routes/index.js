var botUrl = "https://api.telegram.org/bot120339832:AAH3w7QXuCTIT0PmYY2hl1Q6HdB2AEZTgQE";
var apiUrl = "http://192.169.216.160:3030/api";
var express = require('express');
var request = require('request');
var async = require('async');
var requestIp = require('request-ip');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var ip = requestIp.getClientIp(req);
  if(ip) ipTrace(ip);
  else unknownVisit();
  res.render('index');
});

router.get('/bot/hook', function(req, res, next) {
  request(botUrl+"/setWebhook?url=www.nikz.in/bot",
    function(err, resp, body){
      if (!err && resp.statusCode == 200) res.send(body);
    }
  );
});

router.get('/bot/unhook', function(req, res, next) {
  request(botUrl+"/setWebhook?url=",
    function(err, resp, body){
      if (!err && resp.statusCode == 200) res.send(body);
    }
  );
});


function ipTrace(ip){
  if(ip!="127.0.0.1"){
    request(apiUrl+"/visitor/find?ip="+ip, function(err, resp, body){
      if (!err && resp.statusCode == 200){
        var params = "count=0";
        var data = (JSON.parse(body))[0];
        //  Locate IP
        console.log(data);
        request("https://freegeoip.net/json/"+ip,function(err, resp, body){
          console.log("body:",body);
          var msg = "count: ";
          if(data){
             var count = parseInt(data.count);
             msg += (count+1) + "\n\r";
             console.log("msg:",msg);
             async.forEachOfSeries(JSON.parse(body), function(value,key,cb){
               msg += (key+": "+value+"\n\r");
               cb();
             },function(){
               request(apiUrl+"/visitor/update/"+data.id+"?count="+(count+1),
                 function(err, resp, body){
                   console.log(resp.statusCode,": IP count updated");
               });
               msg += "-------------------------";
               console.log(msg);
               sendMsg(msg,function(code){ console.log(code,": message send"); });
             });
          }else{
  console.log("working");
             msg += "0\n\r";
             async.forEachOfSeries(JSON.parse(body), function(value,key,cb){
               msg += (key+": "+value+"\n\r");
               cb();
             },function(){           
               request(apiUrl+"/visitor/create?count=0&ip="+ip,
                 function(err, resp, body){
                   console.log(resp.statusCode,": IP added");
               });
               msg += "-------------------------";
               console.log(msg);
               sendMsg(msg,function(code){ console.log(code,": message send"); });
             });
          }
        });
        //sendMsg(msg,function(code){ console.log(code); });   
      }
    });
  }
}

function unknownVisit(){
  console.log("Unknown thing visited");
}

function sendMsg(msg,cb){
  request(apiUrl+"/user",function(err, resp, body){
    var users = JSON.parse(body);
    if (!err && resp.statusCode == 200 && users.length>0){
      users.forEach(function(user){ 
        request(botUrl+"/sendMessage?chat_id="+user.uid+"&text="+encodeURIComponent(msg),
          function(err, resp, body){
            console.log(resp.statusCode);
            cb(resp.statusCode);
        });
      });
    }
  });
}

router.post('/bot', function(req, res, next){
  var msg = req.body.message;
  var command = (req.body.message.text).split(" ");
  if(command[0]=="/login"){
    if(command[1]=="passw0rd"){
      console.log("Successfully logged in");
      request(botUrl+"/sendMessage?chat_id="+msg.chat.id+"&text=Successfully%20logged%20in", 
        function(err, resp, body){
          if (!err && resp.statusCode == 200){
            console.log("Message send."+resp.statusCode); 
            request(apiUrl+"/user/find?uid="+msg.chat.id,
              function(err, resp, body){
                if (!err && resp.statusCode == 200){
                  var user = JSON.parse(body);
                  if(user.length<1){
                    request(apiUrl+"/user/create?uid="+msg.chat.id,
                      function(err, resp, body){
                        if (!err && resp.statusCode == 200){
                          console.log(body);
                        }
                      }
                    );
                  }
                }
              }
            );
          }
        }
      );
    }
  }else if(command[0]=="/logout"){
    request(apiUrl+"/user/find?uid="+msg.chat.id,
      function(err, resp, body){
        if (!err && resp.statusCode == 200){
          var user = JSON.parse(body);
          if(user.length>0){
            request(apiUrl+"/user/destroy/"+user[0].id,
              function(err, resp, body){
                if (!err && resp.statusCode == 200){
                  request(botUrl+"/sendMessage?chat_id="+msg.chat.id+"&text=Successfully%20logged%20out",
                    function(err, resp, body){
                      if (!err && resp.statusCode == 200){
                        console.log("Logged out");
                      }
                  });
                }
              }
            );
          }
        }
      }
    );
  }
  res.status(200).send("OK");
});


router.post('/contact',function(req, res, next){
  console.log(req.body.name, req.body.email, req.body.message);
  request(apiUrl+"/user",function(err, resp, body){
    var users = JSON.parse(body);
    if (!err && resp.statusCode == 200 && users.length>0){
      users.forEach(function(user){
        request(botUrl+"/sendMessage?chat_id="+user.uid+"&text="+req.body.name+"%20%3C"+req.body.email+"%3E%20%0AMessage%20%3A%20"+req.body.message,
          function(err, resp, body){
            if (!err && resp.statusCode == 200){
              res.json({send:true});
            }else {
              res.json({send:false});
            }
        });
      });
    }
  });
});


module.exports = router;
