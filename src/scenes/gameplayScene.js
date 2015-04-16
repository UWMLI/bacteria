var GamePlayScene = function(game, stage)
{
  var self = this;
  var assetter;
  var dbugger; //'debugger' is a keyword... (why.)
  var drawer;
  var ticker;
  var clicker;
  var hoverer;
  var dragger;
  var flicker;
  var presser;
  var particler;

  var NODE_TYPE_COUNT = 0;
  var NODE_TYPE_EMPTY    = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;
  var NODE_TYPE_BACTERIA = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;
  var NODE_TYPE_ANTIBIO  = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;
  var NODE_TYPE_FOOD     = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;
  var NODE_TYPE_INVALID  = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;

  var SWAB_MODE_COUNT = 0;
  var SWAB_MODE_ANTIBIO_PLACE  = SWAB_MODE_COUNT; SWAB_MODE_COUNT++;
  var SWAB_MODE_SUCK           = SWAB_MODE_COUNT; SWAB_MODE_COUNT++;
  var SWAB_MODE_BACTERIA_SPAWN = SWAB_MODE_COUNT; SWAB_MODE_COUNT++;
  var SWAB_MODE_FOOD_PLACE     = SWAB_MODE_COUNT; SWAB_MODE_COUNT++;

  var grid;
  var swab;

  var Node = function(grid)
  {
    var self = this;

    self.c;
    self.r;

    self.w;
    self.h;
    self.x;
    self.y;

    self.s_w;
    self.s_h;
    self.s_x;
    self.s_y;

    self.type;
    self.hp;
    self.resist;
    self.bred;

    self.init = function(col, row, type)
    {
      self.c = col;
      self.r = row;

      self.s_w = self.w = grid.node_w;
      self.s_h = self.h = grid.node_h;
      self.s_x = self.x = grid.x+self.c*self.w;
      self.s_y = self.y = grid.y+self.r*self.h;

      self.type = type;
      self.hp = 100;
      self.resist = Math.random();
      self.bred = false;
      self.mutate_ticks = 0;
      self.bounce = 0;
      self.bounce_vel = 0;
      self.bounce_damp_a = 0.7+Math.random()*0.2;
      self.bounce_damp_b = 0.8+Math.random()*0.15;
    }

    self.setBounce = function() { self.bounce = -self.w+(Math.random()*self.w/2); self.bounce_vel = 0; }
    self.unsetBounce = function() { self.bounce = 0; self.bounce_vel = 0; }

    self.tick = function()
    {
      if(self.hp == 0) self.type = NODE_TYPE_EMPTY;
      self.bounce += self.bounce_vel;
      self.bounce_vel -= self.bounce*(1-self.bounce_damp_b);
      self.bounce_vel *= self.bounce_damp_a;//0.9;
      switch(self.type)
      {
        case NODE_TYPE_BACTERIA:
          self.hp++; if(self.hp > 100) self.hp = 100;
          if(self.mutate_ticks > 0) self.mutate_ticks--;
          break;
        case NODE_TYPE_ANTIBIO:
        case NODE_TYPE_FOOD:
        case NODE_TYPE_EMPTY:
        case NODE_TYPE_INVALID:
        default:
          break;
      }
    }

    self.draw = function(canv)
    {
      switch(self.type)
      {
        case NODE_TYPE_BACTERIA:
          canv.context.fillStyle = "rgba("+(Math.round(1.16*self.hp))+","+(Math.round(0.55*self.hp))+","+(Math.round(1.04*self.hp))+",1)";
          canv.context.strokeStyle = "rgba("+Math.round((1-self.resist)*255)+","+Math.round((1-self.resist)*255)+","+Math.round((1-self.resist)*255)+",1)";
          break;
        case NODE_TYPE_ANTIBIO:
          canv.context.fillStyle = "rgba("+(Math.round(1.36*(100-self.hp)))+","+(Math.round(1.36*(100-self.hp)))+","+(Math.round(1.36*(100-self.hp)))+",1)";
          canv.context.strokeStyle = "rgba("+Math.round((1-self.resist)*255)+","+Math.round((1-self.resist)*255)+","+Math.round((1-self.resist)*255)+",1)";
          break;
        case NODE_TYPE_FOOD:
          canv.context.fillStyle = "#669911";
          canv.context.strokeStyle = "#669911";
          break;
        case NODE_TYPE_EMPTY:
        case NODE_TYPE_INVALID:
        default:
          return;
          break;
      }
      canv.context.lineWidth = 1;
      canv.context.fillRect(self.x-self.bounce/2,self.y-self.bounce/2,self.w+self.bounce,self.h+self.bounce);
      canv.context.strokeRect(self.x-self.bounce/2+0.5,self.y-self.bounce/2+0.5,self.w+self.bounce-1,self.h+self.bounce-1);
    }
  }

  var Grid = function(x,y,w,h,n_rows,n_cols)
  {
    var self = this;

    self.x = x;
    self.y = y;
    self.w = w;
    self.h = h;

    self.n_rows = n_rows;
    self.n_cols = n_cols;

    self.node_w = self.w/n_cols;
    self.node_h = self.h/n_rows;

    self.nodes = [];
    self.invalidNode = new Node(self); self.invalidNode.init(-1,-1,NODE_TYPE_INVALID);

    var r; var c; var i;
    for(r=0;r<self.n_rows;r++)for(c=0;c<self.n_cols;c++)
    {
        i = (r*self.n_cols)+c;
        self.nodes[i] = new Node(self);
        self.nodes[i].init(c,r,NODE_TYPE_EMPTY);
    }

    self.nodeAt = function(c,r) { return self.nodes[(r*self.n_cols)+c]; };
    self.validNodeAt = function(c,r)
    {
      if(c < 0 || c >= self.n_cols || r < 0 || r >= self.n_rows) return self.invalidNode;
      return self.nodeAt(c,r);
    };
    self.nearestType = function(c,r,t,max_d,unbred)
    {
      var nearest_node = self.invalidNode;
      var nearest_d = max_d+1;
      var min_c = Math.max(0,c-max_d);
      var max_c = Math.min(self.n_cols-1,c+max_d);
      var min_r = Math.max(0,r-max_d);
      var max_r = Math.min(self.n_rows-1,r+max_d);
      var tmp_c;
      var tmp_r;

      var tmp_node;
      var tmp_d;
      for(tmp_r = min_r; tmp_r <= max_r; tmp_r++)
      {
        for(tmp_c = min_c; tmp_c <= max_c; tmp_c++)
        {
          if((tmp_node = self.nodeAt(tmp_c, tmp_r)) && tmp_node.type == t && (!unbred || !tmp_node.bred) && //node exists / is correct type
             !(c == tmp_c && r == tmp_r)) //not center node
          {
            tmp_d = Math.abs(tmp_c-c)+Math.abs(tmp_r-r);
            if(tmp_d < nearest_d)
            {
              nearest_node = tmp_node;
              nearest_d = tmp_d;
            }
            else if(tmp_d == nearest_d)
            {
              if(Math.random() < 0.5) nearest_node = tmp_node; //BIASED!!!
            }
          }
        }
      }
      return nearest_node;
    };
    self.bacteriaNotes = function()
    {
      var notes = {};
      notes.strongest = 0;
      notes.weakest = 1;
      notes.average = 0;
      notes.count = 0;
      for(var i = 0; i < self.nodes.length; i++)
      {
        if(self.nodes[i].type == NODE_TYPE_BACTERIA)
        {
          if(self.nodes[i].resist > notes.strongest) notes.strongest = self.nodes[i].resist;
          if(self.nodes[i].resist < notes.weakest) notes.weakest = self.nodes[i].resist;
          notes.average += self.nodes[i].resist;
          notes.count++;
        }
      }
      if(notes.count == 0) notes.weakest = 0;
      else notes.average /= notes.count;
      return notes;
    }

    self.tick = function()
    {
      var r; var c; var i;

      //multiply
      {
        for(i = 0; i < self.n_rows*self.n_cols; i++)
          grid.nodes[i].bred = false;

        var nearest_bacteria;
        var nearest_food;
        var nearest_empty;
        var nearest_spawnable_node;
        for(r=0;r<self.n_rows;r++)for(c=0;c<self.n_cols;c++)
        {
          if(Math.random() >= 0.01) continue;//breed chance
          nearest_spawnable_node = grid.invalidNode;
          i = (r*self.n_cols)+c;
          if(self.nodes[i].type == NODE_TYPE_BACTERIA)
          {
            nearest_bacteria = self.nearestType(c,r,NODE_TYPE_BACTERIA,3,true);
            if(nearest_bacteria.type != NODE_TYPE_INVALID)
            {
              nearest_food = self.nearestType(c,r,NODE_TYPE_FOOD,3,false);
              if(nearest_food.type != NODE_TYPE_INVALID) nearest_spawnable_node = nearest_food;
              else if(Math.random() <= 0.1) //very small chance to spawn on empty if no food nearby
              {
                nearest_empty = self.nearestType(c,r,NODE_TYPE_EMPTY,3,false);
                if(nearest_empty.type != NODE_TYPE_INVALID)
                  nearest_spawnable_node = nearest_empty;
              }
              if(nearest_spawnable_node.type != NODE_TYPE_INVALID)
              {
                nearest_spawnable_node.type = NODE_TYPE_BACTERIA;
                nearest_spawnable_node.resist = (self.nodes[i].resist+nearest_bacteria.resist)/2;
                if(Math.random() < 0.01)
                {
                  nearest_spawnable_node.resist = Math.random();
                  nearest_spawnable_node.mutate_ticks = 100;
                }
                nearest_spawnable_node.hp = Math.round((self.nodes[i].hp+nearest_bacteria.hp)/2);
                nearest_spawnable_node.bred = true; //disallow breeding on first cycle
                nearest_spawnable_node.setBounce();
                self.nodes[i].bred = true;
                nearest_bacteria.bred = true;
              }
            }
          }
        }
      }

      //murder
      {
        for(r=0;r<self.n_rows;r++)for(c=0;c<self.n_cols;c++)
        {
          i = (r*self.n_cols)+c;
          if(self.nodes[i].type == NODE_TYPE_ANTIBIO)
          {
            nearest_bacteria = self.nearestType(c,r,NODE_TYPE_BACTERIA,1,false);
            if(nearest_bacteria.type == NODE_TYPE_BACTERIA)
            {
              if(nearest_bacteria.hp - Math.round(self.nodes[i].hp*self.nodes[i].resist*(1-nearest_bacteria.resist)) > 0)
              {
                nearest_bacteria.hp -= Math.round(self.nodes[i].hp*self.nodes[i].resist*(1-nearest_bacteria.resist));
                self.nodes[i].hp = 0;
              }
              else
              {
                self.nodes[i].hp = Math.round(nearest_bacteria.hp/(self.nodes[i].resist*(1-nearest_bacteria.resist)));
                nearest_bacteria.hp = 0;
              }
            }
          }
        }
      }

      for(var i = 0; i < self.n_rows*self.n_cols; i++)
        self.nodes[i].tick();
    }

    self.draw = function(canv)
    {
      for(var i = 0; i < self.n_rows*self.n_cols; i++)
        self.nodes[i].draw(canv);
      canv.context.strokeStyle = "#000000";
      canv.context.strokeRect(self.x-0.5,self.y-0.5,self.w+1,self.h+1);
    }

  }

  var Swab = function(grid)
  {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.w = stage.dispCanv.canvas.width;
    self.h = stage.dispCanv.canvas.height;

    self.hovering_c = -1;
    self.hovering_r = -1;

    self.mode = SWAB_MODE_ANTIBIO_PLACE;
    self.select_radius = 2;
    self.antibio_resist = 4.0;

    self.mode_switch_button = new (function(swab)
    {
      var self = this;

      self.w = 80;
      self.h = 80;
      self.x = swab.w-(self.w+20);
      self.y = 20;

      self.click = function(evt)
      {
        swab.mode = (swab.mode+1)%SWAB_MODE_COUNT;
      }

      self.draw = function(canv)
      {
        switch(swab.mode)
        {
          case SWAB_MODE_ANTIBIO_PLACE:
            canv.context.fillStyle = "#222222";
            canv.context.fillRect(self.x,self.y,self.w,self.h);
            break;
          case SWAB_MODE_SUCK:
            canv.context.fillStyle = "#AAAAAA";
            canv.context.fillRect(self.x,self.y,self.w,self.h);
            break;
          case SWAB_MODE_BACTERIA_SPAWN:
            canv.context.fillStyle = "#AA33AA";
            canv.context.fillRect(self.x,self.y,self.w,self.h);
            break;
          case SWAB_MODE_FOOD_PLACE:
            canv.context.fillStyle = "#AAAA33";
            canv.context.fillRect(self.x,self.y,self.w,self.h);
            break;
        }
      }
    })(self);
    var resistButton = function(x,y,w,h,r,swab)
    {
      var self = this;
      self.x = x;
      self.y = y;
      self.w = w;
      self.h = h;
      self.click = function(evt)
      {
        if(swab.mode == SWAB_MODE_ANTIBIO_PLACE)
          swab.antibio_resist = r;
      }
      self.draw = function(canv)
      {
        if(swab.mode == SWAB_MODE_ANTIBIO_PLACE)
        {
          canv.context.fillStyle = "rgba(0,0,0,1)";
          canv.context.fillRect(self.x,self.y,self.w,self.h);
          canv.context.strokeStyle = "rgba("+Math.round((1-r)*255)+","+Math.round((1-r)*255)+","+Math.round((1-r)*255)+",1)";
          canv.context.strokeRect(self.x+0.5,self.y+0.5,self.w-1,self.h-1);
        }
      }
    }
    self.resist_buttons = [];
    var n = 5;
    var w = self.mode_switch_button.w/n;
    for(var i = 0; i < n; i++)
      self.resist_buttons[i] = new resistButton(self.mode_switch_button.x+i*w,self.mode_switch_button.y+self.mode_switch_button.h+10,w,w,(i+1)/n,self);
    var radiusButton = function(x,y,w,h,d,swab)
    {
      var self = this;
      self.x = x;
      self.y = y;
      self.w = w;
      self.h = h;
      self.click = function(evt)
      {
        swab.select_radius += d;
      }
      self.draw = function(canv)
      {
        canv.context.strokeStyle = "#FF0000";
        canv.context.strokeRect(self.x+0.5,self.y+0.5,self.w-1,self.h-1);
      }
    }
    self.radius_buttons = [];
    var w = self.mode_switch_button.w/n;
    for(var i = 0; i < 2; i++)
      self.radius_buttons[i] = new radiusButton(self.mode_switch_button.x+i*w,self.mode_switch_button.y+self.mode_switch_button.h+self.resist_buttons[i].h+10,w,w,i-1+i,self);

    self.hover = function(evt)
    {
      self.hovering_c = Math.floor(grid.n_cols*((evt.doX-grid.x)/grid.w));
      self.hovering_r = Math.floor(grid.n_rows*((evt.doY-grid.y)/grid.h));
    }
    self.unhover = function(evt)
    {
      self.hovering_c = -self.select_radius;
      self.hovering_r = -self.select_radius;
    }
    self.dragStart = function(evt)
    {
      self.drag(evt);
    }
    self.drag = function(evt)
    {
      if(self.hovering_c < 0 || self.hovering_c >= grid.n_cols ||
         self.hovering_r < 0 || self.hovering_r >= grid.n_rows)
        return;

      var min_c = Math.max(0,self.hovering_c-self.select_radius);
      var max_c = Math.min(grid.n_cols-1,self.hovering_c+self.select_radius);
      var min_r = Math.max(0,self.hovering_r-self.select_radius);
      var max_r = Math.min(grid.n_rows-1,self.hovering_r+self.select_radius);

      switch(self.mode)
      {
        case SWAB_MODE_ANTIBIO_PLACE:
          for(var r = min_r; r <= max_r; r++)for(var c = min_c; c <= max_c; c++)
          {
            if(Math.abs(c-self.hovering_c)+Math.abs(r-self.hovering_r) < self.select_radius)
            {
              var n = grid.nodeAt(c,r);
              switch(n.type)
              {
                case NODE_TYPE_BACTERIA:
                  if(n.hp - Math.round(100*self.antibio_resist*(1-n.resist)) > 0)
                    n.hp -= Math.round(100*self.antibio_resist*(1-n.resist));
                  else
                  {
                    n.type = NODE_TYPE_ANTIBIO;
                    n.hp = Math.round(n.hp/(self.antibio_resist*(1-n.resist)));
                    n.resist = self.antibio_resist;
                  }
                  break;
                case NODE_TYPE_ANTIBIO:
                case NODE_TYPE_EMPTY:
                  n.type = NODE_TYPE_ANTIBIO;
                  n.hp = 100;
                  n.resist = self.antibio_resist;
                  n.unsetBounce();
                case NODE_TYPE_INVALID:
                case NODE_TYPE_FOOD:
                default:
                  break;
              }
            }
          }
          break;
        case SWAB_MODE_SUCK:
          for(var r = min_r; r <= max_r; r++)for(var c = min_c; c <= max_c; c++)
          {
            if(Math.abs(c-self.hovering_c)+Math.abs(r-self.hovering_r) < self.select_radius)
            {
              var n = grid.nodeAt(c,r);
              if(n.type == NODE_TYPE_ANTIBIO || n.type == NODE_TYPE_FOOD) n.hp = 0;
            }
          }
          break;
        case SWAB_MODE_BACTERIA_SPAWN:
          for(var r = min_r; r <= max_r; r++)for(var c = min_c; c <= max_c; c++)
          {
            if(Math.abs(c-self.hovering_c)+Math.abs(r-self.hovering_r) < self.select_radius)
            {
              var n = grid.nodeAt(c,r);
              if(n.type == NODE_TYPE_EMPTY)
              {
                n.type = NODE_TYPE_BACTERIA;
                n.hp = 100;
                n.resist = Math.random();
                n.setBounce();
              }
            }
          }
          break;
        case SWAB_MODE_FOOD_PLACE:
          for(var r = min_r; r <= max_r; r++)for(var c = min_c; c <= max_c; c++)
          {
            if(Math.abs(c-self.hovering_c)+Math.abs(r-self.hovering_r) < self.select_radius)
            {
              var n = grid.nodeAt(c,r);
              if(n.type == NODE_TYPE_EMPTY)
              {
                n.type = NODE_TYPE_FOOD;
                n.hp = 100;
                n.unsetBounce();
              }
            }
          }
          break;
        default:
          break;
      }
    }
    self.dragFinish = function(evt)
    {

    }
    self.draw = function(canv)
    {
      canv.context.strokeStyle = "#FF0000";
      var min_c = Math.max(0,self.hovering_c-self.select_radius);
      var max_c = Math.min(grid.n_cols-1,self.hovering_c+self.select_radius);
      var min_r = Math.max(0,self.hovering_r-self.select_radius);
      var max_r = Math.min(grid.n_rows-1,self.hovering_r+self.select_radius);

      for(var r=min_r;r<=max_r;r++)for(var c=min_c;c<=max_c;c++)
      {
        if(Math.abs(c-self.hovering_c)+Math.abs(r-self.hovering_r) < self.select_radius)
          canv.context.strokeRect(grid.x+c*grid.node_w+0.5,grid.y+r*grid.node_h+0.5,grid.node_w-1,grid.node_h-1);
      }

      self.mode_switch_button.draw(canv);
      for(var i = 0; i < self.resist_buttons.length; i++)
        self.resist_buttons[i].draw(canv);
      for(var i = 0; i < self.radius_buttons.length; i++)
        self.radius_buttons[i].draw(canv);
    }
  }

  self.ready = function()
  {
    hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});
    clicker = new Clicker({source:stage.dispCanv.canvas});

    grid = new Grid(20,20,stage.drawCanv.canvas.width-40-100,stage.drawCanv.canvas.height-40, 25, 50);
    swab = new Swab(grid);
    hoverer.register(swab);
    dragger.register(swab);
    clicker.register(swab.mode_switch_button);
    for(var i = 0; i < swab.resist_buttons.length; i++)
      clicker.register(swab.resist_buttons[i]);
    for(var i = 0; i < swab.radius_buttons.length; i++)
      clicker.register(swab.radius_buttons[i]);
  };

  var t = 0;
  self.tick = function()
  {
    grid.tick();
    hoverer.flush();
    dragger.flush();
    clicker.flush();
  };

  self.draw = function()
  {
    grid.draw(stage.drawCanv);
    swab.draw(stage.drawCanv);
    var notes = grid.bacteriaNotes();
    stage.drawCanv.context.fillStyle = "#000000";
    stage.drawCanv.context.fillText("Strongest: "+notes.strongest,stage.drawCanv.canvas.width-100,200);
    stage.drawCanv.context.fillText("Weakest: "+notes.weakest,stage.drawCanv.canvas.width-100,220);
    stage.drawCanv.context.fillText("Average: "+notes.average,stage.drawCanv.canvas.width-100,240);
    stage.drawCanv.context.fillText("Count: "+notes.count,stage.drawCanv.canvas.width-100,260);
  };

  self.cleanup = function()
  {
  };

};

