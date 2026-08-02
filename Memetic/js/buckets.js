/* ==========================================================================
   NOMICON BUCKET INVOCATION HANDLER
   ========================================================================== */

export function loadBucket(bucketType) {
  console.log(`[Nomicon] Invoking ${bucketType} thought-scroll...`);
  
  // Visual feedback that the bucket is active
  const badge = document.getElementById('autosaveBadge');
  if (badge) {
    badge.innerText = `🟢 ${bucketType.toUpperCase()} Active`;
    badge.style.opacity = '1';
  }
}