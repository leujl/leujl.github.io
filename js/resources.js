import { doc, getDocFromServer } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { ref, getBlob } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';
import { db, storage } from './firebase.js';
import { canAccessResource } from './permissions.js';
const urls=new Set();
export function blobUrl(blob){const url=URL.createObjectURL(blob);urls.add(url);return url;}
export async function fetchResource(id,profile) {
  if(!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid resource');
  const snapshot=await getDocFromServer(doc(db,'resources',id));
  if(!snapshot.exists() || !canAccessResource(profile,snapshot.data())) throw new Error('Permission denied');
  const resource=snapshot.data();
  const expected='protected/'+resource.courseId+'/'+id+'/';
  if(!resource.storagePath.startsWith(expected) || resource.storagePath.slice(expected.length).includes('/')) throw new Error('Invalid storage path');
  const blob=await getBlob(ref(storage,resource.storagePath),50*1024*1024);
  return {resource,blob};
}
export function revokeResources(){for(const url of urls)URL.revokeObjectURL(url);urls.clear();}
window.addEventListener('private-content-cleared',revokeResources);

