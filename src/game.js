var Game = function(init)
{
  var default_init =
  {
    width:640,
    height:320,
    container:"stage_container"
  }

  var self = this;
  doMapInitDefaults(init,init,default_init);

  var stage = new Stage({width:init.width,height:init.height,container:init.container});
  var scenes = [
    new NullScene(self, stage),
    new LoadingScene(self, stage),
    new ComicScene(self, stage),
    new ChooseScene(self, stage),
    new GamePlayScene(self, stage),
  ];
  var cur_scene = 0;
  var old_cur_scene = -1;

  self.begin = function()
  {
    self.nextScene();
    tick();
  };

  var tick = function()
  {
    requestAnimFrame(tick,stage.dispCanv.canvas);
    stage.clear();
    scenes[cur_scene].tick();
    if(old_cur_scene == cur_scene) //still in same scene- draw
    {
      scenes[cur_scene].draw();
      stage.draw(); //blits from offscreen canvas to on screen one
    }
    old_cur_scene = cur_scene;
  };

  self.nextScene = function()
  {
    self.setScene(cur_scene+1);
  };

  self.setScene = function(i)
  {
    if (cur_scene == 4 && i == 3) {
      self.logExit();
    } else if (i == 4) {
      var level;
      if (self.start == 0) level = 0;//"REPRODUCTION";
      else if (self.start == 1) level = 1;//"MUTATION";
      else if (self.start == 2) level = 2;//"RESISTANCE";
      scenes[4].lastTickTime = new Date().getTime();
      scenes[4].thisTickTime = new Date().getTime();
      scenes[4].log_level_begin(level, scenes[4].totalTime);
    }
    scenes[cur_scene].cleanup();
    cur_scene = i;
    scenes[cur_scene].ready();
  }

  self.logExit = function() {
    scenes[4].log_quit(scenes[4].totalTime, scenes[4].numBacteriaCreated, scenes[4].numDoses, scenes[4].topResistance);
  }
};

