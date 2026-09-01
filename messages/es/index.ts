import common from "./common.json";
import auth from "./auth.json";
import nav from "./nav.json";
import products from "./products.json";
import customers from "./customers.json";
import inventory from "./inventory.json";
import sales from "./sales.json";
import purchases from "./purchases.json";
import quotes from "./quotes.json";
import settings from "./settings.json";
import subscriptions from "./subscriptions.json";
import users from "./users.json";
import app from "./app.json";
import authShowcase from "./authShowcase.json";
import onboarding from "./onboarding.json";
import dashboard from "./dashboard.json";
import tutorial from "./tutorial.json";

const messages = {
  common,
  auth,
  nav,
  products,
  customers,
  inventory,
  sales,
  purchases,
  quotes,
  settings,
  subscriptions,
  users,
  app,
  authShowcase,
  onboarding: {
    ...onboarding,
    tutorial,
  },
  dashboard,
};

export default messages;
