import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';
import { getFunctions, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-functions.js';
import { firebaseConfig, functionsRegion, useEmulators } from './firebase-config.js';
export let auth, db, storage, functions;
export let configurationError = '';
if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId || !firebaseConfig?.storageBucket || !firebaseConfig?.authDomain) {
  configurationError = '網站登入服務尚未完成設定，請洽老師。';
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app); db = getFirestore(app); storage = getStorage(app);
  functions = getFunctions(app, functionsRegion);
  if (useEmulators) {
    if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Emulators require localhost');
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }
}

