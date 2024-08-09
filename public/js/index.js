import '@babel/polyfill';
import { login } from './login';
// import { displayMap } from './mapbox';
import { logout } from './login';
import { updateSettings, updatePassword } from './updateSettings.js';
import { bookTour } from './stripe.js';

const mapBox = document.getElementById('map');
const form = document.querySelector('.form');
const logoutBtn = document.querySelector('.nav__el--logout');
const formUserData = document.querySelector('.form-user-data');
const formUserPassword = document.querySelector('.form-user-settings');
const savePwdBtn = document.querySelector('.btn--save-pwd');
const bookBtn = document.getElementById('book-tour');

// if (mapBox) {
//   const locations = JSON.parse(mapBox.dataset.locations);
//   console.log('Hello ia m js from front end');
//   console.log(locations);
//   displayMap(locations);
// }
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (formUserData) {
  formUserData.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form);
  });
}

if (formUserPassword) {
  formUserPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    savePwdBtn.textContent = 'Updating password...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updatePassword(passwordCurrent, password, passwordConfirm);
    savePwdBtn.textContent = 'Save password';
  });
}
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    console.log('Hello from bookBtn');
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}
