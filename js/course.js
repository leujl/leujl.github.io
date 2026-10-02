import { guard } from './auth-guard.js';
const container=document.querySelector('[data-course-content]');
guard({courseId:container.dataset.courseContent,onReady:()=>{container.hidden=false;}});


window.addEventListener('private-content-cleared',()=>{container.hidden=true;});

