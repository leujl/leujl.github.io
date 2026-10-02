// Only an exact, configured Cloud Billing budget may trigger the latch.
export function billingMonth(date=new Date()) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit'}).formatToParts(date);
  return parts.find(p=>p.type==='year').value+'-'+parts.find(p=>p.type==='month').value;
}
export function budgetDecision(message, config, now = new Date()) {
  const attributes = message.attributes || {};
  if (!config.budgetId || !config.billingAccountId) throw new Error('Budget identity is not configured');
  if (attributes.budgetId !== config.budgetId || attributes.billingAccountId !== config.billingAccountId || attributes.schemaVersion !== '1.0') return null;
  let data;
  try { data = message.json; } catch { return null; }
  if (!data || data.currencyCode !== 'USD' || data.budgetAmount !== 5 || data.budgetAmountType !== 'SPECIFIED_AMOUNT'
      || typeof data.costAmount !== 'number' || !Number.isFinite(data.costAmount) || data.costAmount < 5) return null;
  const start = new Date(data.costIntervalStart);
  if (!Number.isFinite(start.getTime()) || start > now) return null;
  // A delayed prior-month notification must not suspend a new month's service.
  const month = billingMonth(now);
  if (start.toISOString().slice(0, 7) !== month) return null;
  return {month, costAmount:data.costAmount, budgetUsd:5};
}

export async function pauseMaterials(db, decision, timestamp) {
  return db.runTransaction(async transaction => {
    const control = db.doc('serviceControl/budget');
    const previous = (await transaction.get(control)).data();
    if (previous?.paused && previous.month === decision.month) return false;
    const resources = await transaction.get(db.collection('resources'));
    // One atomic transaction: never report success after a partial lock.
    if (resources.size > 450) throw new Error('Resource count exceeds atomic budget-lock capacity');
    for (const resource of resources.docs) transaction.update(resource.ref, {budgetPaused:true});
    transaction.set(control, {...decision,paused:true,pausedAt:timestamp,message:'本月教材服務因預算限制暫停，請洽老師。'});
    return true;
  });
}

export async function openMaterials(db, mode, now=new Date()) {
  if(!['initialize','resume'].includes(mode))throw new Error('Invalid service-control operation');
  const month=billingMonth(now);
  await db.runTransaction(async transaction=>{
    const ref=db.doc('serviceControl/budget'),previous=(await transaction.get(ref)).data();
    if(mode==='initialize' && previous)throw new Error('Already initialized; refusing to overwrite the pause latch.');
    if(mode==='resume' && (!previous?.paused || !/^\d{4}-\d{2}$/.test(previous.month || '') || previous.month>=month))throw new Error('Resume is allowed only in a later Pacific billing month after a budget pause.');
    const resources=await transaction.get(db.collection('resources'));
    if(resources.size>450)throw new Error('More than 450 resources; requires an expanded locking architecture.');
    for(const resource of resources.docs)transaction.update(resource.ref,{budgetPaused:false});
    transaction.set(ref,{paused:false,budgetUsd:5,month,message:''});
  });
}
