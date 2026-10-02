// Trusted ADC-only initialization/recovery. No browser can modify the budget latch.
import { initializeApp, applicationDefault, getFirestore } from '../functions/admin-sdk.js';
import { billingMonth, openMaterials } from '../functions/budget-policy.js';
const projectId=process.env.FIREBASE_PROJECT_ID;
if(!projectId || process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Set the actual production project ID with emulator variables unset.');
const mode=process.argv[2];
if(!['initialize','resume'].includes(mode))throw new Error('Usage: node scripts/budget-service.mjs initialize|resume [--apply]');
initializeApp({credential:applicationDefault(),projectId});const db=getFirestore();
const month=billingMonth();
if(!process.argv.includes('--apply')){console.log('Dry run only. Project: '+projectId+', action: '+mode+', Pacific billing month: '+month);process.exit(0);}
await openMaterials(db,mode);
console.log('Material service enabled. Verify production Rules before using it.');
