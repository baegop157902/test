import { attachColorPicker } from './ColorPicker.js';
import { cropImage } from './Cropper.js';
import { readImage, notify } from './state.js';
import { createKeyboardBar } from './KeyboardBar.js';

export function createForms(store,stickers,eyedropper) {
  const definition=store.definition;
  const {fields,fonts=[],fontLabels={},initialState}=definition;
  const getTabs=()=>typeof definition.tabs==='function'?definition.tabs(store.state):definition.tabs;
  const getGroups=id=>{
    const tab=getTabs().find(t=>t.id===id);
    const source=tab?.groups ?? definition.groups ?? [];
    return typeof source==='function'?source(store.state,id):source;
  };
  const contentTabs=()=>getTabs().filter(t=>t.type!=='action');
  function normalizeSelection(){
    if(!contentTabs().some(t=>t.id===side))side=contentTabs()[0]?.id;
    const items=getGroups(side);
    if(!items.some(g=>g[0]===category))category=items[0]?.[0];
  }
  const compact=matchMedia('(max-width:1024px)'),host=document.querySelector('#editor-inputs');
  const keyboard=createKeyboardBar(host);
  let side=contentTabs()[0]?.id,category,selection=null,z=210;
  normalizeSelection();
  let categoryScroll=0;
  const panels=new Map();let mobileCleanup=()=>{};
  function fieldPanel(currentSide,group) {
    const body=document.createElement('div');body.className='field-content';const cleanups=[];
    function bindVisibility(node,condition){
      if(!condition)return;
      const update=()=>{node.hidden=typeof condition==='string'
        ?store.state.values[condition]!==true
        :store.state.values[condition.id]!==condition.value;};
      update();cleanups.push({mount:()=>store.subscribe(update)});
    }
    const name=getGroups(currentSide).find(g=>g[0]===group)?.[1]||'';
    const title=document.createElement('h3');title.textContent=[getTabs().find(t=>t.id===currentSide)?.heading ?? '',name].filter(Boolean).join(' ');body.append(title);
    const fieldItems=fields(currentSide,group,store.state);
    const image=definition.imageField?.(currentSide,group,store.state);
    let trailingImage=null;
    if(image){
      const {id,visibleWhen,placement,...position}=image;
      const label=document.createElement('label');label.className='image-upload'+(position.round?' round':'')+' '+(position.className||'');
      label.style.setProperty('--image-ratio',position.width+'/'+position.height);
      const preview=document.createElement('img');preview.alt=title.textContent;preview.dataset.imagePreview=id;
      const existing=store.state.images[id];preview.hidden=!existing;if(existing)preview.src=existing;
      const caption=document.createElement('span');caption.textContent='＋ 이미지 선택';
      const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.setAttribute('aria-label',title.textContent+' 업로드');
      const remove=document.createElement('button');remove.type='button';remove.className='image-remove';remove.textContent='이미지 비우기';
      input.onchange=async()=>{
        const file=input.files[0];input.value='';if(!file)return;input.disabled=true;
        try{const src=await cropImage(file,position);if(src)store.change(s=>s.images[id]=src,'images');}
        catch(error){notify(error.message);}finally{input.disabled=false;}
      };
      remove.onclick=()=>store.change(s=>delete s.images[id],'images');
      const section=document.createElement('div');section.className='image-field';
      label.append(preview,caption,input);section.append(label,remove);bindVisibility(section,visibleWhen);
      if(placement==='afterFields')trailingImage=section;else body.append(section);
    }
    {
      for(const field of fieldItems) {
        if(field.type==='radio'){
          const section=document.createElement('fieldset');section.className='field-radio';
          const legend=document.createElement('legend');legend.textContent=field.label;
          const options=document.createElement('div');options.className='field-radio-options';
          const inputs=[];
          for(const option of field.options){
            const label=document.createElement('label');label.className='field-radio-option';
            const input=document.createElement('input');input.type='radio';input.name=field.id;input.value=option.value;
            input.checked=store.state.values[field.id]===option.value;inputs.push(input);
            input.onchange=()=>{if(input.checked)store.change(s=>{s.values[field.id]=input.value;(s.touched??={})[field.id]=true;});};
            const caption=document.createElement('span');caption.textContent=option.label;
            label.append(input,caption);options.append(label);
          }
          cleanups.push({mount:()=>store.subscribe(()=>{for(const input of inputs)input.checked=store.state.values[field.id]===input.value;})});
          section.append(legend,options);bindVisibility(section,field.visibleWhen);body.append(section);
          continue;
        }
        const label=document.createElement('label');label.className='field-row';const text=document.createElement('span');text.textContent=field.label;label.append(text);
        const value=store.state.values[field.id];
        bindVisibility(label,field.visibleWhen);
        if(field.type==='checkbox'){
          label.classList.add('field-checkbox');
          const input=document.createElement('input');input.type='checkbox';input.name=field.id;input.checked=value===true;
          input.onchange=()=>store.change(s=>{s.values[field.id]=input.checked;(s.touched??={})[field.id]=true;});
          label.prepend(input);
        }else if(field.type==='color'){
          const button=document.createElement('button');button.type='button';button.className='color-swatch';button.style.backgroundColor=value;button.setAttribute('aria-label',field.label+' 선택');label.append(button);
          // Pickr는 DOM에 추가된 뒤 초기화합니다.
          cleanups.push({mount:()=>attachColorPicker(button,value,color=>store.change(s=>s.values[field.id]=color),eyedropper)});
        }else{
          const input=document.createElement(field.type==='textarea'?'textarea':field.type==='font'?'select':'input');
          input.name=field.id;
          input.style.textAlign=field.align||'left';

          if(field.type==='font')for(const font of fonts){
            const option=document.createElement('option');
            option.value=font;



            option.textContent=fontLabels[font] ?? font;
            option.style.fontFamily=font;
            input.append(option);
          }

          else {input.maxLength=field.type==='textarea'?500:100;if(field.type==='textarea')input.rows=3;else input.type='text';}
          input.value=value;
          if(field.type!=='font')input.addEventListener('focus',()=>{
            const defaults=initialState(store.state.templateId).values;
            if(!store.state.touched?.[field.id]&&input.value===defaults[field.id]&&input.value!==''){
              input.value='';store.change(s=>{s.values[field.id]='';(s.touched??={})[field.id]=true;});
              if(definition.fontSample?.(currentSide,group))updateFontSample();
            }
          });
          input.addEventListener(field.type==='font'?'change':'input',()=>{
            store.change(s=>{s.values[field.id]=input.value;(s.touched??={})[field.id]=true;});
            if(definition.fontSample?.(currentSide,group))updateFontSample();
          });label.append(input);
        }
        body.append(label);
      }
      if(definition.fontSample?.(currentSide,group)){
        const sample=document.createElement('p');sample.className='font-sample';body.append(sample);updateFontSample();
      }
    }
    if(trailingImage)body.append(trailingImage);
    function updateFontSample(){const sample=body.querySelector('.font-sample');if(sample){const config=definition.fontSample(currentSide,group);sample.textContent=store.state.values[config.textId]||'폰트 미리보기';sample.style.fontFamily=store.state.values[config.fontId];}}
    return {body,mount(){for(const item of cleanups)item.destroy=item.mount();},destroy(){for(const item of cleanups)item.destroy?.();}};
  }
  function clearPanels(){for(const p of panels.values()){p.form?.destroy();p.node.remove();}panels.clear();}
  function placePanel(node,anchor){
    const area=document.querySelector('.editor-main').getBoundingClientRect();
    const rect=node.getBoundingClientRect();
    const x=anchor?anchor.x+anchor.width+32:area.left+20;
    const preferred=x;
    node.style.left=Math.max(8,Math.min(innerWidth-rect.width-8,preferred))+'px';
    node.style.top=Math.max(8,Math.min(innerHeight-rect.height-8,anchor?anchor.y+24:area.top+110))+'px';
  }
  function open(sideValue,group,konvaNode){
    side=sideValue;category=group;
    if(compact.matches){renderMobile();return;}
    const key=side+':'+group;let entry=panels.get(key);
    if(entry){entry.node.style.zIndex=String(++z);entry.node.focus();return;}
    clearPanels();
    const form=fieldPanel(side,group),node=document.createElement('section');node.className='floating-editor';node.tabIndex=-1;
    node.setAttribute('role','dialog');node.setAttribute('aria-label',form.body.querySelector('h3').textContent);node.style.zIndex=String(++z);
    const close=document.createElement('button');close.className='floating-close';close.type='button';close.innerHTML='<i class="bi bi-x" aria-hidden="true"></i>';close.setAttribute('aria-label','편집창 닫기');
    close.onclick=()=>{form.destroy();node.remove();panels.delete(key);};node.addEventListener('keydown',e=>{if(e.key==='Escape')close.click();});
    node.addEventListener('pointerdown',()=>node.style.zIndex=String(++z));
    node.append(close,form.body);document.body.append(node);form.mount();panels.set(key,{node,form});
    let anchor=null;if(konvaNode){const stage=konvaNode.getStage(),p=stage.getPointerPosition(),c=stage.container().getBoundingClientRect();if(p)anchor={x:c.left+p.x,y:c.top+p.y,width:0,height:0};}
    placePanel(node,anchor);node.focus();
    const handle=form.body.querySelector('h3');handle.classList.add('editor-drag-handle');handle.title='드래그하여 이동';handle.tabIndex=0;
    let drag=null;
    // 제목뿐 아니라 패널의 빈 공간·설명에서도 이동. 실제 조작 요소는 제외합니다.
    const controls='input,textarea,select,button,a,label,[contenteditable]:not([contenteditable="false"]),[role="button"]';
    node.addEventListener('pointerdown',e=>{
      if(e.button!==0||!e.isPrimary||drag||e.target.closest(controls))return;
      const r=node.getBoundingClientRect();
      // 패널 자체의 스크롤바 조작은 유지합니다.
      if(e.clientX>=r.left+node.clientLeft+node.clientWidth||e.clientY>=r.top+node.clientTop+node.clientHeight)return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top};
      node.setPointerCapture(e.pointerId);node.focus({preventScroll:true});e.preventDefault();
    });
    function move(left,top){node.style.left=Math.max(0,Math.min(innerWidth-node.offsetWidth,left))+'px';node.style.top=Math.max(0,Math.min(innerHeight-node.offsetHeight,top))+'px';}
    node.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id)return;
      node.classList.add('is-dragging');
      move(drag.left+e.clientX-drag.x,drag.top+e.clientY-drag.y);
    });
    const stopDrag=e=>{
      if(!drag||e.pointerId!==drag.id)return;
      drag=null;node.classList.remove('is-dragging');
      if(node.hasPointerCapture(e.pointerId))node.releasePointerCapture(e.pointerId);
    };
    node.addEventListener('pointerup',stopDrag);node.addEventListener('pointercancel',stopDrag);
    node.addEventListener('lostpointercapture',stopDrag);
    handle.addEventListener('keydown',e=>{const delta={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]}[e.key];if(delta){e.preventDefault();const r=node.getBoundingClientRect();move(r.left+delta[0],r.top+delta[1]);}});
  }
  document.addEventListener('pointerdown',e=>{
    if(eyedropper?.active||compact.matches||e.target.closest('.floating-editor,.pcr-app,dialog'))return;
    clearPanels();
  },true);
  function renderStickerList(){
    const target=host.querySelector('.sticker-list');if(!target)return;target.replaceChildren();
    const add=document.createElement('button');add.type='button';add.className='add-sticker';add.textContent='＋ 스티커 추가';add.onclick=chooseSticker;target.append(add);
    for(const item of store.state.stickers){
      const card=document.createElement('div');card.className='sticker-card';card.classList.toggle('selected',item.id===selection);
      const select=document.createElement('button');select.type='button';select.className='sticker-select';select.setAttribute('aria-label',item.name+' 선택');
      const img=document.createElement('img');img.src=item.src;img.alt=item.name;select.append(img);select.onclick=()=>{selection=item.id;stickers.select(item.id);renderStickerList();};
      const remove=document.createElement('button');remove.type='button';remove.className='sticker-list-delete';remove.textContent='×';remove.setAttribute('aria-label',item.name+' 삭제');remove.onclick=()=>stickers.remove(item.id);
      const shadow=document.createElement('button');shadow.type='button';shadow.className='sticker-shadow-toggle';shadow.textContent=item.shadow?'그림자 삭제':'그림자 추가';shadow.setAttribute('aria-pressed',String(!!item.shadow));shadow.onclick=()=>stickers.toggleShadow(item.id);
      card.append(select,remove,shadow);target.append(card);
    }
  }
  function renderMobile(){
    keyboard.close();
    normalizeSelection();
    categoryScroll=host.querySelector('.field-categories')?.scrollLeft ?? categoryScroll;
    const cleanup=mobileCleanup;mobileCleanup=()=>{};
    cleanup();host.replaceChildren();if(!compact.matches)return;
    const tabs=document.createElement('div');tabs.className='character-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','편집 대상');
    for(const tab of getTabs()){
      const b=document.createElement('button');b.type='button';b.textContent=tab.label;
      b.id='tab-'+tab.id;
      if(tab.type==='action'){
        b.setAttribute('aria-label',tab.ariaLabel||tab.label);
        b.onclick=async()=>{b.disabled=true;try{
          const next=await tab.onClick({store,open,chooseSticker});
          if(typeof next==='string')side=next;
          renderMobile();
        }catch(error){notify(error.message);}finally{b.disabled=false;}};
      }else{
        b.setAttribute('role','tab');b.setAttribute('aria-selected',String(side===tab.id));b.setAttribute('aria-controls','active-fields');
        b.onclick=()=>{side=tab.id;normalizeSelection();renderMobile();document.getElementById('tab-'+tab.id)?.focus();};
      }
      tabs.append(b);
    }
    host.append(tabs);const panel=document.createElement('div');panel.className='mobile-field-panel';panel.id='active-fields';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','tab-'+side);host.append(panel);
    if(getTabs().find(t=>t.id===side)?.type==='stickers'){
      const title=document.createElement('h3');title.textContent='스티커 목록';const note=document.createElement('p');note.textContent='☰ 버튼을 눌러 레이어를 조절 할 수 있어요.';
      const list=document.createElement('div');list.className='sticker-list';panel.append(title,note,list);renderStickerList();mobileCleanup=()=>{};
    }else{
      const categories=document.createElement('div');categories.className='field-categories';categories.setAttribute('aria-label','입력 항목');
      let drag=null,suppressClick=false;
      categories.addEventListener('pointerdown',e=>{
        if(e.pointerType!=='mouse'||e.button!==0)return;
        suppressClick=false;drag={x:e.clientX,left:categories.scrollLeft,id:e.pointerId};
      });
      categories.addEventListener('pointermove',e=>{
        if(!drag||e.pointerId!==drag.id)return;
        const dx=e.clientX-drag.x;
        if(!suppressClick&&Math.abs(dx)<5)return;
        suppressClick=true;categories.classList.add('is-dragging');
        if(!categories.hasPointerCapture(e.pointerId))categories.setPointerCapture(e.pointerId);
        categories.scrollLeft=drag.left-dx;e.preventDefault();
      });
      const endDrag=()=>{drag=null;categories.classList.remove('is-dragging');};
      categories.addEventListener('pointerup',endDrag);
      categories.addEventListener('pointercancel',endDrag);
      categories.addEventListener('lostpointercapture',endDrag);
      categories.addEventListener('pointerleave',()=>{if(!suppressClick)endDrag();});
      categories.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
      categories.addEventListener('dragstart',e=>e.preventDefault());
      categories.addEventListener('wheel',e=>{
        if(e.ctrlKey||categories.scrollWidth<=categories.clientWidth)return;
        const unit=e.deltaMode===1?16:e.deltaMode===2?categories.clientWidth:1;
        const delta=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*unit;
        if(!delta)return;e.preventDefault();categories.scrollLeft+=delta;
      },{passive:false});
      for(const [key,name] of getGroups(side)){const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed',String(key===category));b.onclick=()=>{category=key;renderMobile();};categories.append(b);}
      panel.append(categories);if(!category){mobileCleanup=()=>{};return;}const form=fieldPanel(side,category);panel.append(form.body);form.mount();mobileCleanup=()=>form.destroy();
      categories.scrollLeft=categoryScroll;
    }
  }
  async function chooseSticker(){
    const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';
    input.onchange=async()=>{try{const file=input.files[0];if(!file)return;const src=await readImage(file);await stickers.add(src,file.name);}catch(error){notify(error.message);}};input.click();
  }
  compact.addEventListener('change',()=>{clearPanels();renderMobile();});
  window.addEventListener('resize',()=>{for(const p of panels.values())placePanel(p.node);});
  store.subscribe((state,kind)=>{
    if(kind==='replace'||kind==='structure'){clearPanels();renderMobile();}
    if(kind==='images'||kind==='replace')document.querySelectorAll('[data-image-preview]').forEach(img=>{const src=state.images[img.dataset.imagePreview];img.hidden=!src;if(src)img.src=src;else img.removeAttribute('src');});
    if(kind==='stickers')renderStickerList();
  });
  renderMobile();
  return {open,chooseSticker,closeAll:clearPanels,selectSticker(id){selection=id;const tab=getTabs().find(t=>t.type==='stickers');if(compact.matches&&id&&tab){side=tab.id;renderMobile();}else renderStickerList();}};
}
