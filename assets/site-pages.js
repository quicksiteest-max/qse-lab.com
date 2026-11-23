const servicesMenu = document.querySelector('.qse-site-services');

if (servicesMenu) {
  document.addEventListener('click', event => {
    if (!servicesMenu.contains(event.target)) servicesMenu.open = false;
  });

  servicesMenu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && servicesMenu.open) {
      servicesMenu.open = false;
      servicesMenu.querySelector('summary').focus();
    }
  });
}

const projectForm = document.forms['project-request'];
if (projectForm) {
  const project = new URLSearchParams(location.search).get('project');
  const projectType = projectForm.elements.project_type;
  const budget = projectForm.elements.budget;

  if (project && [...projectType.options].some(option => option.value === project)) {
    projectType.value = project;
    if ([...budget.options].some(option => option.value === project)) budget.value = project;

    document.querySelectorAll('.language-switcher a').forEach(link => {
      const target = new URL(link.href);
      target.searchParams.set('project', project);
      link.href = target.href;
    });
  }

  try { localStorage.setItem('quicksite-language', document.documentElement.lang); } catch { /* Storage may be disabled. */ }
}
