// 저장 형식은 HTML이 아닌 줄별 텍스트 조각입니다. 같은 서식의 인접 조각은 합칩니다.
export const DEFAULT_COLOR = '#363636';
const HEX = /^#[0-9a-f]{6}$/i;
export function plainDocument(text) {
  return {lines:String(text).replace(/\r\n?/g,'\n').split('\n').map(text=>({runs:text?[{text,bold:false,color:DEFAULT_COLOR}]:[]}))};
}
export function documentText(doc){return doc.lines.map(line=>line.runs.map(run=>run.text).join('')).join('\n');}
export function validateDocument(doc,text){
  if(!doc||!Array.isArray(doc.lines)||!doc.lines.length||doc.lines.length>1001)throw new Error('성향 텍스트의 줄 정보가 올바르지 않아요.');
  let count=0;
  const lines=doc.lines.map(line=>{
    if(!line||!Array.isArray(line.runs))throw new Error('성향 텍스트의 서식이 올바르지 않아요.');
    const runs=[];
    for(const run of line.runs){
      if(++count>2000||!run||typeof run.text!=='string'||/[\r\n]/.test(run.text)||run.text.length>1000||typeof run.bold!=='boolean'||!HEX.test(run.color))throw new Error('성향 텍스트의 서식이 올바르지 않아요.');
      append(runs,{text:run.text,bold:run.bold,color:run.color.toLowerCase()});
    }
    return {runs};
  });
  const next={lines};if(documentText(next)!==text)throw new Error('성향 텍스트와 서식 정보가 일치하지 않아요.');return next;
}
function append(runs,run){
  if(!run.text)return;
  const last=runs.at(-1);
  if(last&&last.bold===run.bold&&last.color===run.color)last.text+=run.text;else runs.push({...run});
}
function colorHex(color,fallback){
  if(HEX.test(color))return color.toLowerCase();
  const match=/^rgb\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)\s*\)$/.exec(color);
  return match?'#'+match.slice(1).map(n=>Math.min(255,Number(n)).toString(16).padStart(2,'0')).join(''):fallback;
}
// Enter·붙여넣기로 생긴 div·p·br을 명시적인 줄바꿈으로 변환합니다.
export function readEditor(root){
  function walk(node,style){
    if(node.nodeType===3)return [{text:node.nodeValue.replace(/\u00a0/g,' '),...style}];
    if(node.nodeType!==1&&node.nodeType!==11)return [];
    if(node.nodeName==='BR')return [{text:'\n',...style}];
    if(['SCRIPT','STYLE'].includes(node.nodeName))return [];
    const weight=node.style?.fontWeight;
    style={bold:weight?weight==='bold'||Number(weight)>=600:style.bold||['B','STRONG'].includes(node.nodeName),
      color:colorHex(node.style?.color||node.getAttribute?.('color')||'',style.color)};
    const out=[];let previousBlock=false,seen=false;
    const children=[...node.childNodes];
    if(children.length===1&&children[0].nodeName==='BR')return [];
    for(const child of children){
      const block=['DIV','P','LI'].includes(child.nodeName);
      if(seen&&(block||previousBlock))append(out,{text:'\n',...style});
      for(const run of walk(child,style))append(out,run);
      previousBlock=block;seen=true;
    }
    return out;
  }
  const lines=[{runs:[]}];
  for(const run of walk(root,{bold:false,color:DEFAULT_COLOR})){
    run.text.split('\n').forEach((text,i)=>{if(i)lines.push({runs:[]});append(lines.at(-1).runs,{...run,text});});
  }
  return {lines};
}
function writeEditor(editor,doc){
  editor.replaceChildren();
  for(const line of doc.lines){
    const div=document.createElement('div');
    for(const run of line.runs){const span=document.createElement('span');span.textContent=run.text;span.style.fontWeight=run.bold?'700':'400';span.style.color=run.color;div.append(span);}
    if(!div.childNodes.length)div.append(document.createElement('br'));editor.append(div);
  }
}

