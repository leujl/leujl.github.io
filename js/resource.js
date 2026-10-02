import { guard } from './auth-guard.js';
import { fetchResource, blobUrl } from './resources.js';
import { element, message } from './ui.js';
guard({onReady:async({profile},valid)=>{
  const id=new URLSearchParams(location.search).get('id');const {resource,blob}=await fetchResource(id,profile);
  if(resource.type!=='pdf')throw new Error('Invalid PDF');if(!valid())return;
  const url=blobUrl(blob),container=document.querySelector('#resource-content');
  document.querySelector('#resource-title').textContent=resource.title;
  const open=element('a','線上閱讀','button ghost');open.href=url;open.target='_blank';open.rel='noopener';
  const download=element('a','下載 PDF','button primary');download.href=url;download.download=resource.filename || 'lesson.pdf';
  container.replaceChildren(open,download);container.hidden=false;message('');
}});

