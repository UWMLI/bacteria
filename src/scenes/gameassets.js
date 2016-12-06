var menu_grad_img;
var menu_logo_img;
var blue_img;
var strength_img;
var green_circ_img;
var white_circ_img;
var char_imgs;
var bact_back_img;
var bact_front_img;
var bact_face_imgs;
var bact_imgs;
var plus_img;

var bake = function()
{
  var s;

  menu_grad_img = new Image();
  menu_grad_img.src = "assets/menu/menu_gradient.png";
  menu_logo_img = new Image();
  menu_logo_img.src = "assets/menu/menu_logo.png";

  s = 300;
  blue_img = GenIcon(10,s);
  var grad = blue_img.context.createLinearGradient(
    0,s,
    0,0
  );
  grad.addColorStop(0,"rgba(99,228,248,1)");
  grad.addColorStop(1,"rgba(99,228,248,0)");
  blue_img.context.fillStyle=grad;
  blue_img.context.fillRect(0,0,10,s);

  char_imgs = [];
  for(var i = 0; i < 7; i++)
  {
    char_imgs[i] = new Image();
    char_imgs[i].src = "assets/chars/face/char_"+i+".png";
  }

  bact_back_img = new Image();
  bact_back_img.src = "assets/bact_bottom.png";
  bact_front_img = new Image();
  bact_front_img.src = "assets/bact_top.png";
  bact_face_imgs = [];
  for(var i = 0; i < 8; i++)
  {
    bact_face_imgs[i] = new Image();
    bact_face_imgs[i].src = "assets/face_"+i+".png";
  }

  s = 200;
  var tmp = GenIcon(s,s);
  var i = 0;
  big_bact_imgs = [];
  big_bact_imgs[i] = genBactImg(tmp,s,"#1383B1","#84CBEC",0); i++;
  big_bact_imgs[i] = genBactImg(tmp,s,"#1878A2","#88BFDC",0); i++;
  big_bact_imgs[i] = genBactImg(tmp,s,"#2B5D7F","#959EB1",1); i++;
  big_bact_imgs[i] = genBactImg(tmp,s,"#3F4761","#A0828B",2); i++;
  big_bact_imgs[i] = genBactImg(tmp,s,"#4A3C52","#A77378",3); i++;
  big_bact_imgs[i] = genBactImg(tmp,s,"#5B2C3C","#AD605F",4); i++;
  big_bact_imgs[i] = genBactImg(tmp,s,"#642531","#B25551",5); i++;
  big_bact_imgs[i] = genBactImg(tmp,s,"#7A1017","#BE3C31",6); i++;
  big_bact_imgs[i] = genBactImg(tmp,s,"#870309","#C52C20",7); i++;

  s = 60;
  var tmp = GenIcon(s,s);
  var i = 0;
  bact_imgs = [];
  bact_imgs[i] = genBactImg(tmp,s,"#1383B1","#84CBEC",0); i++;
  bact_imgs[i] = genBactImg(tmp,s,"#1878A2","#88BFDC",0); i++;
  bact_imgs[i] = genBactImg(tmp,s,"#2B5D7F","#959EB1",1); i++;
  bact_imgs[i] = genBactImg(tmp,s,"#3F4761","#A0828B",2); i++;
  bact_imgs[i] = genBactImg(tmp,s,"#4A3C52","#A77378",3); i++;
  bact_imgs[i] = genBactImg(tmp,s,"#5B2C3C","#AD605F",4); i++;
  bact_imgs[i] = genBactImg(tmp,s,"#642531","#B25551",5); i++;
  bact_imgs[i] = genBactImg(tmp,s,"#7A1017","#BE3C31",6); i++;
  bact_imgs[i] = genBactImg(tmp,s,"#870309","#C52C20",7); i++;

  s = 660;
  strength_img = GenIcon(10,s);
  var i = 0;
  var n = 8;
  var grad = strength_img.context.createLinearGradient(
    0,s,
    0,0
  );
  grad.addColorStop(i/n,"#84CBEC"); i++;
  grad.addColorStop(i/n,"#88BFDC"); i++;
  grad.addColorStop(i/n,"#959EB1"); i++;
  grad.addColorStop(i/n,"#A0828B"); i++;
  grad.addColorStop(i/n,"#A77378"); i++;
  grad.addColorStop(i/n,"#AD605F"); i++;
  grad.addColorStop(i/n,"#B25551"); i++;
  grad.addColorStop(i/n,"#BE3C31"); i++;
  grad.addColorStop(i/n,"#C52C20"); i++;
  grad.addColorStop(0,"rgba(99,228,248,1)");
  grad.addColorStop(1,"rgba(99,228,248,0)");
  strength_img.context.fillStyle=grad;
  strength_img.context.fillRect(0,0,10,s);

  s = 200;
  var w = 10;
  var p = 10;
  green_circ_img = GenIcon(s,s);
  green_circ_img.context.strokeStyle = "#00FF00";
  green_circ_img.context.lineWidth = 10;
  green_circ_img.context.beginPath();
  green_circ_img.context.arc(s/2,s/2,s/2-6,0,twopi);
  green_circ_img.context.stroke();

  s = 200;
  var w = 10;
  var p = 10;
  white_circ_img = GenIcon(s,s);
  white_circ_img.context.strokeStyle = "#FFFFFF";
  white_circ_img.context.lineWidth = 10;
  white_circ_img.context.beginPath();
  white_circ_img.context.arc(s/2,s/2,s/2-6,0,twopi);
  white_circ_img.context.stroke();

  s = 100;
  var w = 10;
  var p = 10;
  plus_img = GenIcon(s,s);
  plus_img.context.fillStyle = "#FFFFFF";
  plus_img.context.strokeStyle = "#FFFFFF";
  plus_img.context.fillRect(s/2-w/2,p,w,s-p*2);
  plus_img.context.fillRect(p,s/2-w/2,s-p*2,w);
  plus_img.context.lineWidth = 2;
  plus_img.context.beginPath();
  plus_img.context.arc(s/2,s/2,s/2-3,0,twopi);
  plus_img.context.stroke();
}

function genBactImg(tmp,s,fg,bg,face)
{
  var icon = GenIcon(s,s);

  tmp.context.clearRect(0,0,s,s);
  tmp.context.fillStyle = bg;
  tmp.context.fillRect(0,0,s,s);
  tmp.context.globalCompositeOperation = "destination-atop";
  tmp.context.drawImage(bact_back_img,0,0,s,s);

  icon.context.drawImage(bact_back_img,0,0,s,s);
  icon.context.drawImage(tmp,0,0,s,s);

  tmp.context.clearRect(0,0,s,s);
  tmp.context.fillStyle = fg;
  tmp.context.fillRect(0,0,s,s);
  tmp.context.globalCompositeOperation = "destination-atop";
  tmp.context.drawImage(bact_front_img,0,0,s,s);

  icon.context.drawImage(bact_front_img,0,0,s,s);
  icon.context.drawImage(tmp,0,0,s,s);

  icon.context.drawImage(bact_face_imgs[face],0,s/5,s,s*3/5);

  return icon;
}

