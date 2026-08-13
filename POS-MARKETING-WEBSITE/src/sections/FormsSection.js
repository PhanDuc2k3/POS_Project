export function renderFormsSection() {
  return `
    <section class="section forms" id="trial">
      <div class="trial-panel">
        <div>
          <p class="eyebrow">Start free trial</p>
          <h2>Launch your demo workspace in minutes.</h2>
          <p>No credit card required. Use the form to simulate a trial request for your restaurant team.</p>
        </div>
        <form class="form-card" data-form="trial">
          <label>Restaurant name<input name="restaurant" placeholder="Saigon Bistro" required /></label>
          <label>Work email<input name="email" type="email" placeholder="owner@example.com" required /></label>
          <label>
            Operating model
            <select name="model">
              <option>Counter service</option>
              <option>Full-service restaurant</option>
              <option>Multi-branch chain</option>
            </select>
          </label>
          <button class="button primary" type="submit">Create trial request</button>
          <p class="form-message" role="status"></p>
        </form>
      </div>
    </section>
    <section class="section contact-signin" id="contact">
      <form class="contact-card" data-form="contact">
        <p class="eyebrow">Contact sales</p>
        <h2>Talk to a POS specialist.</h2>
        <div class="two-inputs">
          <label>Name<input name="name" placeholder="Your name" required /></label>
          <label>Phone<input name="phone" placeholder="+84..." required /></label>
        </div>
        <label>Message<textarea name="message" rows="4" placeholder="Tell us about your restaurant"></textarea></label>
        <button class="button primary" type="submit">Send request</button>
        <p class="form-message" role="status"></p>
      </form>
      <form class="signin-card" id="signin" data-form="signin">
        <p class="eyebrow">Sign in preview</p>
        <h2>Welcome back</h2>
        <label>Email<input name="email" type="email" placeholder="admin@restaurant.com" required /></label>
        <label>Password<input name="password" type="password" placeholder="Password" required /></label>
        <button class="button secondary" type="submit">Sign in demo</button>
        <p class="form-message" role="status"></p>
      </form>
    </section>
  `;
}
