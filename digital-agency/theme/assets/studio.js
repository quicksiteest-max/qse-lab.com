(() => {
  'use strict';
  const en=document.documentElement.lang==='en';
  const menu=document.querySelector('[data-menu-toggle]');
  const nav=document.querySelector('.site-nav');
  const close=()=>{if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');menu.textContent=en?'Menu':'Меню';nav.classList.remove('is-open');document.body.classList.remove('menu-open');};
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.textContent=en?(open?'Close':'Menu'):(open?'Закрыть':'Меню');nav?.classList.toggle('is-open',open);document.body.classList.toggle('menu-open',open);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();menu?.focus();}});
  nav?.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  const path=location.pathname.replace(/\/$/,'');
  document.querySelectorAll('.site-nav a').forEach(a=>{const u=new URL(a.href,location.href);if(path===u.pathname.replace(/\/$/,''))a.setAttribute('aria-current','page');});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if('IntersectionObserver' in window&&!reduced){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:0.06});
    document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('will-reveal');observer.observe(el);});
  }
  const filterButtons=[...document.querySelectorAll('[data-work-filter]')];
  filterButtons.forEach(button=>button.addEventListener('click',()=>{
    const value=en?({'брендинг':'branding','веб-дизайн':'web design'}[button.dataset.workFilter]||button.dataset.workFilter):button.dataset.workFilter;
    filterButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    let visible=0;
    document.querySelectorAll('.filterable .wp-block-post').forEach(card=>{
      const terms=card.querySelector('.taxonomy-form_discipline')?.textContent.toLowerCase()||'';
      const show=value==='all'||terms.includes(value);card.hidden=!show;if(show)visible++;
    });
    const status=document.querySelector('[data-filter-status]');if(status)status.textContent=en?`Projects shown: ${visible}`:`Показано проектов: ${visible}`;
  }));
  document.querySelectorAll('[data-demo-form]').forEach(form=>{form.querySelector('[data-demo-submit]')?.removeAttribute('disabled');form.addEventListener('submit',event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const status=form.querySelector('[role="status"]');status.textContent=en?'Thank you! This is a demo confirmation. Your details have not been sent or saved.':'Спасибо! Так выглядит подтверждение заявки. Это демоформа: данные никуда не отправлены и не сохранены.';
    form.reset();status.focus();
  });});
  document.querySelector('[data-back-top]')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced?'instant':'smooth'}));
})();
