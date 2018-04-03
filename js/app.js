// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// Default map id
var defaultMapID = "tesla";

var app = {
  start: Date.now(),
  autoprogress: false,

  togglePause: function() {
    app.paused = !app.paused;
    console.log(app.paused);
    if (app.paused)
      $(".toggle").html("unpause");
    else
      $(".toggle").html("pause");
  },

  // Time
  time: {
    start: Date.now() * .001,
    current: 0,
    elapsed: .1,
    frame: 0,
  },

  updateTime: function() {
    var temp = Date.now() * .001 - app.time.start;
    app.time.elapsed = temp - app.time.current;
    app.time.current = temp;
  },



  loadMapByID: function(id, edited) {
    console.info("Load map by id: '%s', edited: %s", id, edited);
    var raw = testMaps[id];

    if (edited) {
      var found = localStorage.getItem("map_" + id);

      if (found !== null) {
        raw = JSON.parse(found);
        console.info("Successfully loaded edited '%s'", id);
      }
    }

    $("#map-select").val(id);

    if (raw) {
      app.loadMap(raw, id);
      localStorage.setItem("lastMap", id);
    } else {
      console.error("Map '%s' not found", id);
    }
  },

  loadMap: function(raw, id) {
   console.info("Starting '%s'", id)
    if (!raw.settings)
      raw.settings = {
        id: id
      };

    $("#map-name").text(id);

    var loaded = mapCount++;

    // clear current
    chat.clear();

    app.rawMap = raw;
    app.map = parseMap(raw);
    app.map.name = id;

    editMap(app.rawMap, $("#edit-json"));

    // clear chat
    var diagramHolder = $("#panel-inspector .panel-content");
    diagramHolder.html("");
    createMapDiagram(app.map, diagramHolder);
    app.pointer = new Pointer();
    app.pointer.enterMap(app.map);
    //inspector.inspect(app.map);

    //console.log(app.pointer);

    viz.createMapViz(app.map);
    /*
        app.pointer.updateView();
        inspector.inspect(app.map);
    */

}

};
var mapCount = 0;
var updateSpeed = 20;

$(document).ready(function() {
  new Panel("chat", {
    x: 10,
    y: 10,
    w: 320,
    h: 480,
  });

  new Panel("controls", {
    x: 10,
    y: 510,
    w: 320,
    h: 250,
  });

  new Panel("editor", {
    x: 350,
    y: 10,
    w: 400,
    h: 480,
  });

  new Panel("blackboard", {
    x: 350,
    y: 510,
    w: 400,
    h: 230
  });
  
  new Panel("inspector", {
    x: 770,
    y: 10,
    w: 390,
    h: 650,
  });

  new Panel("viz", {
    x: 1180,
    y: 10,
    w: 320,
    h: 320,
  });
  
  new Panel("stateview", {
    x: 1180,
    y: 350,
    w: 200,
    h: 200,
  });
  
  io.init();
  chat.init();
  viz.init();

  // Get the startUpMapId before we load the controls so we can assign the 
  // dropdown properly
  var startUpMapId = localStorage.getItem("lastMap");
  if (startUpMapId === null) {
    startUpMapId = defaultMapID; 
  }

  controls.init(startUpMapId);

  function update() {
    if (!app.paused && !app.ioLocked) {
      app.pointer.update();
    }
    setTimeout(update, Math.pow(1 - app.updateSpeed, 2) * 450 + 100);
  }



  app.loadMapByID(startUpMapId, true);
  update();
});


function nextRound() {
  console.log("NextRound");
  app.pointer.perform("currentPlayer", "=", "(currentPlayer + 1)%playerCount");

  app.pointer.perform("round", "++");
  console.log("Round " + app.pointer.get("round") + " player: " + app.pointer.get("currentPlayer") + " " + app.pointer.get("players[currentPlayer].name"));

  app.pointer.perform("pointsAwarded", "+=", "ceil(random(0)*10)");
  app.pointer.perform("players[currentPlayer].score", "+=", "pointsAwarded");
  console.log(app.pointer.get("pointsAwarded") + " pts for " + app.pointer.get("players[currentPlayer].name"));

  app.pointer.blackboard.updateView();
}
