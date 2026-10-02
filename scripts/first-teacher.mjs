import { initializeApp, applicationDefault, getAuth, getFirestore, FieldValue } from '../functions/admin-sdk.js';
const [uid]=process.argv.slice(2),projectId=process.env.FIREBASE_PROJECT_ID;
if(!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(uid) || !projectId)throw new Error('Usage: FIREBASE_PROJECT_ID=... node scripts/first-teacher.mjs AUTH_UID');
if(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST)throw new Error('Unset emulator variables for the production bootstrap.');
initializeApp({credential:applicationDefault(),projectId});
const user=await getAuth().getUser(uid);if(user.disabled)throw new Error('Enable the Auth account first.');
const db=getFirestore(),teachers=await db.collection('users').where('role','in',['teacher','admin']).limit(1).get();
if(!teachers.empty)throw new Error('A teacher already exists. Use Firebase Console for reviewed admin recovery.');
await db.doc('users/'+uid).create({uid,name:user.displayName || '老師',email:user.email,studentId:'',className:'',role:'teacher',active:true,courses:[],authValidAfter:0,createdAt:FieldValue.serverTimestamp()});
console.log('First teacher created. No password was stored in Firestore.');

