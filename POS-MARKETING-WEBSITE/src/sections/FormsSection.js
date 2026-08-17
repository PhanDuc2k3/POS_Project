export function renderFormsSection(state = {}) {
  const signedIn = !!state.user;
  const request = state.myTrialRequest || null;
  const locked = request && (request.status === 'pending' || request.status === 'approved');
  const trialNote = !signedIn
    ? 'Sign in first to submit a trial request.'
    : locked
      ? `Your request is ${request.status}. You cannot submit another one yet.`
      : 'One request per account. We will unlock this form again after review.';

  return `
    <section class="section forms" id="trial">
      <div class="trial-panel">
        <div>
          <p class="eyebrow">Start free trial</p>
          <h2>Launch your demo workspace in minutes.</h2>
          <p>${trialNote}</p>
        </div>
        <form class="form-card" data-form="trial">
          <label>Restaurant name<input name="restaurant" placeholder="Saigon Bistro" required /></label>
          <label>Contact name<input name="contactName" placeholder="Nguyen Van A" required /></label>
          <label>Work email<input name="email" type="email" placeholder="owner@example.com" required /></label>
          <label>Phone<input name="phone" placeholder="+84..." /></label>
          <label>
            Operating model
            <select name="operatingMode">
              <option value="simple">Counter service</option>
              <option value="restaurant">Full-service restaurant</option>
              <option value="chain">Multi-branch chain</option>
            </select>
          </label>
          <label>
            Package
            <select name="packageTier">
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="restaurant" selected>Restaurant</option>
              <option value="chain">Chain</option>
            </select>
          </label>
          <button class="button primary" type="submit" ${!signedIn || locked ? 'disabled' : ''}>Create trial request</button>
          <p class="form-message" role="status"></p>
        </form>
      </div>
    </section>
    <section class="section contact-signin contact-only" id="contact">
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
    </section>
  `;
}
