const STRIPE_KEY = process.env.STRIPE_API_TOKEN
const stripe = require("stripe")(STRIPE_KEY) // this will crash without an API key

module.exports = {
}