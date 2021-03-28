const express = require("express");
const app = express();
const fs = require('fs');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Static files
app.use(express.static("public"));

var library;

var tracks = [];

var presets = [];

var currentpreset = "1345768567";

fs.readFile('library.json', (err, data) => {
  if (err) throw err;
  library = JSON.parse(data);
});


fs.readFile('presets.json', (err, data) => {
  if (err) throw err;
  presets = JSON.parse(data);
});


function UpdatePreset(library) {

  fs.writeFile("presets.json", JSON.stringify(library, null, 4), (err) => {
    if (err) {  console.error(err);  return; };
    console.log("File has been created");
});

}


var background = "https://cdna.artstation.com/p/assets/images/images/020/186/524/large/miloe-cute-258-final-8-mb-pngg.jpg?1566760419";


io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  setInterval(() => io.emit('time', new Date().getTime()), 1000);

  socket.on('gettracks', (data) => { io.emit('sendtracks', tracks); });
  socket.on('getlibrary', (data) => { io.emit('sendlibrary', library); });
  socket.on('getpresets', (data) => { io.emit('sendpresets', presets); });
  socket.on('changepreset', (preset) => 
    { 
    currentpreset = preset;
    io.emit('feedpreset'); 
    });
  socket.on('getcurrentpreset', (data) => 
    { 
    var $index = presets.findIndex(x => x.id === currentpreset);
    var library = presets[$index].library;
    var $data = {"preset":currentpreset, "library":library};
    io.emit('feedcurrentpreset', $data); 
    });
  socket.on('getbackground', (data) => { io.emit('feedbackground', background); });
  // clock function
  socket.on("tick", (data) => { io.emit("tock"); });
  socket.on("volume", (data) => 
    { 
    var $index = presets.findIndex(x => x.id === data.preset);
    var $indexofitem = presets[$index].library.findIndex(x => x.id === data.name);
    presets[$index].library[$indexofitem].gain = data.gain;
    io.emit("changevolume", data);
    UpdatePreset(presets);
    });
  // add track to preset
  socket.on("updatepreset", (data) => 
    {  
    var $index = presets.findIndex(x => x.id === data.preset);
    presets[$index].library.push(data.track);
    UpdatePreset(presets);
    });
  // pan function
  socket.on("pan", (data) => 
    { 
    var $index = presets.findIndex(x => x.id === data.preset);
    var $indexofitem = presets[$index].library.findIndex(x => x.id === data.name);
    presets[$index].library[$indexofitem].pan = data.pan;
    io.emit("changepan", data); 
    UpdatePreset(presets);
    });
  // loop function
  socket.on("seedloop", (data) => 
    { 
    var $index = tracks.findIndex(x => x.id === data.name);
    tracks[$index].loop = data.loop;
    io.emit("feedloop", data); 
    });  
  // sync function
  socket.on("syncit", (data) => { io.emit("sync", data); });
  // add sound
  socket.on("seedsound", (data) => 
    { 
    $new = {'id':data.name, 'file':data.file, "gain":data.gain, 'pan':data.pan, 'loop':data.loop, "icon":data.icon };
    tracks.push($new);
    io.emit("newsound"); 
    });
    // add preset sound
    socket.on("seedpreset", (data) => 
    { 
    $new = {'id':data.name, 'file':data.file, "gain":data.gain, 'pan':data.pan, 'loop':data.loop, "icon":data.icon };
    tracks.push($new);
    console.log(tracks.length);
    
    });
    // wipe track list
    socket.on("wipetracklist", (data) => 
      { 
      console.log(tracks); 
      tracks = []; 
      console.log(tracks); 
      socket.emit("wipetracks");
      });
    // remove sound
    socket.on("removesound", (data) => 
    { 
    //var $index = tracks.findIndex(x => x.id === name);
    //tracks.splice($index, 1);
    var $index = presets.findIndex(x => x.id === data.preset);
    var $indexofitem = presets[$index].library.findIndex(x => x.id === data.name);
    presets[$index].library.splice($indexofitem, 1);
    UpdatePreset(presets);
    io.emit("soundscrubbed", data.name); 
    });
    // change background
    socket.on("seedbackground", (url) => 
      { 
      background = url;
      io.emit("feedbackground", url); 
      });




});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
