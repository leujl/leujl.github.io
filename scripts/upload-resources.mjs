// Trusted local/Cloud Shell operation. Requires Application Default Credentials.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import { fileURLToPath } from 'node:url';
import { initializeApp, applicationDefault } from '../functions/admin-sdk.js';
import { getFirestore } from '../functions/admin-sdk.js';
import { getStorage } from '../functions/admin-sdk.js';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),privateRoot=path.join(root,'migration-private');
const projectId=process.env.FIREBASE_PROJECT_ID,bucketName=process.env.FIREBASE_STORAGE_BUCKET;
if(!projectId || !bucketName || process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST)throw new Error('Set production project and bucket; emulator variables must be unset.');
const manifest=JSON.parse(fs.readFileSync(path.join(privateRoot,'manifest.json')));
const dryRun=!process.argv.includes('--apply');
for(const resource of manifest.resources){const file=path.resolve(privateRoot,resource.storagePath);if(!file.startsWith(privateRoot+path.sep) || crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==resource.sha256)throw new Error('Missing or corrupt resource: '+resource.id);}
if(dryRun){console.log('Verified '+manifest.resources.length+' resources. No upload. Use --apply after checking project and bucket.');process.exit(0);}
initializeApp({credential:applicationDefault(),projectId,storageBucket:bucketName});const db=getFirestore(),bucket=getStorage().bucket();
const [policy]=await bucket.iam.getPolicy();
if((policy.bindings || []).some(binding=>binding.members?.some(member=>['allUsers','allAuthenticatedUsers'].includes(member))))throw new Error('Bucket has public IAM access. Remove public access before uploading protected content.');
const [bucketMetadata]=await bucket.getMetadata();
if((bucketMetadata.defaultObjectAcl || []).some(acl=>['allUsers','allAuthenticatedUsers'].includes(acl.entity)))throw new Error('Bucket default object ACL is public.');
for(const course of manifest.courses){const {id,...data}=course;await db.doc('courses/'+id).set(data);}
for(const resource of manifest.resources){
  const {id,...data}=resource;const file=bucket.file(resource.storagePath);
  await db.doc('resources/'+id).set({...data,active:false});
  const contentType=resource.type==='pdf'?'application/pdf':resource.filename.endsWith('.png')?'image/png':resource.filename.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8';
  await file.save(fs.readFileSync(path.join(privateRoot,resource.storagePath)),{resumable:false,metadata:{contentType,cacheControl:'private, no-store',metadata:{}}});
  // Ensure no legacy Firebase download token can bypass Security Rules.
  await file.setMetadata({metadata:{firebaseStorageDownloadTokens:null}});
  const [metadata]=await file.getMetadata();if((metadata.acl || []).some(acl=>['allUsers','allAuthenticatedUsers'].includes(acl.entity)))throw new Error('Object has public ACL: '+id);
  if(metadata.metadata?.firebaseStorageDownloadTokens)throw new Error('Download token still exists: '+id);
  await db.doc('resources/'+id).set(data);console.log('Uploaded '+id);
}
console.log('Upload complete. Verify Rules before switching the public website.');



