import { guard } from './auth-guard.js';
import { isTeacher, safeCoursePath } from './permissions.js';
import { db } from './firebase.js';
import { doc, getDocFromServer, collection, getDocsFromServer } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { element, siteUrl, message } from './ui.js';
guard({onReady:async ({profile},valid)=>{
  document.querySelector('[data-admin-link]').hidden=!isTeacher(profile);
  const courses=isTeacher(profile) ? (await getDocsFromServer(collection(db,'courses'))).docs : await Promise.all((profile.courses || []).map(id=>getDocFromServer(doc(db,'courses',id)).catch(()=>null)));
  if(!valid()) return;
  const container=document.querySelector('#my-courses'); container.replaceChildren(); container.hidden=false;
  for(const snapshot of courses) {
    if(!snapshot?.exists()) continue; const course=snapshot.data(); if(!course.active && !isTeacher(profile)) continue;
    const card=element('article',undefined,'course-card'); card.append(element('p',String(course.chapterCount || '')+' 章','eyebrow'),element('h2',course.title),element('p',course.description));
    const link=element('a','進入課程 →','button primary'); link.href=siteUrl(safeCoursePath(snapshot.id));card.append(link);container.append(card);
  }
  message(container.children.length ? '' : '目前尚未授權課程，請洽老師。');
}});

