(() => {
  const dialogs = document.querySelectorAll('.site-dialog');

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    const frame = dialog.querySelector('iframe[data-src]');
    if (frame && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
    dialog.showModal();
    document.body.classList.add('has-site-dialog');
  }

  document.querySelectorAll('[data-open-dialog]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openDialog(document.getElementById(trigger.dataset.openDialog));
    });
  });

  dialogs.forEach(dialog => {
    dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (dialog.id === 'bug-dialog') return;

      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (![...dialogs].some(item => item.open)) document.body.classList.remove('has-site-dialog');
    });
  });
})();
