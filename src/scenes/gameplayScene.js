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

  var MUTATE_RATE = 0.1;

  var grid;
  var swab;

  var images = {};
  images.interface = new Image();
  images.interface.src = "assets/new/SB Interface.jpg";

  var blubs = [];
  var playing_blub = 0;
  var n_blubs = 20;
  for(var i = 0; i < n_blubs; i++)
  {
    blubs[i] = new Audio("assets/blub_"+(i%3)+".ogg");
    blubs[i].controls = false;
    blubs[i].loop = false;
    blubs[i].load();
  }
  var play_blub = function()
  {
    blubs[playing_blub].play();
    playing_blub = (playing_blub+1)%n_blubs;
  }

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
      self.bounce = 0;
      self.bounce_vel = 0;
      self.bounce_damp_a = 0.7+Math.random()*0.2;
      self.bounce_damp_b = 0.8+Math.random()*0.15;
      self.food_col = "rgba("+(Math.round(Math.random()*20-10)+102)+","+(Math.round(Math.random()*20-10)+153)+","+(Math.round(Math.random()*20-10)+17)+",1)";
    }

    self.setBounce = function() { self.bounce = -self.w+(Math.random()*self.w/2); self.bounce_vel = 0; }
    self.unsetBounce = function() { self.bounce = 0; self.bounce_vel = 0; }

    self.tick = function()
    {
      if(self.hp == 0) self.type = NODE_TYPE_EMPTY;
      switch(self.type)
      {
        case NODE_TYPE_BACTERIA:
          self.bounce += self.bounce_vel;
          self.bounce_vel -= self.bounce*(1-self.bounce_damp_b);
          self.bounce_vel *= self.bounce_damp_a;//0.9;
          self.hp++; if(self.hp > 100) self.hp = 100;
          break;
        case NODE_TYPE_FOOD:
          self.bounce = self.bounce*0.9;
          break;
        case NODE_TYPE_ANTIBIO:
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
          canv.context.fillStyle = self.food_col;
          canv.context.strokeStyle = self.food_col;
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

  var MutantParticle = function(x,y,w,h)
  {
    var self = this;
    self.x = x;
    self.y = y;
    self.w = w;
    self.h = h;

    self.life = 100;
    self.tick = function()
    {
      self.life--;
      return self.life > 0;
    }
    self.draw = function(canv)
    {
      canv.context.strokeStyle = "#00FF00";
      var l = self.life - 50;
      var off = (l/100)*(l/100)*(l/100)*self.life/2;
      canv.context.strokeRect(self.x-off,self.y-off,self.w+(2*off),self.h+(2*off));
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
              nearest_bacteria = self.nearestType(c,r,NODE_TYPE_BACTERIA,3,true);
              if(nearest_bacteria.type != NODE_TYPE_INVALID)
              {
                nearest_spawnable_node.resist = (self.nodes[i].resist+nearest_bacteria.resist)/2;
                nearest_spawnable_node.hp = Math.round((self.nodes[i].hp+nearest_bacteria.hp)/2);
                nearest_bacteria.bred = true;

                nearest_spawnable_node.type = NODE_TYPE_BACTERIA;
                play_blub();
                nearest_spawnable_node.bred = true; //disallow breeding on first cycle
                nearest_spawnable_node.setBounce();
                self.nodes[i].bred = true;
                if(Math.random() < MUTATE_RATE)
                {
                  nearest_spawnable_node.resist = nearest_spawnable_node.resist+((Math.random()*0.25)-0.12);
                  if(nearest_spawnable_node.resist > 1) nearest_spawnable_node.resist = 0.999;
                  if(nearest_spawnable_node.resist < 0) nearest_spawnable_node.resist = 0.001;
                  particler.register(new MutantParticle(nearest_spawnable_node.x,nearest_spawnable_node.y,nearest_spawnable_node.w,nearest_spawnable_node.h));
                }
              }
              else if(Math.random() < 0.1) //small chance to spawn asexually
              {
                nearest_spawnable_node.resist = self.nodes[i].resist;
                nearest_spawnable_node.hp = self.nodes[i].hp;

                nearest_spawnable_node.type = NODE_TYPE_BACTERIA;
                play_blub();
                nearest_spawnable_node.bred = true; //disallow breeding on first cycle
                nearest_spawnable_node.setBounce();
                self.nodes[i].bred = true;
                if(Math.random() < MUTATE_RATE)
                {
                  nearest_spawnable_node.resist = nearest_spawnable_node.resist+((Math.random()*0.25)-0.12);
                  if(nearest_spawnable_node.resist > 1) nearest_spawnable_node.resist = 0.999;
                  if(nearest_spawnable_node.resist < 0) nearest_spawnable_node.resist = 0.001;
                  particler.register(new MutantParticle(nearest_spawnable_node.x,nearest_spawnable_node.y,nearest_spawnable_node.w,nearest_spawnable_node.h));
                }
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
    var resistances = [0.03, 0.07, 0.3, 0.9, 10];
    self.antibio_resist = resistances[0];

    var modeButton = function(x,y,w,h,mode,antibio_resist,swab)
    {
      var self = this;
      self.x = x;
      self.y = y;
      self.w = w;
      self.h = h;
      self.img = new Image();
      if (mode == SWAB_MODE_ANTIBIO_PLACE) {
        switch (antibio_resist) {
          case resistances[0]:
            self.img.src = "assets/new/SB Anit Weakest.png";
            break;
          case resistances[1]:
            self.img.src = "assets/new/SB Anit Weak.png";
            break;
          case resistances[2]:
            self.img.src = "assets/new/SB Anit Medium.png";
            break
          case resistances[3]:
            self.img.src = "assets/new/SB Anit Strong.png";
            break;
          case resistances[4]:
            self.img.src = "assets/new/SB Anit Strongest.png";
            break;
        }
      }
      else if (mode == SWAB_MODE_BACTERIA_SPAWN) {
        self.img.src = "assets/new/SB Weakest Bug 30x30.png"
      }
      else if (mode == SWAB_MODE_FOOD_PLACE) {
        self.img.src = "assets/new/SB Food 30x30.png"
      }
      self.click = function(evt)
      {
        swab.mode           = mode;
        swab.antibio_resist = antibio_resist;
      }
      self.draw = function(canv)
      {
        if (swab.mode != mode || (swab.mode == SWAB_MODE_ANTIBIO_PLACE && swab.antibio_resist != antibio_resist)) {
          canv.context.globalAlpha = 0.5;
        }
        canv.context.drawImage(self.img, self.x, self.y, self.w, self.h);
        canv.context.globalAlpha = 1;
      }
    }
    self.mode_buttons = [];
    for (var i = 0; i < resistances.length; i++) {
      self.mode_buttons.push(new modeButton(781 + i * 35, 163, 24, 24, SWAB_MODE_ANTIBIO_PLACE, resistances[i], self));
    }
    self.mode_buttons.push(new modeButton(798, 308, 30, 30, SWAB_MODE_BACTERIA_SPAWN, 0, self));
    self.mode_buttons.push(new modeButton(895, 308, 30, 30, SWAB_MODE_FOOD_PLACE, 0, self));
    var radiusButton = function(x,y,w,h,d,swab)
    {
      var self = this;
      self.x = x;
      self.y = y;
      self.w = w;
      self.h = h;
      self.img = new Image();
      self.img.src = "assets/new/SB Swab "+d+".png"
      self.click = function(evt)
      {
        swab.select_radius = d;
      }
      self.draw = function(canv)
      {
        if (swab.select_radius != d) {
          canv.context.globalAlpha = 0.5;
        }
        canv.context.drawImage(self.img, self.x, self.y, self.w, self.h);
        canv.context.globalAlpha = 1;
      }
    }
    self.radius_buttons = [];
    self.radius_buttons.push(new radiusButton(779, 453, 7 , 7 , 1, self));
    self.radius_buttons.push(new radiusButton(805, 445, 23, 23, 2, self));
    self.radius_buttons.push(new radiusButton(840, 437, 39, 39, 3, self));
    self.radius_buttons.push(new radiusButton(891, 429, 55, 55, 4, self));

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
              if(n.type == NODE_TYPE_EMPTY || n.type == NODE_TYPE_FOOD)
              {
                n.type = NODE_TYPE_BACTERIA;
                n.hp = 100;
                n.resist = Math.random()*0.75;
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
                n.setBounce();
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

      canv.context.fillStyle = "#000000";
      canv.context.font = "18px Arial Black";
      canv.context.fillText("ANTIBIOTIC", 805, 148);
      canv.context.font = "12px Arial Black";
      canv.context.fillText("WEAK", 778, 211);
      canv.context.fillText("STRONG", 890, 211);
      canv.context.font = "16px Arial Black";
      canv.context.fillText("GERM", 786, 295);
      canv.context.fillText("FOOD", 885, 295);
      canv.context.font = "16px Arial Black";
      canv.context.fillText("SWAB SIZE", 808, 417);

      for(var r=min_r;r<=max_r;r++)for(var c=min_c;c<=max_c;c++)
      {
        if(Math.abs(c-self.hovering_c)+Math.abs(r-self.hovering_r) < self.select_radius)
          canv.context.strokeRect(grid.x+c*grid.node_w+0.5,grid.y+r*grid.node_h+0.5,grid.node_w-1,grid.node_h-1);
      }

      for(var i = 0; i < self.mode_buttons.length; i++)
        self.mode_buttons[i].draw(canv);
      for(var i = 0; i < self.radius_buttons.length; i++)
        self.radius_buttons[i].draw(canv);
    }
  }

  self.ready = function()
  {
    hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});
    clicker = new Clicker({source:stage.dispCanv.canvas});
    particler = new Particler({});

    grid = new Grid(94,145,575,525,21,23);
    swab = new Swab(grid);
    hoverer.register(swab);
    dragger.register(swab);
    for(var i = 0; i < swab.radius_buttons.length; i++)
      clicker.register(swab.radius_buttons[i]);
    for(var i = 0; i < swab.mode_buttons.length; i++)
      clicker.register(swab.mode_buttons[i]);
  };

  var t = 0;
  self.tick = function()
  {
    grid.tick();
    hoverer.flush();
    dragger.flush();
    clicker.flush();
    particler.tick();
  };

  self.draw = function()
  {
    stage.drawCanv.context.drawImage(images.interface, 0, 0);
    grid.draw(stage.drawCanv);
    particler.draw(stage.drawCanv);
    swab.draw(stage.drawCanv);
    var notes = grid.bacteriaNotes();
    stage.drawCanv.context.fillStyle = "#000000";
    stage.drawCanv.context.font = "12px Arial Black";
    stage.drawCanv.context.fillText("Strongest: "+Math.round(notes.strongest*1000)/1000,stage.drawCanv.canvas.width-215,stage.drawCanv.canvas.height-180);
    stage.drawCanv.context.fillText("Weakest: "+Math.round(notes.weakest*1000)/1000,stage.drawCanv.canvas.width-215,stage.drawCanv.canvas.height-160);
    stage.drawCanv.context.fillText("Average: "+Math.round(notes.average*1000)/1000,stage.drawCanv.canvas.width-215,stage.drawCanv.canvas.height-140);
    stage.drawCanv.context.fillText("Count: "+notes.count,stage.drawCanv.canvas.width-215,stage.drawCanv.canvas.height-120);
  };

  self.cleanup = function()
  {
  };
};

