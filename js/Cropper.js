import { readImage } from './state.js';
export async function cropImage(file,position) {
  const src=await readImage(file);if(!src)return null;
  return new Promise((resolve,reject)=>{
    const dialog=document.createElement('dialog'); dialog.className='crop-dialog';
    dialog.innerHTML='<h2>이미지 자르기</h2><div class="crop-preview"><img alt="자를 이미지"></div><div class="dialog-actions"><button type="button" data-rotate>90° 회전</button><button type="button" data-cancel>취소</button><button type="button" data-apply class="primary" disabled>적용</button></div>';
    document.body.append(dialog);dialog.showModal();
    const image=dialog.querySelector('img');let cropper=null,finished=false;
    function close(value,error){if(finished)return;finished=true;cropper?.destroy();dialog.close();dialog.remove();error?reject(error):resolve(value);}
    image.onload=()=>{
      cropper=new window.Cropper(image,{aspectRatio:position.width/position.height,viewMode:1,autoCropArea:1,dragMode:'move',background:true,ready(){dialog.querySelector('[data-apply]').disabled=false;}});
    };
    image.onerror=()=>close(null,new Error('이미지를 열 수 없어요.'));image.src=src;
    dialog.querySelector('[data-cancel]').onclick=()=>close(null);
    dialog.addEventListener('cancel',e=>{e.preventDefault();close(null);});
    dialog.querySelector('[data-rotate]').onclick=()=>cropper?.rotate(90);
    dialog.querySelector('[data-apply]').onclick=()=>{
      try {
        const canvas=cropper.getCroppedCanvas({width:position.width,height:position.height,imageSmoothingEnabled:true,imageSmoothingQuality:'high'});
        if(!canvas)throw new Error('자르기에 실패했어요.');close(canvas.toDataURL('image/png'));
      }catch(error){close(null,error);}
    };
  });
}
