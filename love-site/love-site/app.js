/* منطق الموقع: الدخول، المعرض، والرسايل */
var PHOTOS = [], LETTERS = [], HERO = [];
var SLOTS = 6;
var $ = function(id){return document.getElementById(id)};

function safeGet(){try{return sessionStorage.getItem("k")||""}catch(e){return ""}}
function safeSet(v){try{v?sessionStorage.setItem("k",v):sessionStorage.removeItem("k")}catch(e){}}

function pick(arr,key){
  var last=-1; try{last=parseInt(localStorage.getItem(key),10)}catch(e){}
  var i; do{i=Math.floor(Math.random()*arr.length)}while(arr.length>1 && i===last);
  try{localStorage.setItem(key,String(i))}catch(e){}
  return arr[i];
}
function setLogin(){var m=pick(LOGIN,"ll");$("lt").textContent=m[0];$("ls").textContent=m[1]}
function setLetter(){
  var l=pick(LETTERS,"tl");
  $("lh").textContent=l.h; $("lsg").textContent=l.s;
  var box=$("lp"); box.innerHTML="";
  l.p.forEach(function(t){var e=document.createElement("p");e.textContent=t;box.appendChild(e)});
}
function setHero(){$("hs").textContent=pick(HERO,"hl");setLetter()}

function render(){
  var g=$("gallery"); g.innerHTML="";
  var list=PHOTOS.length?PHOTOS:Array.from({length:SLOTS},function(){return null});
  list.forEach(function(item){
    var b=document.createElement("button"); b.className="ph"; b.type="button";
    if(item){
      var im=document.createElement("img"); im.src=item.src; im.alt=item.cap||"صورة"; b.appendChild(im);
      if(item.cap){var c=document.createElement("div");c.className="cap";c.textContent=item.cap;b.appendChild(c)}
      b.onclick=function(){openLb(item)};
    }else{
      b.innerHTML='<span class="empty" aria-hidden="true">♥</span>';
      b.setAttribute("aria-label","مكان صورة فاضي");
      b.onclick=function(){openLb(null)};
    }
    g.appendChild(b);
  });
}
function openLb(item){
  var lb=$("lb"); lb.innerHTML="";
  if(item){var im=document.createElement("img");im.src=item.src;im.alt=item.cap||"";lb.appendChild(im)}
  else{var d=document.createElement("div");d.className="msg";d.textContent="الصورة هتتحط هنا قريب ♥";lb.appendChild(d)}
  lb.classList.remove("hidden");
}
$("lb").onclick=function(){this.classList.add("hidden")};
document.addEventListener("keydown",function(e){if(e.key==="Escape")$("lb").classList.add("hidden")});

function show(on){
  $("login").classList.toggle("hidden",on);
  $("site").classList.toggle("hidden",!on);
  if(on){render();setHero();window.scrollTo(0,0)}else{setLogin()}
}

/* فتح المحتوى:
   - النسخة النهائية (فيها BLOB): بيفك التشفير بكلمة السر.
   - نسخة التطوير (بدون BLOB): بيقارن بالـ SECRET من data.js. */
function b64(x){var b=atob(x),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
async function unlock(pw){
  var d;
  if(typeof BLOB!=="undefined"){
    var raw=b64(BLOB), salt=raw.slice(0,16), iv=raw.slice(16,28), ct=raw.slice(28);
    var km=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);
    var key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:150000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["decrypt"]);
    var pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:iv},key,ct);
    d=JSON.parse(new TextDecoder().decode(pt));
  }else{
    if(pw!==SECRET) throw new Error("wrong secret");
    d=PRIVATE;
  }
  PHOTOS=d.photos; LETTERS=d.letters; HERO=d.hero;
}

async function tryLogin(){
  var name=$("u").value.trim(), pw=$("p").value.trim();
  if(!name||!pw){$("err").textContent="اكتبي اسمك وكلمة السر اللي بينا يا قلبي.";return}
  $("enter").disabled=true;
  try{
    await unlock(pw);
    $("err").textContent=""; safeSet(pw); show(true);
  }catch(e){
    $("err").textContent="الباب ده لينا إحنا الاتنين بس، اتأكدي من الاسم وكلمة السر.";
    $("p").select();
  }
  $("enter").disabled=false;
}
$("enter").onclick=tryLogin;
$("u").addEventListener("keydown",function(e){if(e.key==="Enter")$("p").focus()});
$("p").addEventListener("keydown",function(e){if(e.key==="Enter")tryLogin()});
$("logout").onclick=function(){safeSet("");PHOTOS=[];LETTERS=[];HERO=[];$("u").value="";$("p").value="";show(false)};

var sp=safeGet();
if(sp){unlock(sp).then(function(){show(true)}).catch(function(){safeSet("");setLogin()})}else setLogin();
