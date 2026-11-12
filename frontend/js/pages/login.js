import { api } from '../core/api.js';
import { getToken, saveSession } from '../core/session.js';

if (getToken()) location.replace('app.html');

const form = document.getElementById('login-form');
const errorEl = document.getElementById('login-error');

async function submit(email, password) {
  errorEl.classList.add('hidden');
  const btn = form.querySelector('[type=submit]');
  btn.disabled = true;
  try {
    saveSession(await api.post('/auth/login', { email, password }));
    location.replace('app.html');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  submit(form.email.value, form.password.value);
});
