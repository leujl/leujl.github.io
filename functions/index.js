import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { randomUUID } from 'node:crypto';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { defineString } from 'firebase-functions/params';
import { budgetDecision, pauseMaterials } from './budget-policy.js';
import { validateStudent, validateUid } from './validation.js';
initializeApp();
const db=getFirestore(),auth=getAuth();
const options={region:'asia-east1',maxInstances:5,concurrency:20};
const budgetId=defineString('BUDGET_ID',{default:''});
const billingAccountId=defineString('BUDGET_BILLING_ACCOUNT_ID',{default:''});
export const pauseOnBudget=onMessagePublished({topic:'teaching-budget-alerts',region:'asia-east1',maxInstances:1,retry:true},async event=>{
  const decision=budgetDecision(event.data.message,{budgetId:budgetId.value(),billingAccountId:billingAccountId.value()});
  if(decision) await pauseMaterials(db,decision,FieldValue.serverTimestamp());
});
async function requireTeacher(request) {
  if(!request.auth) throw new HttpsError('unauthenticated','請先登入。');
  const token=request.rawRequest.headers.authorization?.replace(/^Bearer /,'');
  if(!token) throw new HttpsError('unauthenticated','請重新登入。');
  try { await auth.verifyIdToken(token,true); } catch { throw new HttpsError('unauthenticated','請重新登入。'); }
  const snapshot=await db.doc('users/'+request.auth.uid).get();
  const profile=snapshot.data();
  if(!profile?.active || !['teacher','admin'].includes(profile.role)) throw new HttpsError('permission-denied','沒有管理權限。');
  // Limit management requests per teacher; this collection is inaccessible to browser clients.
  const rate=db.doc('managementLimits/'+request.auth.uid);
  await db.runTransaction(async transaction=>{
    const previous=(await transaction.get(rate)).data(),now=Date.now();
    const fresh=!previous || now-previous.start>60000;
    if(!fresh && previous.count>=30) throw new HttpsError('resource-exhausted','操作過於頻繁，請稍後重試。');
    transaction.set(rate,{start:fresh?now:previous.start,count:fresh?1:previous.count+1});
  });
  return request.auth.uid;
}
async function studentData(data,creating) {
  const courses=await db.collection('courses').get();
  try { return validateStudent(data,courses.docs.map(doc=>doc.id),creating); }
  catch(error) { throw new HttpsError('invalid-argument',error.message); }
}
function uidValue(value) { try{return validateUid(value);}catch(error){throw new HttpsError('invalid-argument',error.message);} }
async function audit(actor,target,action) { await db.collection('auditLog').add({actor,target,action,createdAt:FieldValue.serverTimestamp()}); }
export const createStudent=onCall(options,async request=>{
  const actor=await requireTeacher(request),profile=await studentData(request.data,true);
  if(!/^[a-f0-9-]{36}$/.test(request.data.requestId || '')) throw new HttpsError('invalid-argument','缺少新增請求識別碼。');
  const uid='student-'+request.data.requestId,ref=db.doc('users/'+uid);
  try {
    await db.runTransaction(async transaction=>{
      if((await transaction.get(ref)).exists) throw new HttpsError('already-exists','此新增請求已處理，請重新載入學生列表。');
      transaction.create(ref,{...profile,uid,role:'student',authValidAfter:0,active:false,provisioning:true,createdAt:FieldValue.serverTimestamp()});
    });
    try {
      await auth.createUser({uid,email:profile.email,password:request.data.password,displayName:profile.name,disabled:!profile.active});
      await ref.update({active:profile.active,provisioning:FieldValue.delete()});
    } catch {
      // Fail closed; retain inactive profile if rollback cannot remove the Auth user.
      await auth.deleteUser(uid).catch(()=>{});
      await ref.update({active:false,provisioning:false}).catch(()=>{});
      throw new HttpsError('failed-precondition','新增未完成，請確認 Email 未重複並檢查後台設定。');
    }
    await audit(actor,uid,'createStudent');return {uid};
  } finally { if(request.data) request.data.password=undefined; }
});
async function lockStudent(uid,operation) {
  const ref=db.doc('users/'+uid);
  const previous=await db.runTransaction(async transaction=>{
    const snapshot=await transaction.get(ref),data=snapshot.data();
    if(!data || data.role!=='student') throw new HttpsError('permission-denied','僅能管理學生帳號。');
    if(data.managementOperation || data.provisioning) throw new HttpsError('aborted','帳號正在處理中，請稍後重試或洽管理員。');
    transaction.update(ref,{active:false,managementOperation:operation});return data;
  });
  return {ref,previous};
}
export const updateStudent=onCall(options,async request=>{
  const actor=await requireTeacher(request),uid=uidValue(request.data?.uid),profile=await studentData(request.data,false);
  const operation=randomUUID(),{ref}=await lockStudent(uid,operation);
  try {
    await auth.updateUser(uid,{email:profile.email,displayName:profile.name,disabled:!profile.active});
    await auth.revokeRefreshTokens(uid);
    await ref.update({...profile,authValidAfter:Math.floor(Date.now()/1000)+1,updatedAt:FieldValue.serverTimestamp(),managementOperation:FieldValue.delete()});
    await audit(actor,uid,'updateStudent');return {uid};
  } catch {
    await auth.updateUser(uid,{disabled:true}).catch(()=>{});
    await ref.update({active:false,managementOperation:FieldValue.delete()}).catch(()=>{});
    throw new HttpsError('failed-precondition','更新未完成；帳號維持停用，請修正資料後重試。');
  }
});
export const resetStudentAccess=onCall(options,async request=>{
  const actor=await requireTeacher(request),uid=uidValue(request.data?.uid);
  const {ref,previous}=await lockStudent(uid,randomUUID());
  try {
    await auth.revokeRefreshTokens(uid);
    const resetLink=await auth.generatePasswordResetLink(previous.email);
    await ref.update({active:previous.active,authValidAfter:Math.floor(Date.now()/1000)+1,managementOperation:FieldValue.delete()});
    await audit(actor,uid,'resetStudentAccess');
    // The teacher delivers this link privately; do not log or store it in Firestore.
    return {resetLink};
  } catch {
    await ref.update({active:false,managementOperation:FieldValue.delete()}).catch(()=>{});
    throw new HttpsError('failed-precondition','重設未完成，帳號維持停用，請洽管理員。');
  }
});


