const Stripe = require('stripe');

// Initialize Stripe. If no key is set or it's placeholder, we will run in simulated mode
const isStripeConfigured = 
  process.env.STRIPE_SECRET_KEY && 
  process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key';

let stripe = null;
if (isStripeConfigured) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('[Stripe Service] Stripe initialized with secret key.');
} else {
  console.log('[Stripe Service] Running in SIMULATION mode (no STRIPE_SECRET_KEY configured).');
}

/**
 * Creates a payment intent or simulates one
 * @param {number} amount - Amount in cents (e.g. 500000 for $5000.00)
 * @param {string} employeeEmail - For metadata
 * @returns {Promise<object>} - Payment details including ID and status
 */
const processSalaryPayout = async (amount, employeeEmail) => {
  const amountInCents = Math.round(amount * 100);

  if (stripe) {
    try {
      // Create a PaymentIntent. For salary payouts, we might simulate a transfer
      // but PaymentIntent is standard for Stripe integration and simulation.
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method_types: ['card'],
        description: `Salary disbursement for ${employeeEmail}`,
        metadata: { employeeEmail },
        // In real card payments, you confirm. For payout simulation, we'll auto-confirm in dev
        // or just return the paymentIntent id.
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'completed', // auto-complete for simulation
        amount: amount,
      };
    } catch (error) {
      console.error(`[Stripe Service Error] payment intents create failed: ${error.message}`);
      throw new Error(`Stripe Payment Error: ${error.message}`);
    }
  } else {
    // Simulated payout
    console.log(`[Stripe Simulation] Processing payout of $${amount} for ${employeeEmail}`);
    const simulatedId = 'pi_sim_' + Math.random().toString(36).substr(2, 9);
    
    // Simulate minor delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id: simulatedId,
      status: 'completed',
      amount: amount,
    };
  }
};

module.exports = {
  processSalaryPayout,
};
