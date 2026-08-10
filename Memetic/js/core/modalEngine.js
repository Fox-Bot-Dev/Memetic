/* ==========================================================================
   MEMETIC DYNAMIC MODAL ENGINE
   ========================================================================== */

export function openModal(title, bodyHTML, buttons) {
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');
  const overlay = document.getElementById('customModalOverlay');

  if (!overlay) return;

  if (modalTitle) modalTitle.innerText = title;
  if (modalBody) modalBody.innerHTML = bodyHTML;
  
  if (footer) {
    footer.innerHTML = '';
    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.innerText = btn.label;
      b.onclick = () => { 
        closeModal(); 
        if (btn.onclick) btn.onclick(); 
      };
      footer.appendChild(b);
    });
  }

  overlay.classList.add('open');
}

export function closeModal() { 
  const overlay = document.getElementById('customModalOverlay');
  if (overlay) overlay.classList.remove('open'); 
}

export function alertModal(msg, title = "Memetic Core") { 
  openModal(title, `<p style="line-height:1.4;">${msg}</p>`, [{ label: "OK", onclick: () => {} }]); 
}

export function confirmModal(msg, title, onConfirm) { 
  openModal(title, `<p style="line-height:1.4;">${msg}</p>`, [
    { label: "Cancel", onclick: () => {} }, 
    { label: "Confirm", onclick: onConfirm }
  ]); 
}