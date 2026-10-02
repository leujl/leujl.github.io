import { guard } from './auth-guard.js';
import { isTeacher } from './permissions.js';
import { db } from './firebase.js';
import { collection, query, where, getDocsFromServer } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { element, siteUrl, message } from './ui.js';
const container=document.querySelector('#resource-list');
guard({onReady:async({profile},valid)=>{
  const resources=collection(db,'resources');
  const snapshots=isTeacher(profile)?[await getDocsFromServer(resources)]:await Promise.all((profile.courses || []).map(id=>getDocsFromServer(query(resources,where('courseId','==',id),where('visibility','==','student'),where('active','==',true)))));
  if(!valid())return;container.replaceChildren();container.hidden=false;
  const mode=container.dataset.mode;
  for(const snapshot of snapshots)for(const doc of snapshot.docs){const resource=doc.data();if(mode==='downloads'?resource.type!=='pdf':!(resource.type==='quiz'||(resource.type==='pdf'&&resource.filename.includes('question-bank'))))continue;
    const card=element('article',undefined,'download-row available');const content=element('div');content.append(element('b',resource.title),element('small',resource.courseId+(resource.visibility==='teacher'?' · 教師版':'')));const link=element('a',resource.type==='pdf'?'開啟教材':'開始練習','button primary');link.href=siteUrl(resource.type==='pdf'?'resource.html?id='+doc.id:resource.originalPath);card.append(content,link);container.append(card);
  }
  message(container.children.length?'':'目前沒有可使用的資源。');
}});

