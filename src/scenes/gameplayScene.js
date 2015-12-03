var GamePlayScene = function(game, stage)
{
  var self = this;

  var ENUM;

  ENUM = 0;
  var NODE_TYPE_NONE = ENUM; ENUM++;
  var NODE_TYPE_BACT = ENUM; ENUM++;
  var NODE_TYPE_BIOT = ENUM; ENUM++;
  var NODE_TYPE_BODY = ENUM; ENUM++;

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

      self.x = rect.x+row/n_cols*rect.w;
      self.y = rect.y+col/n_rows*rect.h;
      self.w = 1/n_cols*rect.w;
      self.h = 1/n_rows*rect.h;
    }

    self.setType = function(t)
    {
      self.type = t;
      self.age = 0;
      self.bounce_prog = 1;
      if(t == NODE_TYPE_BACT) self.body_resist = 0.3;
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
        case NODE_TYPE_BACT:
          canv.context.fillStyle = "#AA4499";
          canv.context.strokeStyle = "#ffffff";
          var r = Math.floor(self.biot_resist*255);
          canv.context.fillStyle = "rgba("+r+","+r+","+r+",1)";
          canv.context.fillRect(x,y,w,h);
          canv.context.strokeRect(x,y,w,h);
          break;
        case NODE_TYPE_BIOT:
          canv.context.fillStyle = "#222222";
          canv.context.strokeStyle = "#ffffff";
          canv.context.fillRect(x,y,w,h);
          canv.context.strokeRect(x,y,w,h);
          break;
        case NODE_TYPE_BODY:
          canv.context.fillStyle = "#882222";
          canv.context.strokeStyle = "#ffffff";
          canv.context.fillRect(x,y,w,h);
          canv.context.strokeRect(x,y,w,h);
          break;
      }
    }

    self.tick = function()
    {
      if(self.bounce_prog > 0) self.bounce_prog -= 0.01;

      if(self.type == NODE_TYPE_BACT)
        self.age++;
      if(self.type == NODE_TYPE_BODY)
      {
        self.age++;
        self.body_resist -= 0.001;
        if(self.body_resist < 0) self.body_resist = 0;
      }
    }
  }

  var Grid = function(cols,rows)
  {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.w = stage.dispCanv.canvas.width;
    self.h = stage.dispCanv.canvas.height;

    self.cols = cols;
    self.rows = rows;
    //double buffer nodes. unfortunate indirection, but yields cleaner sim.
    self.nodes_a = [];
    self.nodes_b = [];
    self.node_buffs = [self.nodes_a,self.nodes_b];
    self.node_buff = 0;

    self.n_bact = 0;

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

    self.dose = function(amt)
    {
      var nodes = self.node_buffs[self.node_buff];
      for(var i = 0; i < nodes.length; i++)
      {
        var n = nodes[i];
        if((n.type == NODE_TYPE_BACT || n.type == NODE_TYPE_BODY) && amt > n.biot_resist)
          n.setType(NODE_TYPE_NONE);
      }
    }

    self.draw = function(canv)
    {

      var nodes = self.node_buffs[self.node_buff];
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
      var i = 0;
      for(var r = 0; r < self.rows; r++)
      {
        for(var c = 0; c < self.cols; c++)
        {
          var i = self.ifor(c,r);
          switch(new_nodes[i].type)
          {
            case NODE_TYPE_NONE:
              if(Math.random() < 0.01) //should gen
              {
                var n_neighbors = 0;
                var biot_resist = 0.;
                var n;
                n = old_nodes[self.ifor(c-1,r)];
                if(n.type == NODE_TYPE_BACT) { n_neighbors++; biot_resist = n.biot_resist; }
                n = old_nodes[self.ifor(c,r-1)];
                if(n.type == NODE_TYPE_BACT) { n_neighbors++; if(Math.random() < 1/n_neighbors) biot_resist = n.biot_resist; }
                n = old_nodes[self.ifor(c+1,r)];
                if(n.type == NODE_TYPE_BACT) { n_neighbors++; if(Math.random() < 1/n_neighbors) biot_resist = n.biot_resist; }
                n = old_nodes[self.ifor(c,r+1)];
                if(n.type == NODE_TYPE_BACT) { n_neighbors++; if(Math.random() < 1/n_neighbors) biot_resist = n.biot_resist; }

                if(n_neighbors > 0)
                {
                  new_nodes[i].setType(NODE_TYPE_BACT);
                  if(Math.random() < 0.2) //should mutate
                  {
                    if(Math.random() < 0.6) biot_resist -= 0.1;
                    else biot_resist += 0.1;
                    if(biot_resist < 0) biot_resist = 0;
                    if(biot_resist > 1)
                    {
                      if(Math.random() < 0.2) biot_resist = 1; //should super mutate
                      else biot_resist = 0.9;
                    }
                  }
                  new_nodes[i].biot_resist = biot_resist;
                }
              }
              break;
            case NODE_TYPE_BACT:
              if(new_nodes[i].age > 500) new_nodes[i].setType(NODE_TYPE_NONE);
              break;
            case NODE_TYPE_BODY:
              if(new_nodes[i].age > 2000) new_nodes[i].setType(NODE_TYPE_NONE);
              break;
          }
        }
      }

      //tick outer-node movements
      for(var r = 0; r < self.rows; r++)
      {
        for(var c = 0; c < self.cols; c++)
        {
          var i = self.ifor(c,r);
          var on = old_nodes[i];
          var reprod = 0;
          if(on.type == NODE_TYPE_BODY && !on.body_resist)
          {
            nn = new_nodes[self.ifor(c-1,r)]; if(nn.type == NODE_TYPE_BACT) { reprod = 1; nn.setType(NODE_TYPE_BODY); }
            nn = new_nodes[self.ifor(c,r-1)]; if(nn.type == NODE_TYPE_BACT) { reprod = 1; nn.setType(NODE_TYPE_BODY); }
            nn = new_nodes[self.ifor(c+1,r)]; if(nn.type == NODE_TYPE_BACT) { reprod = 1; nn.setType(NODE_TYPE_BODY); }
            nn = new_nodes[self.ifor(c,r+1)]; if(nn.type == NODE_TYPE_BACT) { reprod = 1; nn.setType(NODE_TYPE_BODY); }
            if(reprod) nn = new_nodes[i]; nn.setType(NODE_TYPE_NONE);
          }
        }
      }

      //tick nodes
      self.n_bact = 0;
      self.n_body = 0;
      for(var i = 0; i < new_nodes.length; i++)
      {
        new_nodes[i].tick();
             if(new_nodes[i].type == NODE_TYPE_BACT) self.n_bact++;
        else if(new_nodes[i].type == NODE_TYPE_BODY) self.n_body++;
      }
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

  self.presser;
  self.hoverer;
  self.dragger;

  self.grid;

  self.dose_amt;
  self.dosing_prog;
  self.dosing_prog_rate;
  self.dose_slider;
  self.dose_button;
  self.reset_button;

  self.ready = function()
  {
    var c = stage.drawCanv;
    self.presser = new Presser({source:stage.dispCanv.canvas});
    self.hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});
    self.dragger = new Dragger({source:stage.dispCanv.canvas});

    self.grid = new Grid(50,25);
    self.grid.nodeAt(5,5).setType(NODE_TYPE_BACT);
    self.grid.nodeAt(5,5).biot_resist = 0.1;
    self.grid.nodeAt(self.grid.cols-1-5,self.grid.rows-1-5).setType(NODE_TYPE_BODY);
    self.hoverer.register(self.grid);
    self.dragger.register(self.grid);

    self.dose_amt = 0.;
    self.dosing_prog = 0;
    self.dosing_prog_rate = 0.01;
    self.dose_slider = new SmoothSliderBox(40,c.canvas.height-30,100,20,0.0,1.0,0.0,function(v){ self.dose_amt = v; });
    self.dragger.register(self.dose_slider);

    self.dose_button = new ButtonBox(10,c.canvas.height-30,20,20,function(){ self.dosing_prog = self.dosing_prog_rate; })
    self.presser.register(self.dose_button);

    self.reset_button = new ButtonBox(10,10,20,20,function(){ if(self.grid.n_bact == 0) self.grid.nodeAt(5,5).setType(NODE_TYPE_BACT); self.grid.nodeAt(5,5).biot_resist = 0.1; })
    self.presser.register(self.reset_button);
  };

  self.tick = function()
  {
    self.presser.flush();
    self.hoverer.flush();
    self.dragger.flush();

    if(self.dosing_prog)
    {
      self.grid.dose(self.dosing_prog);
      self.dosing_prog += self.dosing_prog_rate;
      if(self.dosing_prog > self.dose_amt)
        self.dosing_prog = 0;
    }

    self.grid.tick();
    self.dose_slider.tick();
  };

  self.draw = function()
  {
    var canv = stage.drawCanv;
    canv.context.fillStyle = "#330000";
    canv.context.fillRect(0,0,canv.canvas.width,canv.canvas.height);
    self.grid.draw(canv);

    canv.context.strokeStyle = "#00FF00";
    self.dose_slider.draw(canv);
    self.dose_button.draw(canv);

    if(self.dosing_prog)
    {
      canv.context.strokeStyle = "#00FF00";
      canv.context.strokeRect(self.dose_slider.x+(self.dosing_prog*self.dose_slider.w),self.dose_slider.y,2,20);
    }

    if(self.grid.n_bact == 0) self.reset_button.draw(canv);
  };

  self.cleanup = function()
  {
  };

};

