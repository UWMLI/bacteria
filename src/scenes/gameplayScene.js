var ENUM;

ENUM = 0;
var NODE_TYPE_NONE = ENUM; ENUM++;
var NODE_TYPE_BADB = ENUM; ENUM++;
var NODE_TYPE_GOOD = ENUM; ENUM++;
var NODE_TYPE_BODY = ENUM; ENUM++;

ENUM = 0;
var CLICK_FUNC_NONE = ENUM; ENUM++;
var CLICK_FUNC_KILL = ENUM; ENUM++;
var CLICK_FUNC_BADB = ENUM; ENUM++;
var CLICK_FUNC_GOOD = ENUM; ENUM++;
var CLICK_FUNC_BODY = ENUM; ENUM++;

var GamePlayScene = function(game, stage, config, popup_div)
{
  var self = this;

  var default_config =
  {
    grid_x:0,
    grid_y:0,
    grid_w:-1,
    grid_h:-1,
    grid_cols:50,
    grid_rows:25,
    sim_speed:1,
    badb_sim_speed:1,
    hover_to_play:true,
    display_pause:true,
    allow_dose:true,
    allow_smile:true,
    allow_reset:true,
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
    click_function:CLICK_FUNC_NONE,
    hover_function:CLICK_FUNC_NONE,
    mutate:true,
    bias_mutate:true,
    reproduce:true,
    age:true,
    ave_display_width:0,
    split_display_width:0,
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

    self.type = 0;
    self.biot_resist = 0.1;
    self.body_resist = 0.1;
    self.age = 0;
    self.bounce_prog = 0;

    self.setPos = function(row,col,n_rows,n_cols,rect)
    {
      self.row = row;
      self.col = col;

      self.x = Math.floor(rect.x+row/n_cols*rect.w);
      self.y = Math.floor(rect.y+col/n_rows*rect.h);
      self.w = Math.ceil(1/n_cols*rect.w);
      self.h = Math.ceil(1/n_rows*rect.h);
    }

    self.setType = function(t)
    {
      self.type = t;
      self.age = 0;
      self.bounce_prog = 1;
      if(t == NODE_TYPE_BADB) self.body_resist = 0.3;
      else if(t == NODE_TYPE_BODY) self.biot_resist = Math.random();
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
      self.biot_resist = n.biot_resist;
      self.body_resist = n.body_resist;
      self.age = n.age;
      self.bounce_prog = n.bounce_prog;
    }

    self.draw = function(canv)
    {
      var x = self.x;
      var y = self.y;
      var w = self.w;
      var h = self.h;

      if(self.bounce_prog > 0)
      {
        var b = Math.sin((1-self.bounce_prog)*Math.PI*2*3)*self.bounce_prog*3;
        x -= b/2;
        y -= b/2;
        w += b;
        h += b;
      }

      switch(self.type)
      {
        case NODE_TYPE_NONE:
          break;
        case NODE_TYPE_BADB:
          canv.context.fillStyle = "#AA4499";
          canv.context.strokeStyle = "#ffffff";
          var r = Math.floor(self.biot_resist*255);
          canv.context.fillStyle = "rgba("+r+","+r+","+r+",1)";
          canv.context.fillRect(x,y,w,h);
          //canv.context.strokeRect(x,y,w,h);
          break;
        case NODE_TYPE_GOOD:
          canv.context.fillStyle = "#AAFF99";
          canv.context.strokeStyle = "#ffffff";
          var r = Math.floor(self.biot_resist*(0.9*255));
          canv.context.fillStyle = "rgba("+r+","+Math.floor((0.1*255)+r)+","+r+",1)";
          canv.context.fillRect(x,y,w,h);
          //canv.context.strokeRect(x,y,w,h);
          break;
        case NODE_TYPE_BODY:
          canv.context.fillStyle = "#882222";
          canv.context.strokeStyle = "#ffffff";
          canv.context.fillRect(x,y,w,h);
          //canv.context.strokeRect(x,y,w,h);
          break;
      }
    }

    self.stroke = function(canv)
    {
      var x = self.x;
      var y = self.y;
      var w = self.w;
      var h = self.h;

      if(self.bounce_prog > 0)
      {
        var b = Math.sin((1-self.bounce_prog)*Math.PI*2*3)*self.bounce_prog*3;
        x -= b/2;
        y -= b/2;
        w += b;
        h += b;
      }

      switch(self.type)
      {
        case NODE_TYPE_NONE:
          break;
        case NODE_TYPE_BADB:
        case NODE_TYPE_GOOD:
        case NODE_TYPE_BODY:
          canv.context.strokeStyle = "#ffffff";
          canv.context.strokeRect(x,y,w,h);
          break;
      }
    }

    self.tick = function()
    {
      if(self.bounce_prog > 0) self.bounce_prog -= 0.01;
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
        self.gradient.addColorStop(0, "black");
        self.gradient.addColorStop(1, "white");
      }

      canv.context.fillStyle = self.gradient;
      canv.context.fillRect(self.x,self.y,self.w,self.h);

      var y = (1-grid.ave_badb_biot_resist)*self.h+self.y;

      canv.context.fillStyle = "white";
      canv.context.strokeStyle = "black";
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
      else                     y = (grid.n_badb/(grid.n_badb+grid.n_good))*self.h+self.y;

      canv.context.fillStyle = "black";
      canv.context.fillRect(self.x,self.y,self.w,y-self.y);
      canv.context.fillStyle = "green";
      canv.context.fillRect(self.x,y,self.w,self.h-(y-self.y));

      canv.context.fillStyle = "white";
      canv.context.strokeStyle = "black";
      canv.context.beginPath();
      canv.context.moveTo(self.x-2, y);
      canv.context.lineTo(self.x-8, y-4);
      canv.context.lineTo(self.x-8, y+4);
      canv.context.closePath();
      canv.context.stroke();
      canv.context.fill();
    }
  }

  var Grid = function(x,y,w,h,cols,rows)
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
      for(var i = 0; i < nodes.length; i++)
        nodes[i].stroke(canv);
      for(var i = 0; i < nodes.length; i++)
        nodes[i].draw(canv);

      canv.context.strokeStyle = "#0000FF";
      if(self.hovering_node) canv.context.strokeRect(self.hovering_node.x,self.hovering_node.y,self.hovering_node.w,self.hovering_node.h);
      canv.context.strokeStyle = "#00FFFF";
      if(self.dragging_node) canv.context.strokeRect(self.dragging_node.x,self.dragging_node.y,self.dragging_node.w,self.dragging_node.h);
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
              if(config.age && on.age > 500) nn.setType(NODE_TYPE_NONE);
              break;
            case NODE_TYPE_GOOD:
              if(config.age && on.age > 500) nn.setType(NODE_TYPE_NONE);
              break;
            case NODE_TYPE_BODY:
              if(config.age && on.age > 2000) nn.setType(NODE_TYPE_NONE);
              break;
            case NODE_TYPE_NONE:
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
              var should_repro = (config.reproduce && Math.random()/config.sim_speed < 0.02);
              break;
            case NODE_TYPE_GOOD:
              if(config.age && on.age > 500) nn.setType(NODE_TYPE_NONE);
              break;
            case NODE_TYPE_BODY:
              if(config.age && on.age > 2000) nn.setType(NODE_TYPE_NONE);
              break;
            case NODE_TYPE_NONE:
              break;
          }

              //yikes this is silly code...
              var should_repro = false;
              var only_bad_repro = false;
              should_repro = config.reproduce && Math.random()/config.sim_speed < 0.02;
              if(!should_repro && (config.badb_sim_speed-1 > 0))
              {
                should_repro = config.reproduce && Math.random()/(config.badb_sim_speed-1) < 0.02;
                only_bad_repro = true;
              }
              //done with silly code

              if(should_repro) //should gen
              {
                var n;
                var biot_resist = 0.;
                var r_neighb = Math.random();

                     if(r_neighb > 3/4) n = old_nodes[self.ifor(c-1,r)];
                else if(r_neighb > 2/4) n = old_nodes[self.ifor(c,r-1)];
                else if(r_neighb > 1/4) n = old_nodes[self.ifor(c+1,r)];
                else if(r_neighb > 0/4) n = old_nodes[self.ifor(c,r+1)];

                if(n)
                {
                  if(n.type == NODE_TYPE_BADB || (!only_bad_repro && n.type == NODE_TYPE_GOOD))//(n.type == NODE_TYPE_GOOD && Math.random() < 0.5)) //slightly lower chance for good bact repro
                  {
                    biot_resist = n.biot_resist;
                    new_nodes[i].setType(n.type);
                    if(config.mutate && Math.random() < 0.2) //should mutate
                    {
                      if(config.bias_mutate)
                      {
                        if(Math.random() < 0.6) biot_resist -= 0.1;
                        else biot_resist += 0.1;
                      }
                      else
                      {
                        if(Math.random() < 0.5) biot_resist -= 0.1;
                        else biot_resist += 0.1;
                      }
                      if(biot_resist < 0) biot_resist = 0;
                      if(biot_resist >= 1)
                      {
                        if(Math.random() < 0.2) biot_resist = 1; //should super mutate
                        else biot_resist = 0.9;
                      }
                    }
                    new_nodes[i].biot_resist = biot_resist;
                  }
                }
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
      for(var i = 0; i < new_nodes.length; i++)
      {
        new_nodes[i].tick();
             if(new_nodes[i].type == NODE_TYPE_BADB) { self.n_badb++; self.ave_badb_biot_resist += new_nodes[i].biot_resist; }
        else if(new_nodes[i].type == NODE_TYPE_GOOD) { self.n_good++; self.ave_good_biot_resist += new_nodes[i].biot_resist; }
        else if(new_nodes[i].type == NODE_TYPE_BODY) { self.n_body++; self.ave_body_biot_resist += new_nodes[i].biot_resist; }
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
      switch(config.hover_function)
      {
        case CLICK_FUNC_KILL:
          self.hovering_node.setType(NODE_TYPE_NONE);
          break;
        case CLICK_FUNC_BADB:
          self.hovering_node.setType(NODE_TYPE_BADB);
          self.hovering_node.biot_resist = config.default_badb_resist;
          break;
        case CLICK_FUNC_GOOD:
          self.hovering_node.setType(NODE_TYPE_GOOD);
          self.hovering_node.biot_resist = config.default_good_resist;
          break;
        case CLICK_FUNC_BODY:
          self.hovering_node.setType(NODE_TYPE_BODY);
          break;
        case CLICK_FUNC_NONE:
        default:
          break;
      }
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
      switch(config.click_function)
      {
        case CLICK_FUNC_KILL:
          self.dragging_node.setType(NODE_TYPE_NONE);
          break;
        case CLICK_FUNC_BADB:
          self.dragging_node.setType(NODE_TYPE_BADB);
          self.dragging_node.biot_resist = config.default_badb_resist;
          break;
        case CLICK_FUNC_GOOD:
          self.dragging_node.setType(NODE_TYPE_GOOD);
          self.dragging_node.biot_resist = config.default_good_resist;
          break;
        case CLICK_FUNC_BODY:
          self.dragging_node.setType(NODE_TYPE_BODY);
          break;
        case CLICK_FUNC_NONE:
        default:
          break;
      }
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
  self.smiley;
  self.ave_disp;
  self.split_disp;

  self.dose_amt;
  self.dosing_prog;
  self.dosing_prog_rate;
  self.dose_slider;
  self.dose_button;

  self.just_paused;

  self.external_biot_resist;
  self.sneeze_button;
  self.catch_button;

  self.reset_button;

  self.ready = function()
  {
    var c = stage.drawCanv;
    self.presser = new Presser({source:stage.dispCanv.canvas});
    self.hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
    self.dragger = new Dragger({source:stage.dispCanv.canvas});

    if(config.grid_w == -1) config.grid_w = c.canvas.width;
    if(config.grid_h == -1) config.grid_h = c.canvas.height;
    self.grid = new Grid(config.grid_x,config.grid_y,config.grid_w,config.grid_h,config.grid_cols,config.grid_rows);
    if(config.init_badb)
    {
      self.grid.nodeAt(9,10).setType(NODE_TYPE_BADB);
      self.grid.nodeAt(9,10).biot_resist = 0.1;
    }
    if(config.init_good)
    {
      self.grid.nodeAt(self.grid.cols-9,10).setType(NODE_TYPE_GOOD);
      self.grid.nodeAt(self.grid.cols-9,10).biot_resist = 0.1;
    }
    if(config.allow_body && config.init_body)
    {
      self.grid.nodeAt(Math.round(self.grid.cols/2),self.grid.rows-1-5).setType(NODE_TYPE_BODY);
    }
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
      self.dose_button = new ButtonBox(10,c.canvas.height-30,20,20,function(){ self.dosing_prog = self.dosing_prog_rate; })
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

    self.just_paused = 0;

    if(config.allow_reset)
    {
      self.reset_button = new ButtonBox(10,10,20,20,
      function()
      {
        self.grid.clear();
        if(config.init_badb)
        {
          self.grid.nodeAt(9,10).setType(NODE_TYPE_BADB);
          self.grid.nodeAt(9,10).biot_resist = 0.1;
        }
        if(config.init_good)
        {
          self.grid.nodeAt(self.grid.cols-9,10).setType(NODE_TYPE_GOOD);
          self.grid.nodeAt(self.grid.cols-9,10).biot_resist = 0.1;
        }
        if(config.allow_body && config.init_body)
        {
          self.grid.nodeAt(Math.round(self.grid.cols/2),self.grid.rows-1-5).setType(NODE_TYPE_BODY);
        }
      })
      self.presser.register(self.reset_button);
    }
  };

  self.tick = function()
  {
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
        self.grid.nodeAt(9,10).setType(NODE_TYPE_BADB);
        self.grid.nodeAt(9,10).biot_resist = config.default_badb_resist;
      }
      if(config.reinit_good && self.grid.n_good == 0)
      {
        self.grid.nodeAt(self.grid.cols-9,10).setType(NODE_TYPE_GOOD);
        self.grid.nodeAt(self.grid.cols-9,10).biot_resist = config.default_good_resist;
      }
      if(config.allow_body && config.reinit_body && self.grid.n_body == 0)
      {
        self.grid.nodeAt(Math.round(self.grid.cols/2),self.grid.rows-1-5).setType(NODE_TYPE_BODY);
      }

      if(self.grid.n_badb + self.grid.n_good + self.grid.n_body > self.grid.rows*self.grid.cols*0.6) popup_div.style.visibility = "visible";
    }
  };

  self.draw = function()
  {
    var canv = stage.drawCanv;
    canv.context.fillStyle = "#888833";
    canv.context.fillRect(0,0,canv.canvas.width,canv.canvas.height);

    self.grid.draw(canv);

    if(config.allow_dose)
    {
      canv.context.strokeStyle = "#00FF00";
      self.dose_button.draw(canv);
      canv.context.strokeStyle = "#00FF00";
      self.dose_slider.draw(canv);
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

    if(config.allow_reset)
    {
      self.reset_button.draw(canv);
    }

    if(config.hover_to_play && !self.grid.hovering && config.display_pause)
    {
      var w = canv.canvas.width;
      canv.context.fillStyle = "rgba(255,255,255,0.5)";
      canv.context.fillRect(0,0,w,canv.canvas.height);

      canv.context.fillStyle = "#333333";
      canv.context.strokeStyle = "white";
      canv.context.fillRect(w-28,10,8,20);
      canv.context.strokeRect(w-28,10,8,20);
      canv.context.fillRect(w-18,10,8,20);
      canv.context.strokeRect(w-18,10,8,20);
      self.just_paused = 30;
    }
    else if(self.just_paused)
    {
      self.just_paused--;
      var w = canv.canvas.width;
      canv.context.fillStyle = "#333333";
      canv.context.strokeStyle = "white";
      canv.context.beginPath();
      canv.context.moveTo(w-10, 20);
      canv.context.lineTo(w-25, 30);
      canv.context.lineTo(w-25, 10);
      canv.context.closePath();
      canv.context.fill();
      canv.context.stroke();
    }

    /*
    //for more visible debugging overlay
    canv.context.fillStyle = "#FFFFFF";
    canv.context.fillRect(0,0,canv.canvas.width,canv.canvas.height/2);
    */
  };

  self.cleanup = function()
  {
  };

};

