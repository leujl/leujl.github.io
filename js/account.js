import { guard } from './auth-guard.js';
import { changePassword } from './auth.js';
import { message } from './ui.js';
guard({onReady:()=>{document.querySelector('#password-form').hidden=false;}});
document.querySelector('#password-form').addEventListener('submit',async event=>{
  event.preventDefault(); const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;
  try { if(form.elements.newPassword.value!==form.elements.confirmPassword.value) throw new Error(); await changePassword(form.elements.currentPassword.value,form.elements.newPassword.value);message('密碼已更新。'); }
  catch { message('密碼更新失敗，請確認目前密碼、新密碼及連線。'); }
  finally { form.reset();button.disabled=false; }
});

