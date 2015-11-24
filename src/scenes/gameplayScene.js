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

    self.clone = function(n)
    {
      self.x = n.x;
      self.y = n.y;
      self.w = n.w;
      self.h = n.h;

      self.row = n.row;
      self.col = n.col;

      self.cloneMutables(n);
    }
    self.cloneMutables = function(n)
    {
      self.type = n.type;
    }

    self.draw = function(canv)
    {
      switch(self.type)
      {
        case NODE_TYPE_NONE:
          break;
        case NODE_TYPE_BACT:
          canv.context.fillStyle = "#AA4499";
          canv.context.strokeStyle = "#ffffff";
          canv.context.fillRect(self.x,self.y,self.w,self.h);
          canv.context.strokeRect(self.x,self.y,self.w,self.h);
          break;
        case NODE_TYPE_ANTI:
          canv.context.fillStyle = "#222222";
          canv.context.strokeStyle = "#ffffff";
          canv.context.fillRect(self.x,self.y,self.w,self.h);
          canv.context.strokeRect(self.x,self.y,self.w,self.h);
          break;
        case NODE_TYPE_FOOD:
          canv.context.fillStyle = "#882222";
          canv.context.strokeStyle = "#ffffff";
          canv.context.fillRect(self.x,self.y,self.w,self.h);
          canv.context.strokeRect(self.x,self.y,self.w,self.h);
          break;
      }
    }

    self.tick = function()
    {

    }
  }

  var Grid = function()
  {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.w = stage.dispCanv.canvas.width;
    self.h = stage.dispCanv.canvas.height;

    self.rows = 25;
    self.cols = 50;
    //double buffer nodes. unfortunate indirection, but yields cleaner sim.
    self.nodes_a = [];
    self.nodes_b = [];
    self.node_buffs = [self.nodes_a,self.nodes_b];
    self.node_buff = 0;
    self.ifor = function(col,row) { col = (col+self.cols)%self.cols; row = (row+self.rows)%self.rows; return row*self.cols+col; };

    var n_a;
    var n_b;
    for(var i = 0; i < self.rows; i++)
    {
      for(var j = 0; j < self.cols; j++)
      {
        n_a = new Node();
        n_a.setPos(j,i,self.rows,self.cols,self);
        n_a.setType(NODE_TYPE_NONE);
        n_b = new Node();
        n_b.clone(n_a);
        self.nodes_a.push(n_a);
        self.nodes_b.push(n_b);
      }
    }

    self.nodeAt = function(col,row)
    {
      return self.node_buffs[self.node_buff][self.ifor(col,row)];
    }
    self.nodeAtCanv = function(x,y)
    {
      x = Math.floor(((x-self.x)/self.w)*self.cols);
      y = Math.floor(((y-self.y)/self.h)*self.rows);
      return self.nodeAt(x,y);
    }

    self.draw = function(canv)
    {
      canv.context.fillStyle = "#0000FF";
      if(self.hovering_node)
        canv.context.fillRect(self.hovering_node.x,self.hovering_node.y,self.hovering_node.w,self.hovering_node.h);
      canv.context.fillStyle = "#00FFFF";
      if(self.dragging_node)
        canv.context.fillRect(self.dragging_node.x,self.dragging_node.y,self.dragging_node.w,self.dragging_node.h);

      var nodes = self.node_buffs[self.node_buff];
      for(var i = 0; i < nodes.length; i++)
        nodes[i].draw(canv);
    }

    self.tick = function()
    {
      var old_nodes = self.node_buffs[self.node_buff];
      self.node_buff = (self.node_buff+1)%2;
      var new_nodes = self.node_buffs[self.node_buff];

      //clone buff
      for(var i = 0; i < new_nodes.length; i++)
        new_nodes[i].cloneMutables(old_nodes[i]);

      //update grid changes
      var i = 0;
      for(var r = 0; r < self.rows; r++)
      {
        for(var c = 0; c < self.cols; c++)
        {
          var i = self.ifor(c,r);
          switch(new_nodes[i].type)
          {
            case NODE_TYPE_NONE:
              if(
                Math.random() < 0.01 &&
                  (
                  old_nodes[self.ifor(c-1,r)].type == NODE_TYPE_BACT ||
                  old_nodes[self.ifor(c,r-1)].type == NODE_TYPE_BACT ||
                  old_nodes[self.ifor(c+1,r)].type == NODE_TYPE_BACT ||
                  old_nodes[self.ifor(c,r+1)].type == NODE_TYPE_BACT
                  )
                )
              {
                new_nodes[i].setType(NODE_TYPE_BACT);
              }
              break;
          }
        }
      }

      //tick nodes
      for(var i = 0; i < new_nodes.length; i++)
        new_nodes[i].tick();
    }

    self.hovering = false;
    self.hovering_node = undefined;
    self.hover = function(evt)
    {
      self.hovering = true;
      self.hovering_node = self.nodeAtCanv(evt.doX,evt.doY);
    }
    self.unhover = function(evt)
    {
      self.hovering = false;
      self.hovering_node = undefined;
    }
    self.dragging = false;
    self.dragStart = function(evt)
    {
      self.dragging = true;
      self.dragging_node = self.nodeAtCanv(evt.doX,evt.doY);
    }
    self.drag = function(evt)
    {
      self.dragging_node = self.nodeAtCanv(evt.doX,evt.doY);
    }
    self.dragFinish = function()
    {
      self.dragging = false;
      self.dragging_node = undefined;
    }
  }

  self.hoverer;
  self.dragger;

  self.grid;

  self.ready = function()
  {
    self.hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
    self.dragger = new Dragger({source:stage.dispCanv.canvas});

    self.grid = new Grid();
    self.grid.nodeAt(5,5).setType(NODE_TYPE_BACT);

    self.hoverer.register(self.grid);
    self.dragger.register(self.grid);
  };

  self.tick = function()
  {
    self.hoverer.flush();
    self.dragger.flush();

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

