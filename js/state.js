export const MAX_STICKERS = 30;
export function notify(message) {
  const box=document.querySelector('#editor-notice'); box.textContent=message;
  box.classList.add('visible'); clearTimeout(notify.timer);
  notify.timer=setTimeout(()=>{box.classList.remove('visible');box.textContent='';},1000);
}
export function isRasterURL(value) { return typeof value==='string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(value); }
const cache=new Map();
export async function decodeImage(src) {
  if(!isRasterURL(src))throw new Error('PNG·JPG·WebP 이미지만 사용할 수 있어요.');
  if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{
    const image=new Image(); image.onload=()=>{
      if(image.naturalWidth*image.naturalHeight>40000000)reject(new Error('이미지 해상도가 너무 커요. 4천만 픽셀 이하로 줄여주세요.'));
      else resolve(image);
    }; image.onerror=()=>reject(new Error('이미지를 읽을 수 없어요.')); image.src=src;
  }));
  try{return await cache.get(src);}catch(error){cache.delete(src);throw error;}
}
export function pruneImages(state) {
  const used=new Set([...Object.values(state.images),...state.stickers.map(s=>s.src)]);
  for(const key of cache.keys())if(!used.has(key))cache.delete(key);
}
export async function readImage(file) {
  if(!file) return null;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG·JPG·WebP 파일을 선택해 주세요.');
  if(file.size>15*1024*1024)throw new Error('이미지는 15MB 이하로 선택해 주세요.');
  const src=await new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(new Error('파일 읽기에 실패했어요.')); reader.readAsDataURL(file); });
  const image=await decodeImage(src);
  const scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));
  if(scale===1)return src;
  const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/png');
}
export async function validateState(raw,definition) {
  const {templateId:id,initialState,fonts=[]}=definition;
  if(!raw || raw.schemaVersion!==1 || raw.templateId!==id)throw new Error('현재 템플릿의 편집 파일이 아니에요.');
  raw=definition.migrateState?.(raw)??raw;
  let next=initialState(id);
  if(definition.restoreState) next=await definition.restoreState(raw,next);
  const positions=definition.getPositions?.(next)??definition.positions??{};
  const size=definition.getSize?.(next)??definition.size;
  const fieldTypes=new Map();
  const radioOptions=new Map();
  const numberFields=new Map();
  const tabs=typeof definition.tabs==='function'?definition.tabs(next):definition.tabs;
  for(const tab of tabs){
    if(tab.type==='action'||tab.type==='stickers')continue;
    const source=tab.groups??definition.groups??[];
    const groups=typeof source==='function'?source(next,tab.id):source;
    for(const [group] of groups)for(const field of definition.fields(tab.id,group,next)){
      fieldTypes.set(field.id,field.type);
      if(field.type==='number')numberFields.set(field.id,field);
      if(field.type==='radio')radioOptions.set(field.id,field.options.map(option=>option.value));
    }
  }
  if(!raw.values || !raw.images || !Array.isArray(raw.stickers) || raw.stickers.length>MAX_STICKERS)throw new Error('편집 파일 형식이 올바르지 않아요.');
  for(const [key,def] of Object.entries(next.values)) {
    const value=raw.values[key] ?? def;
    if(fieldTypes.get(key)==='number'){
      const number=typeof value==='number'?value:typeof value==='string'&&value.trim()!==''?Number(value):NaN;
      const field=numberFields.get(key);
      if(!Number.isFinite(number)||number<field.min||number>field.max)throw new Error('숫자 값이 범위를 벗어났어요.');
      next.values[key]=number;next.touched[key]=raw.touched?.[key]===true;continue;
    }
    if(fieldTypes.get(key)==='checkbox'){
      if(typeof value!=='boolean')throw new Error('체크박스 값이 올바르지 않아요.');
      next.values[key]=value;next.touched[key]=raw.touched?.[key]===true;
      continue;
    }
    if(typeof value!=='string' || value.length>1000)throw new Error('텍스트 값이 올바르지 않아요.');
    if(fieldTypes.get(key)==='radio' && !radioOptions.get(key).includes(value))throw new Error('선택 항목 값이 올바르지 않아요.');
    if(fieldTypes.get(key)==='font' && !fonts.includes(value))throw new Error('지원하지 않는 글꼴이에요.');
    if(fieldTypes.get(key)==='color' && !/^#[0-9a-f]{6}$/i.test(value))throw new Error('색상 값이 올바르지 않아요.');
    next.values[key]=value;
    next.touched[key]=raw.touched ? raw.touched[key]===true : true;
  }
  definition.restoreFormatting?.(raw,next);
  for(const key of Object.keys(positions))if(raw.images[key]) {
    await decodeImage(raw.images[key]); next.images[key]=raw.images[key];
  }
  const ids=new Set();
  for(const item of raw.stickers) {
    if(!item || typeof item.id!=='string' || item.id.length>100 || ids.has(item.id))throw new Error('스티커 ID가 올바르지 않아요.');
    for(const key of ['x','y','width','height','rotation'])if(!Number.isFinite(item[key]))throw new Error('스티커 좌표가 올바르지 않아요.');
    if(item.width<8 || item.height<8 || item.width>Math.max(size.width,size.height)*2 || item.height>Math.max(size.width,size.height)*2 || Math.abs(item.x)>Math.max(size.width,size.height)*3 || Math.abs(item.y)>Math.max(size.width,size.height)*3 || Math.abs(item.rotation)>36000)throw new Error('스티커 크기·위치가 범위를 벗어났어요.');
    await decodeImage(item.src); ids.add(item.id);
    next.stickers.push({id:item.id,src:item.src,name:String(item.name||'스티커').slice(0,100),x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation,shadow:item.shadow===true,outline: item.outline === true, citation: String(item.citation || '').slice(0, 100)});
  }
  return next;
}
export function createStore(definition) {
  const {templateId:id,initialState}=definition;
  let state=initialState(id), revision=0, dirty=false;
  const listeners=new Set();
  return {
    definition,
    get state(){return state;},get revision(){return revision;},get dirty(){return dirty;},
    markSaved(){dirty=false;},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    change(fn,kind='values'){fn(state);revision++;dirty=true;for(const listener of listeners)listener(state,kind);},
    replace(next){state=next;revision++;dirty=false;for(const listener of listeners)listener(state,'replace');pruneImages(state);}
  };
}
