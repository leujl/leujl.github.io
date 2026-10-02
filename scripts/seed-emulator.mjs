import fs from 'node:fs';import path from 'node:path';import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { initializeApp, getAuth, getFirestore, getStorage } from '../functions/admin-sdk.js';
if(!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST)throw new Error('All three emulators must be running.');
initializeApp({projectId:'demo-teaching-auth',storageBucket:'demo-teaching-auth.appspot.com'});
const db=getFirestore(),auth=getAuth(),accounts=[];
await db.doc('serviceControl/budget').set({paused:false,budgetUsd:5});
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
for(const [uid,email,role,courses] of [['teacher','teacher@example.test','teacher',[]],['student-a','student-a@example.test','student',['digital-logic']],['student-b','student-b@example.test','student',['digital-logic','electronics-2']]]){
 const password=randomBytes(18).toString('base64url');await auth.deleteUser(uid).catch(()=>{});await auth.createUser({uid,email,password});await db.doc('users/'+uid).set({uid,email,name:uid,studentId:uid,className:'測試班',role,active:true,courses,authValidAfter:0});accounts.push({email,password,uid});console.log('Created emulator account '+email);
}
for(const id of ['digital-logic','electronics-2'])await db.doc('courses/'+id).set({title:id==='digital-logic'?'數位邏輯設計':'電子學（下冊）',active:true,chapterCount:id==='digital-logic'?8:11,description:'本機測試課程'});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'migration-private/manifest.json')));
for(const course of manifest.courses){const {id,...data}=course;await db.doc('courses/'+id).set(data);}
for(const resource of manifest.resources){const {id,...data}=resource;await db.doc('resources/'+id).set({...data,budgetPaused:false});await getStorage().bucket().file(resource.storagePath).save(fs.readFileSync(path.join(root,'migration-private',resource.storagePath)),{resumable:false,metadata:{contentType:resource.type==='pdf'?'application/pdf':resource.filename.endsWith('.png')?'image/png':'text/html',cacheControl:'private, no-store'}});}
fs.writeFileSync(path.join(root,'migration-private/emulator-accounts.json'),JSON.stringify(accounts));
console.log('Only local emulator accounts and resources created. Credentials are in gitignored migration-private/emulator-accounts.json.');


