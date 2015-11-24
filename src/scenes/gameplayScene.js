var GamePlayScene = function(game, stage)
{
  var self = this;

  var ENUM;

  ENUM = 0;
  var NODE_TYPE_NONE = ENUM; ENUM++;
  var NODE_TYPE_BACT = ENUM; ENUM++;
  var NODE_TYPE_ANTI = ENUM; ENUM++;
  var NODE_TYPE_FOOD = ENUM; ENUM++;

  var Node = function()
  {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.w = 1;
    self.h = 1;

    self.row = 0;
    self.col = 0;

    self.type = 0;

    self.setPos = function(row,col,n_rows,n_cols,rect)
    {
      self.row = row;
      self.col = col;

      self.x = rect.x+row/n_cols*rect.w;
      self.y = rect.y+col/n_rows*rect.h;
      self.w = 1/n_cols*rect.w;
      self.h = 1/n_rows*rect.h;
    }

    self.setType= function(t)
    {
      self.type = t;
    }

    self.draw = function(canv)
    {
      canv.context.fillStyle = "#222222";
      canv.context.fillRect(self.x,self.y,self.w,self.h);
      canv.context.strokeStyle = "#ffffff";
      canv.context.strokeRect(self.x,self.y,self.w,self.h);
    }

    self.tick = function()
    {

    }
  }

  var Grid = function()
  {
    var self = this;

    self.rows = 25;
    self.cols = 50;
    self.nodes = [];
    var rect = {x:0,y:0,w:640,h:320};
    for(var i = 0; i < self.rows; i++)
    {
      for(var j = 0; j < self.cols; j++)
      {
        var n = new Node();
        n.setPos(j,i,self.rows,self.cols,rect);
        n.setType(NODE_TYPE_NONE);
        self.nodes.push(n);
      }
    }

    self.draw = function(canv)
    {
      for(var i = 0; i < self.nodes.length; i++)
        self.nodes[i].draw(canv);
    }

    self.tick = function()
    {
      for(var i = 0; i < self.nodes.length; i++)
        self.nodes[i].tick();
    }
  }

  self.grid;

  self.ready = function()
  {
    self.grid = new Grid();
  };

  self.tick = function()
  {
    self.grid.tick();
  };

  self.draw = function()
  {
    var canv = stage.drawCanv;
    self.grid.draw(canv);
  };

  self.cleanup = function()
  {
  };

};

