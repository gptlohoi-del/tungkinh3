// Lightweight browser API stand-in to run the actual classic scripts without internet.
const fs = require('fs'), vm=require('vm'), path=require('path'), assert=require('assert');
const root=path.resolve(__dirname,'..');
const state=new Map(); const nodes=new Map(); const list=[];
function el(id='') {
 const attr=new Map(); const listeners=new Map();
 const e={id,style:{setProperty(){}},children:[],value:'',textContent:'',innerText:'',innerHTML:'',hidden:false,checked:false,
  offsetTop:0,offsetWidth:200,clientHeight:500,offsetHeight:45,scrollTop:0,selectedIndex:0,
  classList:{toggle(){},remove(){},add(){},contains(){return false}},
  setAttribute(k,v){attr.set(k,v)},getAttribute(k){return attr.get(k)},removeAttribute(k){attr.delete(k)},
  addEventListener(k,cb){listeners.set(k,cb)},appendChild(c){this.children.push(c);return c},append(...c){this.children.push(...c)},
  replaceChildren(...c){this.children=c},querySelector(s){if(s.includes('checkbox'))return el();if(s.includes('.sentence-'))return el();return null},
  querySelectorAll(){return []},focus(){},select(){},blur(){},load(){},pause(){this.paused=true},
  play(){this.paused=false;return Promise.resolve()},scrollIntoView(){},click(){},remove(){},
  getFiles(){return []},
 };
 return e;
}
const doc={readyState:'loading', body:el('body'), documentElement:el('html'),
 getElementById(id){if(!nodes.has(id)) nodes.set(id,el(id));return nodes.get(id)},
 createElement(tag){const e=el(); e.tagName=tag; return e},
 querySelector(s){if(s.includes('input[name='))return el();return el()},
 querySelectorAll(s){if(s==='.sentence-item')return list;
  if(s.includes('input[name')||s.includes('[name='))return [];
  return []},addEventListener(){},
};
// Track list: indexed list creation is pure data; simulate appendChild rendering.
const listEl=doc.getElementById('sentencesList');
listEl.appendChild=(e)=>{list.push(e);return e;};
const localStorage={getItem:k=>state.get(k)??null,setItem:(k,v)=>state.set(k,String(v)),removeItem:k=>state.delete(k)};
const ctx={document:doc,localStorage,console,navigator:{userAgent:'node',mediaDevices:null},
 URL:{createObjectURL(){return 'blob:fake'},revokeObjectURL(){}}, Blob, TextEncoder, Uint8Array, DataView,
 setTimeout,clearTimeout,setInterval,clearInterval,Math,Date,JSON,Array,Set,Map,Number,Promise,
 location:{hostname:'tk3.test', pathname:'/index.html',protocol:'https:',reload(){}},
 confirm:()=>true,alert(){},
 fetch:async url=> {const key=String(url);
  if(key.includes('tracks.json')) return {ok:true,json:async()=>JSON.parse(fs.readFileSync(root+'/tracks.json','utf8'))};
  if(key.includes('IPA.txt'))return {ok:true,text:async()=>fs.readFileSync(root+'/IPA.txt','utf8')};
  if(key.includes('03%20ADDITIONAL%20PRAYER.srt')) return {ok:true,text:async()=>fs.readFileSync(root+'/03 ADDITIONAL PRAYER.srt','utf8')};
  return {ok:false,status:404};
 },
};
ctx.window=ctx;ctx.window.innerWidth=390;ctx.window.isSecureContext=true;ctx.window.TK3_DEFAULTS={appearance:{theme:'light',easy:false},playbackSpeed:1,practice:{}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root+'/index.html','utf8').match(/<script>\s*([\s\S]*?)<\/script>/)[1],ctx,{filename:'index.html'});
vm.runInContext(fs.readFileSync(root+'/practice.js','utf8'),ctx,{filename:'practice.js'});
(async()=>{
 await ctx.initApp(); await new Promise(r=>setTimeout(r,20));
 assert.strictEqual(ctx.document.getElementById('trackSelector').children.length,3);
 assert.strictEqual(vm.runInContext('sentences.length',ctx),0);
 doc.getElementById('trackSelector').value='2'; await ctx.handleTrackChange('2'); await new Promise(r=>setTimeout(r,30));
 assert.strictEqual(vm.runInContext('sentences.length',ctx),11);
 console.log('sentences',vm.runInContext('sentences.length',ctx),'subtitle counter',doc.getElementById('sentenceCounter').textContent);
 await ctx.tungkinh3Practice.select(3,{scroll:false});
 assert.strictEqual(doc.getElementById('sentenceCounter').textContent,'4/11');
 ctx.toggleSentenceMark(3,'favorite');ctx.toggleSentenceMark(3,'difficult');
 assert.strictEqual(vm.runInContext('trackMemory(false).favorite[0]',ctx),3);
 assert.strictEqual(vm.runInContext('trackMemory(false).difficult[0]',ctx),3);
 assert.strictEqual(vm.runInContext('learningState.lastTrack',ctx),'03 ADDITIONAL PRAYER.mp3');
 console.log('Counter after practice select',doc.getElementById('sentenceCounter').textContent);
 console.log('Progress',doc.getElementById('learningProgress').textContent);
 console.log('VM script smoke passed');
})().catch(e=>{console.error(e);process.exitCode=1});
