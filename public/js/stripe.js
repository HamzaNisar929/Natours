const { default: Stripe } = require('stripe');
import { showAlert } from './alert';
import axios from 'axios';

const stripe = Stripe(
  'pk_test_51PlOY6Buf1bDvGUpczpXV1MVBC2Y7AcpzTxxYRGcYDEqVdzOfh6Cyipk5adrd0VQU6KMDuubir48v3lkcHuJWKnf007B58nvpU'
);

export const bookTour = async (tourId) => {
  try {
    // 1) get session from server
    const session = await axios(
      `http://127.0.0.1:3000/booking/checkout-session/${tourId}`
    );
    console.log(session);
    // 2) Create a checkout + credit card charge
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    console.log('error in stripe js ', err.message);
    showAlert('error', err);
  }
};
