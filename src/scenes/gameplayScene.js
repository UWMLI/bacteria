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

  var NUM_ROWS = 25;
  var NUM_COLS = 50;

  var NODE_TYPE_COUNT = 0;
  var NODE_TYPE_EMPTY    = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;
  var NODE_TYPE_BACTERIA = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;
  var NODE_TYPE_ANTIBIO  = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;
  var NODE_TYPE_INVALID  = NODE_TYPE_COUNT; NODE_TYPE_COUNT++;

  var Node = function()
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

      self.s_w = self.w = stage.dispCanv.canvas.width/NUM_COLS;
      self.s_h = self.h = stage.dispCanv.canvas.height/NUM_ROWS;
      self.s_x = self.x = self.c*self.w;
      self.s_y = self.y = self.r*self.h;

      self.type = type;
      self.hp = 100;
      self.resist = Math.random();
      self.bred = false;
    }

    self.tick = function()
    {
      switch(self.type)
      {
        case NODE_TYPE_BACTERIA:
          self.hp++; if(self.hp > 100) self.hp = 100;
          break;
        case NODE_TYPE_ANTIBIO:
          break;
        case NODE_TYPE_EMPTY:
        default:
          break;
      }
    }

    self.draw = function(canv)
    {
      switch(self.type)
      {
        case NODE_TYPE_BACTERIA:
          canv.context.fillStyle = "rgba("+(Math.round(1.36*self.hp))+","+(Math.round(2.55*self.hp))+","+(Math.round(0.34*self.hp))+",1)";
          canv.context.fillRect(self.x,self.y,self.w,self.h);
          canv.context.lineWidth = 2;
          canv.context.strokeStyle = "rgba("+Math.round((1-self.resist)*255)+","+Math.round((1-self.resist)*255)+","+Math.round((1-self.resist)*255)+",1)";
          canv.context.strokeRect(self.x,self.y,self.w,self.h);
          break;
        case NODE_TYPE_ANTIBIO:
          canv.context.fillStyle = "#AAAAAA";
          canv.context.fillRect(self.x,self.y,self.w,self.h);
          break;
        case NODE_TYPE_INVALID:
          canv.context.fillStyle = "#FF0000"
          canv.context.fillRect(self.x,self.y,self.w,self.h);
          break;
        case NODE_TYPE_EMPTY:
        default:
          //canv.context.fillStyle = "#FFFFAF"
          //canv.context.fillRect(self.x,self.y,self.w,self.h);
          break;
      }
    }
  }

  var NodeSelector = function()
  {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.w = stage.dispCanv.canvas.width;
    self.h = stage.dispCanv.canvas.height;

    self.hovering_c = -1;
    self.hovering_r = -1;

    var node_w = self.w/NUM_COLS;
    var node_h = self.h/NUM_ROWS;

    self.hover = function(evt)
    {
      self.hovering_c = Math.floor(NUM_COLS*(evt.doX/self.w));
      self.hovering_r = Math.floor(NUM_ROWS*(evt.doY/self.h));
    }
    self.unhover = function(evt)
    {
      self.hovering_c = -1;
      self.hovering_r = -1;
    }
    self.dragStart = function(evt)
    {
      self.drag(evt);
    }
    self.drag = function(evt)
    {
      var n = validNodeAt(self.hovering_c,self.hovering_r);
      console.log(n);
      switch(n.type)
      {
        case NODE_TYPE_BACTERIA:
          if(n.hp - 100*antibio_resist*(1-n.resist) > 0)
            n.hp -= 100*antibio_resist*(1-n.resist);
          else
          {
            n.type = NODE_TYPE_ANTIBIO;
            n.hp = Math.round(n.hp/(antibio_resist*(1-n.resist)));
            n.resist = antibio_resist;
          }
          break;
        case NODE_TYPE_ANTIBIO:
          n.hp = 100;
          break;
        case NODE_TYPE_INVALID:
          break;
        case NODE_TYPE_EMPTY:
          n.type = NODE_TYPE_ANTIBIO;
          n.hp = 100;
          n.resist = antibio_resist;
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
      canv.context.strokeRect(self.hovering_c*node_w,self.hovering_r*node_h,node_w,node_h);
    }
  }

  var antibio_resist = 0.5;
  var grid;
  var node_selector;
  var invalidNode = new Node(); invalidNode.init(-1,-1,NODE_TYPE_INVALID);
  var nodeAt = function(c,r) { return grid[(r*NUM_COLS)+c]; };
  var validNodeAt = function(c,r)
  {
    if(c < 0 || c >= NUM_COLS
    || r < 0 && r >= NUM_ROWS)
      return invalidNode;
    return grid[(r*NUM_COLS)+c];
  };
  var nearestType = function(c,r,t,max_d,unbred)
  {
    var nearest_node = invalidNode;
    var nearest_d = max_d+1;
    var min_c = Math.max(0,c-max_d);
    var max_c = Math.min(NUM_COLS,c+max_d);
    var min_r = Math.max(0,r-max_d);
    var max_r = Math.min(NUM_ROWS,r+max_d);
    var tmp_c;
    var tmp_r;

    var tmp_node;
    var tmp_d;
    for(tmp_r = min_r; tmp_r <= max_r; tmp_r++)
    {
      for(tmp_c = min_c; tmp_c <= max_c; tmp_c++)
      {
        if((tmp_node = nodeAt(tmp_c, tmp_r)) && tmp_node.type == t && (!unbred || !tmp_node.bred) && //node exists / is correct type
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
            if(Math.random() < 0.5) nearest_node = tmp_node;
          }
        }
      }
    }
    return nearest_node;
  };

  self.ready = function()
  {
    hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
    dragger = new Dragger({source:stage.dispCanv.canvas});
    node_selector = new NodeSelector();
    hoverer.register(node_selector);
    dragger.register(node_selector);

    var r; var c; var i;
    grid = [];
    for(r=0;r<NUM_ROWS;r++){for(c=0;c<NUM_COLS;c++){ i = (r*NUM_COLS)+c;
        grid[i] = new Node();
        grid[i].init(c,r,Math.floor(Math.random()*Math.random()*Math.random()*Math.random()*(NODE_TYPE_COUNT-1)));
    }}
  };

  var t = 0;
  self.tick = function()
  {
    var r; var c; var i;
    t++;

    if(t%1 == 0)
    {
      //multiply
      for(r=0;r<NUM_ROWS;r++){for(c=0;c<NUM_COLS;c++){ i = (r*NUM_COLS)+c;
        grid[i].bred = false;
      }}

      var nearest_bacteria;
      var nearest_empty;
      for(r=0;r<NUM_ROWS;r++){for(c=0;c<NUM_COLS;c++){ i = (r*NUM_COLS)+c;
        if(grid[i].type == NODE_TYPE_BACTERIA)
        {
          nearest_bacteria = nearestType(c,r,NODE_TYPE_BACTERIA,3,true);
          if(nearest_bacteria.type != NODE_TYPE_INVALID)
          {
            nearest_empty = nearestType(c,r,NODE_TYPE_EMPTY,3,false);
            if(nearest_empty.type != NODE_TYPE_INVALID && Math.random() < 0.01)
            {
              nearest_empty.type = NODE_TYPE_BACTERIA;
              nearest_empty.resist = (grid[i].resist+nearest_bacteria.resist)/2;
              nearest_empty.hp = Math.round((grid[i].hp+nearest_bacteria.hp)/2);
              nearest_empty.bred = true; //disallow breeding on first cycle
              grid[i].bred = true;
              nearest_bacteria.bred = true;
            }
          }
        }
      }}
    }

    for(var i = 0; i < NUM_ROWS*NUM_COLS; i++)
      grid[i].tick();

    hoverer.flush();
    dragger.flush();
  };

  self.draw = function()
  {
    for(var i = 0; i < NUM_ROWS*NUM_COLS; i++)
      grid[i].draw(stage.drawCanv);

    node_selector.draw(stage.drawCanv);
  };

  self.cleanup = function()
  {
  };

};

