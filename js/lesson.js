import { guard } from './auth-guard.js';
import { fetchResource, blobUrl, revokeResources } from './resources.js';
import { message, siteUrl } from './ui.js';
const container=document.querySelector('#lesson-content');
guard({courseId:container.dataset.courseId,onReady:async({profile},valid)=>{
  const {resource,blob}=await fetchResource(container.dataset.resourceId,profile);
  if(resource.type!=='lesson' && resource.type!=='quiz')throw new Error('Invalid lesson');
  const parsed=new DOMParser().parseFromString(await blob.text(),'text/html');
  // Keep the existing HTML layout and native answer details; never execute uploaded script.
  parsed.querySelectorAll('script,iframe,object,embed,link,meta,base,form').forEach(el=>el.remove());
  for(const el of parsed.body.querySelectorAll('*'))for(const attr of [...el.attributes]) {
    if(attr.name.startsWith('on') || attr.name==='srcdoc' || (['href','src','action'].includes(attr.name) && /^\s*(javascript|data):/i.test(attr.value)))el.removeAttribute(attr.name);
  }
  for(const img of parsed.querySelectorAll('img[data-protected-image]')) {
    const image=await fetchResource(img.dataset.protectedImage,profile);if(!valid())return;
    if(image.resource.type!=='image' || image.resource.courseId!==resource.courseId)throw new Error('Invalid image');
    img.src=blobUrl(image.blob);
  }
  if(!valid()){revokeResources();return;}
  container.replaceChildren(...parsed.body.childNodes);container.hidden=false;message('');
  for(const link of container.querySelectorAll('a[href]'))if(link.getAttribute('href').startsWith('SITE:'))link.href=siteUrl(link.getAttribute('href').slice(5));
}});

