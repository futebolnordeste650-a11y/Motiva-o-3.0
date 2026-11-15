const DB_NAME='motivacao30'; const STORE='videos';
let db, showFavs=false, objectUrls=[];
const grid=document.querySelector('#grid'), picker=document.querySelector('#picker'), count=document.querySelector('#count');
const player=document.querySelector('#player'), videoPlayer=document.querySelector('#videoPlayer');
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function tx(mode='readonly'){return db.transaction(STORE,mode).objectStore(STORE);}
function allVideos(){return new Promise((resolve,reject)=>{const r=tx().getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function save(item){return new Promise((resolve,reject)=>{const r=tx('readwrite').add(item);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function update(item){return new Promise((resolve,reject)=>{const r=tx('readwrite').put(item);r.onsuccess=resolve;r.onerror=()=>reject(r.error);});}
function remove(id){return new Promise((resolve,reject)=>{const r=tx('readwrite').delete(id);r.onsuccess=resolve;r.onerror=()=>reject(r.error);});}
function fmt(bytes){if(bytes<1024**2)return (bytes/1024).toFixed(0)+' KB';return (bytes/1024**2).toFixed(1)+' MB';}
async function render(){
  objectUrls.forEach(URL.revokeObjectURL);objectUrls=[];
  let items=await allVideos(); if(showFavs)items=items.filter(x=>x.favorite);
  count.textContent=items.length+' vídeo'+(items.length===1?'':'s');
  grid.innerHTML='';
  if(!items.length){grid.innerHTML='<div class="empty">'+(showFavs?'Você ainda não marcou favoritos.':'Sua galeria está vazia. Adicione seus primeiros vídeos!')+'</div>';return;}
  for(const item of items){
    const url=URL.createObjectURL(item.blob);objectUrls.push(url);
    const card=document.createElement('article');card.className='card';
    const thumb=document.createElement('div');thumb.className='thumb';thumb.textContent='▶';
    const info=document.createElement('div');info.className='info';
    const name=document.createElement('div');name.className='name';name.textContent=item.name;
    const meta=document.createElement('div');meta.className='meta';meta.textContent=fmt(item.blob.size);
    const actions=document.createElement('div');actions.className='cardactions';
    const play=document.createElement('button');play.textContent='Assistir';play.onclick=()=>{document.querySelector('#playingName').textContent=item.name;videoPlayer.src=url;player.showModal();videoPlayer.play().catch(()=>{});};
    const fav=document.createElement('button');fav.className='secondary';fav.textContent=item.favorite?'♥':'♡';fav.onclick=async()=>{item.favorite=!item.favorite;await update(item);render();};
    const del=document.createElement('button');del.className='secondary';del.textContent='Excluir';del.onclick=async()=>{if(confirm('Excluir este vídeo da galeria?')){await remove(item.id);render();}};
    actions.append(play,fav,del);info.append(name,meta,actions);card.append(thumb,info);grid.append(card);
    const v=document.createElement('video');v.src=url;v.muted=true;v.preload='metadata';v.addEventListener('loadeddata',()=>{thumb.textContent='';thumb.append(v);},{once:true});
  }
}
picker.addEventListener('change',async e=>{
  const files=[...e.target.files].filter(f=>f.type.startsWith('video/'));
  for(const file of files){await save({name:file.name,blob:file,favorite:false,addedAt:Date.now()});}
  picker.value=''; await render();
});
document.querySelector('#allBtn').onclick=()=>{showFavs=false;render();};
document.querySelector('#favBtn').onclick=()=>{showFavs=true;render();};
document.querySelector('#closePlayer').onclick=()=>{videoPlayer.pause();videoPlayer.removeAttribute('src');videoPlayer.load();player.close();};
(async()=>{db=await openDB();try{if(navigator.storage?.persist)await navigator.storage.persist();}catch{}await render();})();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));