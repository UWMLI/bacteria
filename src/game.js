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
  var popup_div = document.getElementById(init.popup);
  var scenes = [new NullScene(self, stage), new LoadingScene(self, stage), /*new TestScene(self, stage),*/ new GamePlayScene(self, stage, init.config, popup_div)];
  var currentScene = 0;

  self.begin = function()
  {
    self.nextScene();
    tick();
  };

  self.reset = function()
  {
    scenes[currentScene].reset();
  }

  var req_clear = true;
  var new_req_clear = true;
  var drawn = 0;
  var tick = function()
  {
    requestAnimFrame(tick,stage.dispCanv.canvas);
    if(req_clear || drawn < 100) stage.clear();
    new_req_clear = scenes[currentScene].tick();
    if(req_clear || drawn < 100)
    {
      scenes[currentScene].draw();
      stage.draw(); //blits from offscreen canvas to on screen one
      if(currentScene == 2) drawn++;
    }
    req_clear = new_req_clear;
  };

  self.nextScene = function()
  {
    scenes[currentScene].cleanup();
    currentScene++;
    scenes[currentScene].ready();
  };
};