export function createRichTextField(store,field){
  const body=document.createElement('div');body.className='rich-text-field';
  const toolbar=document.createElement('div');toolbar.className='rich-text-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label',field.label+' 글자 서식');
  const bold=document.createElement('button');bold.type='button';bold.textContent='굵게';bold.setAttribute('aria-pressed','false');
  const colorLabel=document.createElement('label');colorLabel.className='rich-text-color';colorLabel.append(document.createTextNode('색상'));
  const color=document.createElement('input');color.type='color';color.value=DEFAULT_COLOR;color.setAttribute('aria-label',field.label+' 선택 글자 색상');colorLabel.append(color);
  const resetColor=document.createElement('button');resetColor.type='button';resetColor.textContent='기본색상';
  toolbar.append(bold,colorLabel,resetColor);
  const editor=document.createElement('div');editor.contentEditable='true';editor.dataset.richEditor=field.id;editor.className='rich-text-editor';editor.setAttribute('role','textbox');editor.setAttribute('aria-label',field.label);editor.setAttribute('aria-multiline','true');editor.spellcheck=false;
  const note=document.createElement('p');note.className='rich-text-note';note.textContent='글자를 선택한 뒤 굵게 또는 색상을 적용하세요. (최대 1,000자)';note.setAttribute('role','status');
  body.append(toolbar,editor,note);
  let savedRange=null,composing=false,lastDoc=store.state.richText?.[field.id]||plainDocument(store.state.values[field.id]);
  writeEditor(editor,lastDoc);
  function capture(){const selection=getSelection();if(selection?.rangeCount&&editor.contains(selection.anchorNode)&&editor.contains(selection.focusNode))savedRange=selection.getRangeAt(0).cloneRange();return savedRange;}
  function restore(){editor.focus({preventScroll:true});if(savedRange){const selection=getSelection();selection.removeAllRanges();selection.addRange(savedRange);}}
  editor.richSelection={
    capture(){const range=capture();return range?{start:range.startContainer,startOffset:range.startOffset,end:range.endContainer,endOffset:range.endOffset}:null;},
    restore(saved){if(saved&&editor.contains(saved.start)&&editor.contains(saved.end)){savedRange=document.createRange();savedRange.setStart(saved.start,saved.startOffset);savedRange.setEnd(saved.end,saved.endOffset);}restore();}
  };
  function commit(){
    if(composing)return;
    const doc=readEditor(editor),text=documentText(doc);
    if(text.length>1000){writeEditor(editor,lastDoc);savedRange=null;note.textContent='성향은 1,000자까지 입력할 수 있어요.';return;}
    lastDoc=doc;
    store.change(s=>{s.values[field.id]=text;(s.richText??={})[field.id]=doc;(s.touched??={})[field.id]=true;});capture();
  }
  function format(command,value){
    if(!savedRange){editor.focus({preventScroll:true});capture();}
    if(!savedRange)return;
    restore();document.execCommand(command,false,value);commit();capture();
    bold.setAttribute('aria-pressed',String(document.queryCommandState('bold')));
  }
  // 브라우저 편집 명령을 사용하여 IME, 선택 영역, 기본 실행 취소를 유지합니다.
  bold.addEventListener('pointerdown',e=>{capture();e.preventDefault();});bold.onclick=()=>format('bold');
  color.addEventListener('pointerdown',capture);color.oninput=()=>format('foreColor',color.value);
  resetColor.addEventListener('pointerdown',e=>{capture();e.preventDefault();});
  resetColor.onclick=()=>{color.value=DEFAULT_COLOR;format('foreColor',DEFAULT_COLOR);};
  editor.addEventListener('input',commit);
  editor.addEventListener('compositionstart',()=>composing=true);
  editor.addEventListener('compositionend',()=>{composing=false;commit();});
  editor.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain').replace(/\r\n?/g,'\n'));commit();});
  editor.addEventListener('drop',e=>e.preventDefault());
  editor.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='b'){e.preventDefault();capture();format('bold');}});
  const selected=()=>{capture();if(document.activeElement===editor)bold.setAttribute('aria-pressed',String(document.queryCommandState('bold')));};
  return {body,mount(){document.addEventListener('selectionchange',selected);return ()=>document.removeEventListener('selectionchange',selected);}};
}
