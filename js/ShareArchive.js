const LIMIT=80*1024*1024;
export function archiveName(){
  const title=window.editorTemplate?.title||document.querySelector('#editor-title').textContent||'페어틀';
  return (title.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/,'').slice(0,100)||'페어틀')+'.zip';
}
export function makeArchive(state){
  const F=window.fflate,manifest=structuredClone(state),files={},seen=new Map();let count=0,total=0;
  function asset(src){
    if(seen.has(src))return seen.get(src);
    const match=/^data:image\/(png|jpeg|webp);base64,([\s\S]+)$/.exec(src);
    if(!match)throw new Error('공유할 이미지 형식이 올바르지 않아요.');
    const binary=atob(match[2]),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    total+=bytes.length;if(total>LIMIT-1024*1024)throw new Error('공유 파일이 너무 커요. 이미지 수나 크기를 줄여주세요.');
    const path=`images/${++count}.${match[1]==='jpeg'?'jpg':match[1]}`;files[path]=bytes;seen.set(src,path);return path;
  }
  for(const key of Object.keys(manifest.images))manifest.images[key]=asset(manifest.images[key]);
  for(const sticker of manifest.stickers)sticker.src=asset(sticker.src);
  files['project.json']=F.strToU8(JSON.stringify({archiveVersion:1,state:manifest}));
  return new Blob([F.zipSync(files,{level:0})],{type:'application/zip'});
}
export async function readArchive(file){
  if(file.size>LIMIT)throw new Error('80MB 이하의 편집 파일을 선택해 주세요.');
  if(!file.name.toLowerCase().endsWith('.zip'))throw new Error('편집 ZIP 파일만 불러올 수 있어요.');
  const F=window.fflate;let total=0,count=0;
  const files=F.unzipSync(new Uint8Array(await file.arrayBuffer()),{filter(entry){
    if(entry.name!=='project.json'&&!/^images\/\d+\.(png|jpg|webp)$/.test(entry.name))return false;
    total+=entry.originalSize;count++;
    if(!Number.isFinite(total)||total>LIMIT||count>100)throw new Error('압축을 푼 파일의 크기나 개수가 너무 많아요.');
    return true;
  }});
  if(!files['project.json'])throw new Error('페어틀 편집 ZIP 파일이 아니에요.');
  const data=JSON.parse(F.strFromU8(files['project.json']));
  if(data.archiveVersion!==1||!data.state?.images||!Array.isArray(data.state.stickers))throw new Error('지원하지 않는 편집 ZIP 형식이에요.');
  const restored=new Map();
  async function asset(path){
    if(typeof path!=='string'||!/^images\/\d+\.(png|jpg|webp)$/.test(path)||!files[path])throw new Error('ZIP에 필요한 이미지가 없어요.');
    if(!restored.has(path))restored.set(path,new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('이미지를 읽지 못했어요.'));
      const ext=path.split('.').pop();reader.readAsDataURL(new Blob([files[path]],{type:'image/'+(ext==='jpg'?'jpeg':ext)}));
    }));return restored.get(path);
  }
  for(const key of Object.keys(data.state.images))data.state.images[key]=await asset(data.state.images[key]);
  for(const sticker of data.state.stickers)sticker.src=await asset(sticker.src);
  return data.state;
}
