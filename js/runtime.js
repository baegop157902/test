import { createStore, decodeImage, notify, pruneImages } from './state.js';
import { createStickers } from './stickers.js';
import { createForms } from './FormScript.js';
import { attachSaving } from './SaveBtn.js';
import { createCanvasEyedropper } from './CanvasEyedropper.js';
import { createFontSync } from './FontSync.js';

let started=false;
async function start(config){
  if(started)return;
  document.querySelector('.tools-toggle').setAttribute('aria-label','편집 도구 열기');
  const definition=config.definition;
  if(!definition){
    document.querySelectorAll('[data-action]').forEach(b=>b.disabled=true);
    const status=document.querySelector('#editor-status');status.hidden=false;
    status.textContent='이 템플릿의 편집 양식은 아직 연결되지 않았어요.';return;
  }
  started=true;
  const {positions,createScene}=definition;
  if(!window.Konva||!window.Cropper||!window.Pickr){notify('편집 라이브러리를 불러오지 못했어요. vendor 폴더를 확인해 주세요.');return;}
  const container=document.querySelector('#konva-container');
  const stage=new Konva.Stage({container,width:0,height:0});
  const store=createStore(definition);let forms;
  const scene=createScene(stage,(side,group,node)=>{stickers.select(null);forms.open(side,group,node);},store);
  await scene.ready;
  const fontSync=createFontSync(stage,()=>scene.updateValues(store.state.values),notify);
  const stickers=createStickers(stage,store,id=>forms?.selectSticker(id));
  const eyedropper=createCanvasEyedropper(stage,stickers,waitForDraw);
  forms=createForms(store,stickers,eyedropper);
  let pending=Promise.resolve(),renderEpoch=0;
  const activeImages=new Map();
  async function render(state,kind){
    scene.updateState?.(state,kind);
    scene.updateValues(state.values);
    const fontsReady=fontSync.sync();
    if(kind==='values'){await fontsReady;return;}
    const token=++renderEpoch;
    const jobs=Object.keys(positions).map(async id=>{
      const src=state.images[id]||null;if(activeImages.get(id)===src)return;
      const image=src?await decodeImage(src):null;
      if(token!==renderEpoch)return;
      scene.updateImage(id,image);activeImages.set(id,src);
    });
    if(kind==='stickers'||kind==='replace'||kind==='structure')jobs.push(stickers.render());
    await Promise.all([...jobs,fontsReady]);pruneImages(store.state);
  }
  store.subscribe((state,kind)=>{
    const task=render(state,kind);pending=Promise.all([pending.catch(()=>{}),task]).then(()=>{});
    pending.catch(error=>notify(error.message));
  });
  await render(store.state,'replace');
  async function waitForDraw(){await pending;await fontSync.sync();}
  const saving=attachSaving(store,stage,stickers,waitForDraw);
  await saving.ready;
  document.querySelector('[data-action="sticker"]').onclick=()=>forms.chooseSticker();
  const resize=(event)=>{
    const width=event?.detail?.width ?? (parseFloat(container.style.width)||0);
    const scale=width/config.width;
    stage.size({width,height:config.height*scale});
    stage.scale({x:scale,y:scale});stage.draw();stickers.positionDelete();
  };
  container.addEventListener('editor:resize',resize);resize();
  document.fonts.ready.then(()=>fontSync.refresh());
  window.pairEditor={definition,stage,store,scene,stickers,forms,saving,eyedropper,waitForDraw};
}
window.addEventListener('editor:ready',e=>start(e.detail).catch(error=>notify(error.message)));
if(window.editorTemplate)start(window.editorTemplate).catch(error=>notify(error.message));
