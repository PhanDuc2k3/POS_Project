import { renderFooter } from './components/Footer.js';
import { renderHeader } from './components/Header.js';
import { renderHomePage } from './pages/HomePage.js';

const app = document.getElementById('app');

function render() {
  app.innerHTML = `
    ${renderHeader()}
    ${renderHomePage()}
    ${renderFooter()}
  `;
}

function bindEvents() {
  app.addEventListener('click', (event) => {
    const menuButton = event.target.closest('.menu-button');
    if (menuButton) {
      const isOpen = document.body.classList.toggle('nav-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      return;
    }

    if (event.target.closest('.site-nav a')) {
      document.body.classList.remove('nav-open');
      app.querySelector('.menu-button')?.setAttribute('aria-expanded', 'false');
    }
  });

  app.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;

    event.preventDefault();
    const message = form.querySelector('.form-message');
    const messages = {
      trial: 'Trial request created. Our team will contact you shortly.',
      contact: 'Sales request sent. Thank you.',
      signin: 'Demo sign-in submitted.',
    };

    if (message) message.textContent = messages[form.dataset.form] || 'Submitted.';
    form.reset();
  });
}

render();
bindEvents();
