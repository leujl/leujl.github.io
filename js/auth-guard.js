import { watchSession, logout } from './auth.js';
import { isTeacher, canAccessCourse } from './permissions.js';
import { siteUrl, message, clearPrivateContent } from './ui.js';
export function guard({teacher=false,courseId,onReady=()=>{}}={}) {
  let version = 0;
  window.addEventListener('private-content-cleared',()=>{version++;});
  return watchSession(state => {
    clearPrivateContent();
    const generation = ++version;
    if (state.error) {
      sessionStorage.setItem('authNotice',state.error);
      message(state.error);
      if (!state.user && !state.error.includes('尚未完成設定')) location.replace(siteUrl('login.html'));
      return;
    }
    if (!state.user) { location.replace(siteUrl('login.html')); return; }
    if ((teacher && !isTeacher(state.profile)) || (courseId && !canAccessCourse(state.profile,courseId))) {
      message('沒有此課程或頁面的使用權限。'); location.replace(siteUrl('dashboard/')); return;
    }
    document.querySelectorAll('[data-user-name]').forEach(el=>el.textContent=state.profile.name);
    document.querySelectorAll('[data-logout]').forEach(el=>{el.hidden=false;el.onclick=()=>logout().catch(()=>message('登出失敗，請重試。'));});
    Promise.resolve(onReady(state,()=>generation===version)).catch(()=>message('無法載入資料，請確認連線或洽老師。'));
  });
}


