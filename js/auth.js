import { onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, sendPasswordResetEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { auth, db, configurationError } from './firebase.js';
import { clearPrivateContent, siteUrl } from './ui.js';
let current = null, settled = false, stopProfile, lastError;
const listeners = new Set();
function publish(state) { current = state; settled = true; listeners.forEach(fn => fn(state)); }
if (auth) onAuthStateChanged(auth, user => {
  stopProfile?.(); clearPrivateContent();
  if (!user) return publish({user:null,profile:null,error:lastError});
  settled = false;
  stopProfile = onSnapshot(doc(db,'users',user.uid), {includeMetadataChanges:true}, snapshot => {
    // Never authorize using offline cached role or enrollment data.
    if (snapshot.metadata.fromCache) return;
    const profile = snapshot.exists() ? {...snapshot.data(),uid:user.uid} : null;
    if (!profile || profile.active !== true || (profile.authValidAfter || 0) > Math.floor(Date.parse(user.metadata.lastSignInTime)/1000)) {
      clearPrivateContent();
      lastError=!profile ? '帳號尚未取得教材權限，請洽老師。' : profile.active!==true ? '此帳號目前已停用，請洽老師。' : '登入權限已更新，請重新登入。';
      publish({user:null,profile:null,error:lastError});
      void signOut(auth);
      return;
    }
    publish({user,profile});
  }, () => { clearPrivateContent(); publish({user:null,profile:null,error:'無法確認帳號權限，請重新登入。'}); void signOut(auth); });
});
export function watchSession(fn) {
  listeners.add(fn); if(configurationError) fn({error:configurationError}); else if(settled) fn(current);
  return () => listeners.delete(fn);
}
export function waitSession() { return new Promise(resolve => { let stop; stop = watchSession(state => { resolve(state); queueMicrotask(() => stop?.()); }); }); }
export async function login(email,password,remember) {
  if (!auth) throw new Error(configurationError);
  lastError=undefined; settled=false;
  await setPersistence(auth,remember ? browserLocalPersistence : browserSessionPersistence);
  await signInWithEmailAndPassword(auth,email,password);
}
export async function logout() { clearPrivateContent(); await signOut(auth); location.assign(siteUrl('login.html')); }
export async function resetPassword(email) {
  if (!auth) throw new Error(configurationError);
  try { await sendPasswordResetEmail(auth,email); } catch (error) {
    if (['auth/network-request-failed','auth/too-many-requests'].includes(error.code)) throw error;
  }
}
export async function changePassword(currentPassword,newPassword) {
  await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(auth.currentUser.email,currentPassword));
  await updatePassword(auth.currentUser,newPassword);
}
// Clear already loaded content when a tab is restored, offline, or identity changes.
window.addEventListener('offline',clearPrivateContent);
window.addEventListener('pagehide',clearPrivateContent);
window.addEventListener('pageshow',event => { if(event.persisted) location.reload(); });



window.addEventListener('online',()=>location.reload());

