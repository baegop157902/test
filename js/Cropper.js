import { readImage } from './state.js';
export async function cropImage(file,position) {
  const src=await readImage(file);if(!src)return null;
  return new Promise((resolve,reject)=>{
    const dialog=document.createElement('dialog'); dialog.className='crop-dialog';
    dialog.innerHTML='<h2>이미지 자르기</h2><div class="crop-preview"><img alt="자를 이미지"></div><div class="dialog-actions"><button type="button" data-zoom-out disabled>축소</button><button type="button" data-zoom-in disabled>확대</button><button type="button" data-fit disabled>전체 맞추기</button><button type="button" data-rotate disabled>90° 회전</button></div><p>전체 맞추기를 누르면 이미지가 잘리지 않게 들어갑니다. 남는 여백은 투명하게 저장됩니다.</p><div class="dialog-actions"><button type="button" data-cancel>취소</button><button type="button" data-apply class="primary" disabled>적용</button></div>';
    document.body.append(dialog);dialog.showModal();
    const image=dialog.querySelector('img');let cropper=null,finished=false;
    function close(value,error){if(finished)return;finished=true;cropper?.destroy();dialog.close();dialog.remove();error?reject(error):resolve(value);}
    image.onload=()=>{
      // viewMode 1은 이미지가 자르기 영역보다 작아지지 못하게 제한합니다.
      cropper=new window.Cropper(image,{aspectRatio:position.width/position.height,viewMode:0,autoCropArea:1,dragMode:'move',background:true,ready(){dialog.querySelectorAll('button[disabled]').forEach(button=>button.disabled=false);}});
    };
    image.onerror=()=>close(null,new Error('이미지를 열 수 없어요.'));image.src=src;
    dialog.querySelector('[data-cancel]').onclick=()=>close(null);
    dialog.addEventListener('cancel',e=>{e.preventDefault();close(null);});
    dialog.querySelector('[data-rotate]').onclick=()=>cropper?.rotate(90);
    dialog.querySelector('[data-zoom-out]').onclick=()=>cropper?.zoom(-0.1);
    dialog.querySelector('[data-zoom-in]').onclick=()=>cropper?.zoom(0.1);
    dialog.querySelector('[data-fit]').onclick=()=>{
      const box=cropper.getCropBoxData(),canvas=cropper.getCanvasData(),image=cropper.getImageData();
      if(!canvas.width||!canvas.height)return;
      const factor=Math.min(box.width/canvas.width,box.height/canvas.height);
      cropper.zoomTo(image.width/image.naturalWidth*factor);
      const fitted=cropper.getCanvasData();
      cropper.setCanvasData({left:box.left+(box.width-fitted.width)/2,top:box.top+(box.height-fitted.height)/2});
    };
    dialog.querySelector('[data-apply]').onclick=()=>{
      try {
        const canvas=cropper.getCroppedCanvas({width:position.width,height:position.height,imageSmoothingEnabled:true,imageSmoothingQuality:'high'});
        if(!canvas)throw new Error('자르기에 실패했어요.');close(canvas.toDataURL('image/png'));
      }catch(error){close(null,error);}
    };
  });
}
