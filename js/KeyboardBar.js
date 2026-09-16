export function createKeyboardBar(host){
  const mobile=matchMedia('(max-width:768px)'),viewport=window.visualViewport;
  const bar=document.createElement('section');bar.className='keyboard-bar';bar.hidden=true;bar.setAttribute('aria-label','모바일 텍스트 입력');
  const title=document.createElement('span');title.className='keyboard-bar-title';
  const row=document.createElement('div');row.className='keyboard-bar-row';
  const done=document.createElement('button');done.type='button';done.innerHTML='<i class="bi bi-check2" aria-hidden="true"></i>';done.setAttribute('aria-label','입력 완료');done.className='keyboard-bar-done';
  row.append(title,done);bar.append(row);document.body.append(bar);
  let active=null,frame=0,baseline=0,sawKeyboard=false;

  function position(){
    if(!active)return;
    const height=viewport?.height||innerHeight,top=viewport?.offsetTop||0;
    if((viewport?.scale||1)===1){
      if(baseline-height>100)sawKeyboard=true;
      else if(sawKeyboard&&baseline-height<60){close();return;}
    }
    bar.style.width=(viewport?.width||innerWidth)+'px';bar.style.left=(viewport?.offsetLeft||0)+'px';
    bar.style.top=Math.max(top,top+height-bar.offsetHeight)+'px';
  }
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(position);}
  function fitText(){
    if(active?.input.tagName==='TEXTAREA'){
      active.input.style.height='auto';active.input.style.height=(active.input.scrollHeight+2)+'px';
    }
    schedule();
  }
  function close(){
    if(!active)return;const current=active;active=null;
    current.input.removeEventListener('input',fitText);
    current.input.style.height=current.height;
    if(current.rows!==null)current.input.setAttribute('rows',current.rows);
    if(current.placeholder.isConnected)current.placeholder.replaceWith(current.input);else current.input.remove();
    current.input.blur();bar.hidden=true;document.body.classList.remove('keyboard-editing');
  }
  function open(input){
    if(active?.input===input)return;close();
    const label=input.closest('.field-row')?.querySelector('span')?.textContent||'텍스트';
    const placeholder=document.createElement('span');placeholder.className='keyboard-input-placeholder';placeholder.textContent='아래 입력바에서 편집 중';
    const start=input.selectionStart,end=input.selectionEnd;
    active={input,placeholder,height:input.style.height,rows:input.getAttribute('rows')};baseline=viewport?.height||innerHeight;sawKeyboard=false;
    title.textContent=label;input.setAttribute('aria-label',label);input.replaceWith(placeholder);
    bar.hidden=false;row.prepend(input);document.body.classList.add('keyboard-editing');
    if(input.tagName==='TEXTAREA')input.rows=1;
    input.addEventListener('input',fitText);fitText();position();
    input.focus({preventScroll:true});if(start!==null)input.setSelectionRange(start,end);schedule();
  }

  bar.addEventListener('keydown', e => {
    if (!active) return;

    if (e.key === 'Enter') {
      if (active.input.tagName !== 'TEXTAREA') {
        e.preventDefault();
        close();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const focusables = Array.from(host.querySelectorAll('input[type="text"], textarea, .keyboard-input-placeholder'))
        .filter(el => el === active.placeholder || el.offsetParent !== null);

      const currentIndex = focusables.indexOf(active.placeholder);
      if (currentIndex !== -1) {
        const nextIndex = currentIndex + (e.shiftKey ? -1 : 1);

        if (nextIndex >= 0 && nextIndex < focusables.length) {
          focusables[nextIndex].focus();
        } else {
          close();
        }
      }
    }
  });

  document.addEventListener('focusin',e=>{
    if(mobile.matches&&host.contains(e.target)&&e.target.matches('input[type="text"],textarea'))open(e.target);
  });
  bar.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(active&&!bar.contains(document.activeElement))close();}));
  done.onclick=close;
  viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);
  window.addEventListener('resize',schedule);
  mobile.addEventListener('change',()=>{if(!mobile.matches)close();});
  new ResizeObserver(schedule).observe(bar);
  return {close};
}