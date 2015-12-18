var ENUM;

ENUM = 0;
var SPECIAL_NONE  = ENUM; ENUM++;
var SPECIAL_INTRO = ENUM; ENUM++;

ENUM = 0;
var NODE_TYPE_NONE = ENUM; ENUM++;
var NODE_TYPE_BADB = ENUM; ENUM++;
var NODE_TYPE_GOOD = ENUM; ENUM++;
var NODE_TYPE_BODY = ENUM; ENUM++;

ENUM = 0;
var CLICK_FUNC_NONE = ENUM; ENUM++;
var CLICK_FUNC_KILL = ENUM; ENUM++;
var CLICK_FUNC_DAMG = ENUM; ENUM++;
var CLICK_FUNC_BADB = ENUM; ENUM++;
var CLICK_FUNC_GOOD = ENUM; ENUM++;
var CLICK_FUNC_BODY = ENUM; ENUM++;

var DARK_COLOR = "#333333";

var GamePlayScene = function(game, stage, config, popup_div)
{
  var self = this;

  var default_config =
  {
    special:SPECIAL_NONE,
    grid_x:0,
    grid_y:0,
    grid_w:-1,
    grid_h:-1,
    grid_cols:50,
    grid_rows:25,
    colored:false,
    sim_speed:1,
    badb_sim_speed:1,
    hover_to_play:true,
    display_pause:true,
    allow_dose:true,
    allow_smile:true,
    allow_reset:true,
    prompt_reset_on_empty:false,
    allow_contaminate:true,
    default_badb_resist:0.1,
    init_badb:true,
    reinit_badb:true,
    default_good_resist:0.1,
    allow_good:true,
    init_good:true,
    reinit_good:true,
    allow_body:true,
    init_body:true,
    reinit_body:true,
    swab_size:1,
    click_function:CLICK_FUNC_NONE,
    hover_function:CLICK_FUNC_NONE,
    show_hover:false,
    mutate_random_assign:false,
    mutate_rate:0.1,
    mutate_distance:0.1,
    bias_mutate:true,
    reproduce:true,
    age:true,
    ave_display_width:0,
    split_display_width:0,
    tricolor_display_width:0,
  };

  if(!config) config = default_config;

  var Node = function()
  {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.w = 1;
    self.h = 1;

    self.row = 0;
    self.col = 0;

    self.parent_node = undefined;

    self.r = 0.5;
    self.g = 0.5;
    self.b = 0.5;

    self.type = 0;
    self.biot_resist = 0.1;
    self.body_resist = 0.1;
    self.age = 0;
    self.anim_prog = 0;

    self.health = 1;

    self.setPos = function(col,row,n_cols,n_rows,rect)
    {
      self.row = row;
      self.col = col;

      self.x = Math.floor(rect.x+col/n_cols*rect.w);
      self.y = Math.floor(rect.y+row/n_rows*rect.h);
      self.w = Math.ceil(1/n_cols*rect.w);
      self.h = Math.ceil(1/n_rows*rect.h);
    }

    self.setType = function(t)
    {
      self.type = t;
      self.age = 0;
      self.anim_prog = 1;
      if(t == NODE_TYPE_BADB) self.body_resist = 0.3;
      else if(t == NODE_TYPE_BODY) self.biot_resist = Math.random();
      self.health = 1;
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
      self.parent_node = n.parent_node;

      self.r = n.r;
      self.g = n.g;
      self.b = n.b;

      self.type = n.type;
      self.biot_resist = n.biot_resist;
      self.body_resist = n.body_resist;
      self.age = n.age;
      self.anim_prog = n.anim_prog;

      self.health = n.health;
    }

    self.draw = function(canv, stroke)
    {
      var x = self.x;
      var y = self.y;
      var w = self.w;
      var h = self.h;

      var resist_drawn = self.biot_resist;
      var r_drawn = self.r;
      var g_drawn = self.g;
      var b_drawn = self.b;

      if(self.type == NODE_TYPE_BADB || self.type == NODE_TYPE_GOOD)
      {
        if(self.anim_prog > 0)
        {
          var sub_prog = 0;
          if(!(self.parent_node && self.parent_node.type == self.type) && self.anim_prog > 0.8) self.anim_prog = 0.8;
          if(self.anim_prog > 0.8) //parent moving to multiply
          {
            sub_prog = (1-self.anim_prog)/0.2;
            sub_prog *= sub_prog;
            resist_drawn = self.parent_node.biot_resist;
            r_drawn = self.parent_node.r;
            g_drawn = self.parent_node.g;
            b_drawn = self.parent_node.b;
            if(self.parent_node.col < self.col) //multiply to the right
            {
              x = self.parent_node.x;
              w = self.w + (sub_prog*self.w);
            }
            else if(self.parent_node.col > self.col) //multiply to the left
            {
              x = self.parent_node.x - (sub_prog*self.w);
              w = self.w + (sub_prog*self.w);
            }
            else if(self.parent_node.row < self.row) //multiply to the bottom
            {
              y = self.parent_node.y;
              h = self.h + (sub_prog*self.h);
            }
            else if(self.parent_node.row > self.row) //multiply to the top
            {
              y = self.parent_node.y - (sub_prog*self.h);
              h = self.h + (sub_prog*self.h);
            }
          }
          else //bounce
          {
            sub_prog = (0.8-self.anim_prog)/0.8;

            var b = Math.sin(sub_prog*Math.PI*2*3)*(1-sub_prog)*self.w/5.;
            x -= b/2;
            y -= b/2;
            w += b;
            h += b;
          }
        }
      }

      canv.context.strokeStyle = DARK_COLOR;

      switch(self.type)
      {
        case NODE_TYPE_NONE:
          break;
        case NODE_TYPE_BADB:
          canv.context.fillStyle = "#AA4499";
          if(stroke)
          {
            canv.context.strokeRect(x,y,w,h);
          }
          else
          {
            if(config.colored)
            {
              canv.context.fillStyle = "rgba("+Math.floor(r_drawn*255)+","+Math.floor(g_drawn*255)+","+Math.floor(b_drawn*255)+",1)";
              canv.context.fillRect(x,y,w,h);
            }
            else
            {
              var r = Math.floor((1-resist_drawn)*128);
              canv.context.fillStyle = "rgba("+(128+r)+","+r+","+r+",1)";
              canv.context.fillRect(x,y,w,h);
            }
          }
          break;
        case NODE_TYPE_GOOD:
          canv.context.fillStyle = "#AAFF99";
          if(stroke)
          {
            canv.context.strokeRect(x,y,w,h);
          }
          else
          {
            if(config.colored)
            {
              canv.context.fillStyle = "rgba("+(r_drawn*255)+","+(g_drawn*255)+","+(b_drawn*255)+",1)";
              canv.context.fillRect(x,y,w,h);
            }
            else
            {
              var r = Math.floor((1-resist_drawn)*128);
              canv.context.fillStyle = "rgba("+r+","+(128+r)+","+r+",1)";
              canv.context.fillRect(x,y,w,h);
            }
          }
          break;
        case NODE_TYPE_BODY:
          canv.context.fillStyle = "#882222";
          if(stroke)
          {
            canv.context.strokeRect(x,y,w,h);
          }
          else
          {
            canv.context.fillRect(x,y,w,h);
          }
          break;
      }
    }

    self.tick = function()
    {
      if(self.anim_prog > 0) self.anim_prog -= 0.01;
      self.age += config.sim_speed;

      if(self.type == NODE_TYPE_BODY)
      {
        self.body_resist -= 0.001*config.sim_speed;
        if(self.body_resist < 0) self.body_resist = 0;
      }
    }
  }

  var Smiley = function(x,y,w,h)
  {
    var self = this;

    self.x = x;
    self.y = y;
    self.w = w;
    self.h = h;

    self.center_x = self.x+self.w/2;
    self.center_y = self.y+self.w/2;
    self.r = self.w/2;

    self.happiness = 0.5;

    self.draw = function(canv)
    {
      canv.context.beginPath();
      canv.context.arc(self.center_x,self.center_y,self.r,0,Math.PI*2,true);
      canv.context.stroke();

      var smile_r = 1/(self.happiness-0.5);
      if(!isFinite(smile_r)) smile_r = 999;
           if(smile_r > 0) smile_r += 5;
      else if(smile_r < 0) smile_r -= 5;
      var theta = Math.abs(Math.atan((self.w/4)/smile_r));

      canv.context.beginPath();
      if(smile_r > 0) canv.context.arc(self.center_x,self.center_y+self.h/6-smile_r,Math.abs(smile_r),Math.PI/2-theta,Math.PI/2+theta,false);
      else canv.context.arc(self.center_x,self.center_y+self.h/6-smile_r,Math.abs(smile_r),Math.PI*(3/2)-theta,Math.PI*(3/2)+theta,false);
      canv.context.stroke();

      canv.context.strokeRect(self.center_x-self.w/6-1,self.center_y-self.h/6,2,2);
      canv.context.strokeRect(self.center_x+self.w/6-1,self.center_y-self.h/6,2,2);
      /*

      // graph

      var w = canv.canvas.width;
      var h = canv.canvas.height;
      canv.context.beginPath();
      canv.context.moveTo(0,h/2);
      for(var i = 0; i < w; i++)
      {
        var eqnx = (-0.5+i/w)*10; //-5 to 5
        var eqny = Math.tan(eqnx);
        var eqny = 1/eqnx;
        if(isNaN(eqny)) eqny = 0;
        var x = i;
        var y = h/2-(eqny*10);
        canv.context.lineTo(x,y);
      }
      canv.context.stroke();

      canv.context.beginPath();
      canv.context.moveTo(0,h/2);
      canv.context.lineTo(w,h/2);
      canv.context.stroke();

      canv.context.beginPath();
      canv.context.moveTo(w/2,0);
      canv.context.lineTo(w/2,h);
      canv.context.stroke();

      */

    }
  }

  var AveDisplay = function(x,y,w,h,grid)
  {
    var self = this;

    self.x = x;
    self.y = y;
    self.w = w;
    self.h = h;

    self.gradient;

    self.draw = function(canv)
    {
      if(!self.gradient)
      {
        self.gradient = canv.context.createLinearGradient(0, self.y+self.h, 0, self.y);
        self.gradient.addColorStop(0, "#FF8888");
        self.gradient.addColorStop(1, "#880000");
      }

      canv.context.fillStyle = self.gradient;
      canv.context.fillRect(self.x,self.y,self.w,self.h);

      var y = (1-grid.ave_badb_biot_resist)*self.h+self.y;

      canv.context.fillStyle = "white";
      canv.context.strokeStyle = DARK_COLOR;
      canv.context.beginPath();
      canv.context.moveTo(self.x-2, y);
      canv.context.lineTo(self.x-8, y-4);
      canv.context.lineTo(self.x-8, y+4);
      canv.context.closePath();
      canv.context.stroke();
      canv.context.fill();
    }
  }

  var SplitDisplay = function(x,y,w,h,grid)
  {
    var self = this;

    self.x = x;
    self.y = y;
    self.w = w;
    self.h = h;

    self.draw = function(canv)
    {
      canv.context.fillStyle = self.gradient;

      var y = 0;
           if(grid.n_badb < 1) y = 0;
      else if(grid.n_good < 1) y = 1;
      else                     y = (grid.n_badb/(grid.n_badb+grid.n_good));

      y = y*self.h+self.y;

      canv.context.fillStyle = DARK_COLOR;
      canv.context.fillRect(self.x,self.y,self.w,y-self.y);
      canv.context.fillStyle = "green";
      canv.context.fillRect(self.x,y,self.w,self.h-(y-self.y));

      canv.context.fillStyle = "white";
      canv.context.strokeStyle = DARK_COLOR;
      canv.context.beginPath();
      canv.context.moveTo(self.x-2, y);
      canv.context.lineTo(self.x-8, y-4);
      canv.context.lineTo(self.x-8, y+4);
      canv.context.closePath();
      canv.context.stroke();
      canv.context.fill();
    }
  }

  var TricolorDisplay = function(x,y,w,h,grid)
  {
    var self = this;

    self.x = x;
    self.y = y;
    self.w = w;
    self.h = h;

    self.draw = function(canv)
    {
      canv.context.fillStyle = self.gradient;

      if(grid.n_r + grid.n_g + grid.n_b == 0)
      {
        canv.context.fillStyle = DARK_COLOR;
        canv.context.fillRect(self.x,self.y,self.w,self.h);
      }

      var nt = grid.n_r+grid.n_g+grid.n_b;
      var rh = (grid.n_r/nt)*self.h;
      var gh = (grid.n_g/nt)*self.h;
      var bh = (grid.n_b/nt)*self.h;

      canv.context.fillStyle = "red";
      canv.context.fillRect(self.x,self.y,self.w,rh);
      canv.context.fillStyle = "green";
      canv.context.fillRect(self.x,self.y+rh,self.w,gh);
      canv.context.fillStyle = "blue";
      canv.context.fillRect(self.x,self.y+rh+gh,self.w,bh);
    }
  }

  var Grid = function(x,y,w,h,cols,rows,scene)
  {
    var self = this;

    self.x = x;
    self.y = y;
    self.w = w;
    self.h = h;

    self.cols = cols;
    self.rows = rows;
    //double buffer nodes. unfortunate indirection, but yields cleaner sim.
    self.nodes_a = [];
    self.nodes_b = [];
    self.node_buffs = [self.nodes_a,self.nodes_b];
    self.node_buff = 0;

    self.n_badb = 0; self.ave_badb_biot_resist = 0;
    self.n_good = 0; self.ave_badb_biot_resist = 0;
    self.n_body = 0; self.ave_badb_biot_resist = 0;
    self.n_r = 0;
    self.n_g = 0;
    self.n_b = 0;

    self.ifor = function(col,row) { col = (col+self.cols)%self.cols; row = (row+self.rows)%self.rows; return row*self.cols+col; };

    var n_a;
    var n_b;
    for(var i = 0; i < self.rows; i++)
    {
      for(var j = 0; j < self.cols; j++)
      {
        n_a = new Node();
        n_a.setPos(j,i,self.cols,self.rows,self);
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

    self.clear = function()
    {
      var nodes = self.node_buffs[self.node_buff];
      for(var i = 0; i < nodes.length; i++)
        nodes[i].setType(NODE_TYPE_NONE);
    }

    self.dose = function(amt)
    {
      var nodes = self.node_buffs[self.node_buff];
      for(var i = 0; i < nodes.length; i++)
      {
        var n = nodes[i];
        if(amt > n.biot_resist)
          n.setType(NODE_TYPE_NONE);
      }
    }

    self.draw = function(canv)
    {
      var nodes = self.node_buffs[self.node_buff];
      canv.context.lineWidth = nodes[0].w/8;
      for(var i = 0; i < nodes.length; i++)
        nodes[i].draw(canv,true);
      canv.context.lineWidth = 2;
      for(var i = 0; i < nodes.length; i++)
        nodes[i].draw(canv,false);

      canv.context.strokeStyle = "#0000FF";
      if(config.show_hover && self.hovering_node && scene.prerequisite_met)
      {
        if(config.swab_size == 1)
        {
          canv.context.strokeRect(self.hovering_node.x,self.hovering_node.y,self.hovering_node.w,self.hovering_node.h);
        }
        else
        {
          canv.context.strokeRect(self.hovering_node.x-self.hovering_node.w,self.hovering_node.y,self.hovering_node.w*3,self.hovering_node.h);
          canv.context.strokeRect(self.hovering_node.x,self.hovering_node.y-self.hovering_node.h,self.hovering_node.w,self.hovering_node.h*3);
        }
      }
      canv.context.strokeStyle = "#00FFFF";
      //if(self.dragging_node) canv.context.strokeRect(self.dragging_node.x,self.dragging_node.y,self.dragging_node.w,self.dragging_node.h);
    }

    self.tick = function()
    {
      var old_nodes = self.node_buffs[self.node_buff];
      self.node_buff = (self.node_buff+1)%2;
      var new_nodes = self.node_buffs[self.node_buff];

      //clone buff
      for(var i = 0; i < new_nodes.length; i++)
      {
        new_nodes[i].cloneMutables(old_nodes[i]);
        new_nodes[i].tick();
      }

      //point to correct node in new buff
      if(self.hovering_node) self.hovering_node = self.nodeAt(self.hovering_node.col,self.hovering_node.row);
      if(self.dragging_node) self.dragging_node = self.nodeAt(self.dragging_node.col,self.dragging_node.row);

      if(self.hovering_node && scene.prerequisite_met)
      {
        var n;
        switch(config.hover_function)
        {
          case CLICK_FUNC_KILL:
            self.hovering_node.setType(NODE_TYPE_NONE);
            self.hovering_node.parent_node = undefined;
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row-1); n.setType(NODE_TYPE_NONE); n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row+1); n.setType(NODE_TYPE_NONE); n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col-1,self.hovering_node.row); n.setType(NODE_TYPE_NONE); n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col+1,self.hovering_node.row); n.setType(NODE_TYPE_NONE); n.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_DAMG:
            self.hovering_node.health -= 0.3;
            if(self.hovering_node.health <= 0)
            {
              self.hovering_node.setType(NODE_TYPE_NONE);
              self.hovering_node.parent_node = undefined;
            }
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row-1); n.health -= 0.2; if(n.health <= 0) { n.setType(NODE_TYPE_NONE); n.parent_node = undefined; }
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row+1); n.health -= 0.2; if(n.health <= 0) { n.setType(NODE_TYPE_NONE); n.parent_node = undefined; }
              n = self.nodeAt(self.hovering_node.col-1,self.hovering_node.row); n.health -= 0.2; if(n.health <= 0) { n.setType(NODE_TYPE_NONE); n.parent_node = undefined; }
              n = self.nodeAt(self.hovering_node.col+1,self.hovering_node.row); n.health -= 0.2; if(n.health <= 0) { n.setType(NODE_TYPE_NONE); n.parent_node = undefined; }
            }
            break;
          case CLICK_FUNC_BADB:
            self.hovering_node.setType(NODE_TYPE_BADB);
            self.hovering_node.biot_resist = config.default_badb_resist;
            self.hovering_node.parent_node = undefined;
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row-1); n.setType(NODE_TYPE_BADB); n.biot_resist = config.default_badb_resist; n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row+1); n.setType(NODE_TYPE_BADB); n.biot_resist = config.default_badb_resist; n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col-1,self.hovering_node.row); n.setType(NODE_TYPE_BADB); n.biot_resist = config.default_badb_resist; n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col+1,self.hovering_node.row); n.setType(NODE_TYPE_BADB); n.biot_resist = config.default_badb_resist; n.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_GOOD:
            self.hovering_node.setType(NODE_TYPE_GOOD);
            self.hovering_node.biot_resist = config.default_good_resist;
            self.hovering_node.parent_node = undefined;
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row-1); n.setType(NODE_TYPE_GOOD); n.biot_resist = config.default_good_resist; n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row+1); n.setType(NODE_TYPE_GOOD); n.biot_resist = config.default_good_resist; n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col-1,self.hovering_node.row); n.setType(NODE_TYPE_GOOD); n.biot_resist = config.default_good_resist; n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col+1,self.hovering_node.row); n.setType(NODE_TYPE_GOOD); n.biot_resist = config.default_good_resist; n.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_BODY:
            self.hovering_node.setType(NODE_TYPE_BODY);
            self.hovering_node.parent_node = undefined;
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row-1); n.setType(NODE_TYPE_BODY); n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col,self.hovering_node.row+1); n.setType(NODE_TYPE_BODY); n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col-1,self.hovering_node.row); n.setType(NODE_TYPE_BODY); n.parent_node = undefined;
              n = self.nodeAt(self.hovering_node.col+1,self.hovering_node.row); n.setType(NODE_TYPE_BODY); n.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_NONE:
          default:
            break;
        }
      }

      if(self.dragging_node && scene.prerequisite_met)
      {
        switch(config.click_function)
        {
          case CLICK_FUNC_KILL:
            self.dragging_node.setType(NODE_TYPE_NONE);
            self.dragging_node.parent_node = undefined;
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.dragging_node.col,self.dragging_node.row-1); n.setType(NODE_TYPE_NONE); n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col,self.dragging_node.row+1); n.setType(NODE_TYPE_NONE); n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col-1,self.dragging_node.row); n.setType(NODE_TYPE_NONE); n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col+1,self.dragging_node.row); n.setType(NODE_TYPE_NONE); n.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_DAMG:
            self.dragging_node.health -= 0.1;
            if(self.dragging_node.health <= 0)
            {
              self.dragging_node.setType(NODE_TYPE_NONE);
              self.dragging_node.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_BADB:
            self.dragging_node.setType(NODE_TYPE_BADB);
            self.dragging_node.biot_resist = config.default_badb_resist;
            self.dragging_node.parent_node = undefined;
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.dragging_node.col,self.dragging_node.row-1); n.setType(NODE_TYPE_BADB); n.biot_resist = config.default_badb_resist; n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col,self.dragging_node.row+1); n.setType(NODE_TYPE_BADB); n.biot_resist = config.default_badb_resist; n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col-1,self.dragging_node.row); n.setType(NODE_TYPE_BADB); n.biot_resist = config.default_badb_resist; n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col+1,self.dragging_node.row); n.setType(NODE_TYPE_BADB); n.biot_resist = config.default_badb_resist; n.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_GOOD:
            self.dragging_node.setType(NODE_TYPE_GOOD);
            self.dragging_node.biot_resist = config.default_good_resist;
            self.dragging_node.parent_node = undefined;
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.dragging_node.col,self.dragging_node.row-1); n.setType(NODE_TYPE_GOOD); n.biot_resist = config.default_good_resist; n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col,self.dragging_node.row+1); n.setType(NODE_TYPE_GOOD); n.biot_resist = config.default_good_resist; n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col-1,self.dragging_node.row); n.setType(NODE_TYPE_GOOD); n.biot_resist = config.default_good_resist; n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col+1,self.dragging_node.row); n.setType(NODE_TYPE_GOOD); n.biot_resist = config.default_good_resist; n.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_BODY:
            self.dragging_node.setType(NODE_TYPE_BODY);
            self.dragging_node.parent_node = undefined;
            if(config.swab_size > 1)
            {
              n = self.nodeAt(self.dragging_node.col,self.dragging_node.row-1); n.setType(NODE_TYPE_BODY); n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col,self.dragging_node.row+1); n.setType(NODE_TYPE_BODY); n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col-1,self.dragging_node.row); n.setType(NODE_TYPE_BODY); n.parent_node = undefined;
              n = self.nodeAt(self.dragging_node.col+1,self.dragging_node.row); n.setType(NODE_TYPE_BODY); n.parent_node = undefined;
            }
            break;
          case CLICK_FUNC_NONE:
          default:
            break;
        }
      }

      //update in-node grid changes
      for(var r = 0; r < self.rows; r++)
      {
        for(var c = 0; c < self.cols; c++)
        {
          var i = self.ifor(c,r);
          var on = old_nodes[i];
          var nn = new_nodes[i];
          switch(on.type)
          {
            case NODE_TYPE_BADB:
            case NODE_TYPE_GOOD:
              if(config.age && on.age > 500) nn.setType(NODE_TYPE_NONE);
              break;
            case NODE_TYPE_BODY:
              if(config.age && on.age > 2000) nn.setType(NODE_TYPE_NONE);
              break;
            case NODE_TYPE_NONE:
              if(!config.reproduce) break;

              var n_badb = 0;
              var n_good = 0;

              var token_badb = undefined;
              var token_good = undefined;
              var token_node = undefined;

              n = old_nodes[self.ifor(c-1,r)]; if(n.type == NODE_TYPE_BADB) { n_badb++; if(Math.random() < 1/n_badb) token_badb = n; } else if(n.type == NODE_TYPE_GOOD) { n_good++; if(Math.random() < 1/n_good) token_good = n; }
              n = old_nodes[self.ifor(c,r-1)]; if(n.type == NODE_TYPE_BADB) { n_badb++; if(Math.random() < 1/n_badb) token_badb = n; } else if(n.type == NODE_TYPE_GOOD) { n_good++; if(Math.random() < 1/n_good) token_good = n; }
              n = old_nodes[self.ifor(c+1,r)]; if(n.type == NODE_TYPE_BADB) { n_badb++; if(Math.random() < 1/n_badb) token_badb = n; } else if(n.type == NODE_TYPE_GOOD) { n_good++; if(Math.random() < 1/n_good) token_good = n; }
              n = old_nodes[self.ifor(c,r+1)]; if(n.type == NODE_TYPE_BADB) { n_badb++; if(Math.random() < 1/n_badb) token_badb = n; } else if(n.type == NODE_TYPE_GOOD) { n_good++; if(Math.random() < 1/n_good) token_good = n; }

              if(n_badb + n_good == 0) break;

              var chance = 0.01;
              var not_chance = 1-chance;
              var badb_spawn_chance = 0;
              var good_spawn_chance = 0;
              var should_spawn_badb = false;
              var should_spawn_good = false;
              if(n_badb > 0)
              {
                badb_spawn_chance = 1-Math.pow(not_chance,n_badb*config.sim_speed);
                should_spawn_badb = (Math.random() < badb_spawn_chance);
              }
              if(n_good > 0)
              {
                good_spawn_chance = 1-Math.pow(not_chance,n_good*config.sim_speed);
                should_spawn_good = (Math.random() < good_spawn_chance);
              }

              if(should_spawn_badb && !should_spawn_good) token_node = token_badb;
              if(should_spawn_good && !should_spawn_badb) token_node = token_good;
              if(should_spawn_good && should_spawn_badb)
              {
                if(Math.random() < 0.5) token_node = token_badb;
                else token_node = token_good;
              }

              if(token_node)
              {
                new_nodes[i].parent_node = token_node;
                new_nodes[i].setType(token_node.type);
                var biot_resist = token_node.biot_resist;
                var rc = token_node.r;
                var gc = token_node.g;
                var bc = token_node.b;
                var rand;
                if(config.mutate_rate)
                {
                  if(config.mutate_random_assign && Math.random() < config.mutate_rate)
                  {
                    rand = Math.random();
                    if(rand < config.mutate_random_assign)
                    {
                      biot_resist = Math.random();
                      if(config.colored)
                      {
                        rc = Math.random();
                        gc = Math.random();
                        bc = Math.random();
                      }
                    }
                  }
                  else if(config.mutate_distance)
                  {
                    if(config.colored)
                    {
                      rand = Math.random();
                           if(rand < config.mutate_rate*0.5)   rc -= Math.random()*config.mutate_distance;
                      else if(rand > 1-config.mutate_rate*0.5) rc += Math.random()*config.mutate_distance;
                      rand = Math.random();
                           if(rand < config.mutate_rate*0.5)   gc -= Math.random()*config.mutate_distance;
                      else if(rand > 1-config.mutate_rate*0.5) gc += Math.random()*config.mutate_distance;
                      rand = Math.random();
                           if(rand < config.mutate_rate*0.5)   bc -= Math.random()*config.mutate_distance;
                      else if(rand > 1-config.mutate_rate*0.5) bc += Math.random()*config.mutate_distance;
                    }
                    if(config.bias_mutate)
                    {
                      rand = Math.random();
                           if(rand < config.mutate_rate*0.4)   biot_resist -= Math.random()*config.mutate_distance;
                      else if(rand > 1-config.mutate_rate*0.6) biot_resist += Math.random()*config.mutate_distance;
                    }
                    else
                    {
                      rand = Math.random();
                           if(rand < config.mutate_rate*0.5)   biot_resist -= Math.random()*config.mutate_distance;
                      else if(rand > 1-config.mutate_rate*0.5) biot_resist += Math.random()*config.mutate_distance;
                    }
                  }
                }

                if(config.colored)
                {
                  if(rc < 0) rc = 0; else if(rc > 1) rc = 1;
                  if(gc < 0) gc = 0; else if(gc > 1) gc = 1;
                  if(bc < 0) bc = 0; else if(bc > 1) bc = 1;
                  new_nodes[i].r = rc;
                  new_nodes[i].g = gc;
                  new_nodes[i].b = bc;
                }
                if(biot_resist < 0) biot_resist = 0;
                else if(biot_resist > 1) biot_resist = 1;
                new_nodes[i].biot_resist = biot_resist;
                new_nodes[i].health = biot_resist;
              }

              break;
          }
        }
      }

      //update outer-node movements
      for(var r = 0; r < self.rows; r++)
      {
        for(var c = 0; c < self.cols; c++)
        {
          var i = self.ifor(c,r);
          var on = old_nodes[i];
          var nn = new_nodes[i];

          var reprod = 0;

          switch(on.type)
          {
            case NODE_TYPE_BADB:
            case NODE_TYPE_GOOD:
            case NODE_TYPE_BODY:
            case NODE_TYPE_NONE:
              break;
          }



          if(on.type == NODE_TYPE_BODY && !on.body_resist)
          {
            nn = new_nodes[self.ifor(c-1,r)]; if(nn.type == NODE_TYPE_BADB) { reprod = 1; nn.setType(NODE_TYPE_BODY); }
            nn = new_nodes[self.ifor(c,r-1)]; if(nn.type == NODE_TYPE_BADB) { reprod = 1; nn.setType(NODE_TYPE_BODY); }
            nn = new_nodes[self.ifor(c+1,r)]; if(nn.type == NODE_TYPE_BADB) { reprod = 1; nn.setType(NODE_TYPE_BODY); }
            nn = new_nodes[self.ifor(c,r+1)]; if(nn.type == NODE_TYPE_BADB) { reprod = 1; nn.setType(NODE_TYPE_BODY); }
            if(reprod) nn = new_nodes[i]; nn.setType(NODE_TYPE_NONE);
          }
        }
      }

      //tick nodes
      self.n_badb = 0; self.ave_badb_biot_resist = 0;
      self.n_good = 0; self.ave_badb_biot_resist = 0;
      self.n_body = 0; self.ave_badb_biot_resist = 0;
      self.n_r = 0;
      self.n_g = 0;
      self.n_b = 0;
      for(var i = 0; i < new_nodes.length; i++)
      {
        var n = new_nodes[i];
        n.tick();
             if(n.type == NODE_TYPE_BADB) { if(config.colored) { if(n.r > n.g && n.r > n.b) self.n_r++; else if(n.g > n.r && n.g > n.b) self.n_g++; else if(n.b > n.r && n.b > n.g) self.n_b++; } self.n_badb++; self.ave_badb_biot_resist += n.biot_resist; }
        else if(n.type == NODE_TYPE_GOOD) { if(config.colored) { if(n.r > n.g && n.r > n.b) self.n_r++; else if(n.g > n.r && n.g > n.b) self.n_g++; else if(n.b > n.r && n.b > n.g) self.n_b++; } self.n_good++; self.ave_good_biot_resist += n.biot_resist; }
        else if(n.type == NODE_TYPE_BODY) { self.n_body++; self.ave_body_biot_resist += n.biot_resist; }
      }
      if(self.n_badb > 0) self.ave_badb_biot_resist /= self.n_badb;
      if(self.n_good > 0) self.ave_good_biot_resist /= self.n_good;
      if(self.n_body > 0) self.ave_body_biot_resist /= self.n_body;
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
      self.drag(evt);
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

  self.presser;
  self.hoverer;
  self.dragger;

  self.grid;
  self.prerequisite_met;
  self.smiley;
  self.ave_disp;
  self.split_disp;

  self.dose_amt;
  self.dosing_prog;
  self.dosing_prog_rate;
  self.dose_slider;
  self.dose_button;

  self.just_paused;
  self.just_initializing;

  self.external_biot_resist;
  self.sneeze_button;
  self.catch_button;

  self.ready = function()
  {
    if(config.special == SPECIAL_NONE)
    {
      var c = stage.drawCanv;
      self.presser = new Presser({source:stage.dispCanv.canvas});
      self.hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
      self.dragger = new Dragger({source:stage.dispCanv.canvas});

      if(config.grid_w == -1) config.grid_w = c.canvas.width;
      if(config.grid_h == -1) config.grid_h = c.canvas.height;
      self.grid = new Grid(config.grid_x,config.grid_y,config.grid_w,config.grid_h,config.grid_cols,config.grid_rows, self);
      self.reset();
      self.hoverer.register(self.grid);
      self.dragger.register(self.grid);

      self.external_biot_resist = 0.1;
      if(config.allow_contaminate)
      {
        self.sneeze_button = new ButtonBox(c.canvas.width-30,10,20,20,function(){ self.external_biot_resist = self.grid.ave_badb_biot_resist; })
        self.presser.register(self.sneeze_button);
        self.catch_button = new ButtonBox(c.canvas.width-30,40,20,20,function(){
          self.grid.nodeAt(9,10).setType(NODE_TYPE_BADB);
          self.grid.nodeAt(9,10).biot_resist = self.external_biot_resist;
        })
        self.presser.register(self.catch_button);
      }

      if(config.allow_dose)
      {
        self.dose_button = new ButtonBox(10,c.canvas.height-30,20,20,function(){ if(self.prerequisite_met) self.dosing_prog = self.dosing_prog_rate; })
        self.presser.register(self.dose_button);

        self.dose_amt = 0.;
        self.dosing_prog = 0;
        self.dosing_prog_rate = 0.01;
        self.dose_slider = new SmoothSliderBox(40,c.canvas.height-30,100,20,0.0,1.0,0.0,function(v){ self.dose_amt = v; });
        self.dragger.register(self.dose_slider);
      }

      if(config.allow_smile)
      {
        self.smiley = new Smiley(40+100+10,c.canvas.height-30,20,20);
      }

      if(config.ave_display_width > 0)
      {
        self.ave_disp = new AveDisplay(c.canvas.width-config.ave_display_width,0,config.ave_display_width,c.canvas.height,self.grid);
      }

      if(config.split_display_width > 0)
      {
        self.split_disp = new SplitDisplay(c.canvas.width-config.split_display_width,0,config.split_display_width,c.canvas.height,self.grid);
      }

      if(config.tricolor_display_width > 0)
      {
        self.tricolor_disp = new TricolorDisplay(c.canvas.width-config.tricolor_display_width,0,config.tricolor_display_width,c.canvas.height,self.grid);
      }

      self.just_paused = 0;
      self.just_initializing = 0;
    }
  };

  self.reset = function()
  {
    if(config.allow_reset)
    {
      self.prerequisite_met = false;
      self.grid.clear();
      if(config.init_badb)
      {
        var n = self.grid.nodeAt(Math.floor(self.grid.cols/3),Math.floor(self.grid.rows/3));
        n.setType(NODE_TYPE_BADB);
        n.biot_resist = config.default_badb_resist;
        n.r = 0.5;
        n.g = 0.5;
        n.b = 0.5;
        n.parent_node = undefined;
        self.grid.n_badb = 1;
      }
      else self.grid.n_badb = 0;

      if(config.init_good)
      {
        var n = self.grid.nodeAt(Math.floor(self.grid.cols/3*2),Math.floor(self.grid.rows/3));
        n.setType(NODE_TYPE_GOOD);
        n.biot_resist = config.default_good_resist;
        n.r = 0.5;
        n.g = 0.5;
        n.b = 0.5;
        n.parent_node = undefined;
        self.grid.n_good = 1;
      }
      else self.grid.n_good = 0;

      if(config.allow_body && config.init_body)
      {
        var n = self.grid.nodeAt(Math.floor(self.grid.cols/2),Math.floor(self.grid.rows/3*2))
        n.setType(NODE_TYPE_BODY);
        n.r = 0.5;
        n.g = 0.5;
        n.b = 0.5;
        n.parent_node = undefined;
        self.grid.n_body = 1;
      }
      else self.grid.n_body = 0;
    }
  }

  self.tick = function()
  {
    if(config.special == SPECIAL_NONE)
    {
      var n_nodes = self.grid.n_badb + self.grid.n_good + self.grid.n_body ;
      if(config.prerequisite_fill_for_interaction == 0 || n_nodes == 0 || n_nodes >= config.prerequisite_fill_for_interaction*self.grid.rows*self.grid.cols)
        self.prerequisite_met = true;
      if(!self.prerequisite_met) self.just_initializing = 30;

      self.hoverer.flush();
      if(!config.hover_to_play || self.grid.hovering)
      {
        self.presser.flush();
        self.dragger.flush();

        if(config.allow_dose && self.dosing_prog)
        {
          self.grid.dose(self.dosing_prog);
          if(config.allow_smile)
          {
            self.smiley.happiness -= 0.01;
          }
          self.dosing_prog += self.dosing_prog_rate;
          if(self.dosing_prog > self.dose_amt)
            self.dosing_prog = 0;
        }
        if(config.allow_smile)
        {
          self.smiley.happiness += 0.001;

          if(self.smiley.happiness < 0) self.smiley.happiness = 0;
          if(self.smiley.happiness > 1) self.smiley.happiness = 1;
        }

        self.grid.tick();
        if(config.allow_dose)
        {
          self.dose_slider.tick();
        }
        if(config.reinit_badb && self.grid.n_badb == 0)
        {
          self.grid.nodeAt(Math.floor(self.grid.cols/3),Math.floor(self.grid.rows/3)).setType(NODE_TYPE_BADB);
          self.grid.nodeAt(Math.floor(self.grid.cols/3),Math.floor(self.grid.rows/3)).biot_resist = config.default_badb_resist;
        }
        if(config.reinit_good && self.grid.n_good == 0)
        {
          self.grid.nodeAt(Math.floor(self.grid.cols/3*2),Math.floor(self.grid.rows/3)).setType(NODE_TYPE_GOOD);
          self.grid.nodeAt(Math.floor(self.grid.cols/3*2),Math.floor(self.grid.rows/3)).biot_resist = config.default_good_resist;
        }
        if(config.allow_body && config.reinit_body && self.grid.n_body == 0)
        {
          self.grid.nodeAt(Math.floor(self.grid.cols/2),Math.floor(self.grid.rows/3*2)).setType(NODE_TYPE_BODY);
        }

        //if(self.grid.n_badb + self.grid.n_good + self.grid.n_body > self.grid.rows*self.grid.cols*0.6) popup_div.style.visibility = "visible";
      }
    }
  };

  self.draw = function()
  {
    if(config.special == SPECIAL_NONE)
    {
      var canv = stage.drawCanv;
      //canv.context.fillStyle = "#888888";
      //canv.context.fillRect(0,0,canv.canvas.width,canv.canvas.height);

      self.grid.draw(canv);

      if(config.allow_dose)
      {
        canv.context.strokeStyle = "#00FF00";
        self.dose_button.draw(canv);
        canv.context.strokeStyle = "#00FF00";
        self.dose_slider.draw(canv);

        //fill slider with color exterminating
        var r = Math.floor((1-self.dose_amt)*255);
        canv.context.fillStyle = "rgba("+r+","+r+","+r+",1)";
        var switch_x = self.dose_slider.slit_x+(((self.dose_slider.val-self.dose_slider.min_val)/(self.dose_slider.max_val-self.dose_slider.min_val))*self.dose_slider.slit_w);
        canv.context.fillRect(switch_x-(self.dose_slider.w/20)+0.5,self.dose_slider.y+0.5,(self.dose_slider.w/10),self.dose_slider.h);
      }
      if(config.allow_smile)
      {
        canv.context.strokeStyle = "#00FF00";
        self.smiley.draw(canv);
      }
      if(config.ave_display_width > 0)
      {
        self.ave_disp.draw(canv);
      }
      if(config.split_display_width > 0)
      {
        self.split_disp.draw(canv);
      }
      if(config.tricolor_display_width > 0)
      {
        self.tricolor_disp.draw(canv);
      }

      if(config.allow_contaminate)
      {
        self.sneeze_button.draw(canv);
        self.catch_button.draw(canv);
      }

      if(config.allow_dose && self.dosing_prog)
      {
        canv.context.strokeStyle = "#00FF00";
        canv.context.strokeRect(self.dose_slider.x+(self.dosing_prog*self.dose_slider.w),self.dose_slider.y,2,20);
      }

      if(config.hover_to_play && !self.grid.hovering && config.display_pause)
      {
        var w = canv.canvas.width;
        canv.context.fillStyle = "rgba(255,255,255,0.5)";
        canv.context.fillRect(0,0,w,canv.canvas.height);

        canv.context.fillStyle = "white";
        canv.context.strokeStyle = DARK_COLOR;
        canv.context.fillRect(w-28,10,8,20);
        canv.context.strokeRect(w-28,10,8,20);
        canv.context.fillRect(w-18,10,8,20);
        canv.context.strokeRect(w-18,10,8,20);
        self.just_paused = 30;
      }
      else
      {
        if(self.just_paused)
        {
          self.just_paused--;
          var w = canv.canvas.width;
          canv.context.fillStyle = "white";
          canv.context.strokeStyle = DARK_COLOR;
          canv.context.beginPath();
          canv.context.moveTo(w-10, 20);
          canv.context.lineTo(w-25, 30);
          canv.context.lineTo(w-25, 10);
          canv.context.closePath();
          canv.context.fill();
          canv.context.stroke();
        }
        if(self.prerequisite_met && self.just_initializing)
        {
          self.just_initializing--;
          canv.context.fillStyle = DARK_COLOR;
          canv.context.font = "12px Helvetica Neue";
          canv.context.fillText("kill enabled",Math.round(canv.canvas.width/2-100),Math.round(canv.canvas.height-50));
        }
        else if(config.prompt_prerequisite_unmet && !self.prerequisite_met)
        {
          canv.context.fillStyle = DARK_COLOR;
          canv.context.font = "12px Helvetica Neue";
          canv.context.fillText("Waiting for population to grow...",Math.round(canv.canvas.width/2-100),Math.round(canv.canvas.height-50));
        }
      }

      if(config.prompt_reset_on_empty && (self.grid.n_badb + self.grid.n_good + self.grid.n_body) == 0)
      {
        canv.context.fillStyle = DARK_COLOR;
        canv.context.font = "20px Helvetica Neue";
        canv.context.fillText("(click reset) "+String.fromCharCode(8595),Math.round(canv.canvas.width/2-60),Math.round(canv.canvas.height-50));
      }

      /*
      //for more visible debugging overlay
      canv.context.fillStyle = "#FFFFFF";
      canv.context.fillRect(0,0,canv.canvas.width,canv.canvas.height/2);
      */
    }
  };

  self.cleanup = function()
  {
  };

};

