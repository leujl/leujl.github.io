import { login, resetPassword, waitSession } from './auth.js';
import { configurationError } from './firebase.js';
import { message, siteUrl } from './ui.js';
const form=document.querySelector('#login-form');
message(sessionStorage.getItem('authNotice') || configurationError); sessionStorage.removeItem('authNotice');
if (configurationError) form.querySelector('button[type=submit]').disabled=true;
form.addEventListener('submit',async event=>{
  event.preventDefault(); const button=form.querySelector('button[type=submit]'); button.disabled=true;
  const password=form.elements.password.value;
  try {
    await login(form.elements.email.value.trim(),password,form.elements.remember.checked);
    form.elements.password.value='';
    const state=await waitSession();
    if(state.profile) location.assign(siteUrl('dashboard/')); else message(state.error || '帳號尚未取得教材權限，請洽老師。');
  } catch(error) { message(configurationError || (error.code==='auth/network-request-failed' ? '連線失敗，請稍後重試。' : '帳號或密碼錯誤，或暫時無法登入。')); }
  finally { form.elements.password.value=''; button.disabled=Boolean(configurationError); }
});
document.querySelector('#reset-form').addEventListener('submit',async event=>{
  event.preventDefault(); const form=event.currentTarget; const button=form.querySelector('button'); button.disabled=true;
  try { await resetPassword(form.elements.email.value.trim()); message('如果帳號存在，系統將寄送密碼重設說明。'); }
  catch { message(configurationError || '暫時無法處理，請稍後重試。'); }
  finally { button.disabled=false; }
});

