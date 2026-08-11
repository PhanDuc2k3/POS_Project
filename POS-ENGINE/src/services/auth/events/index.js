/**
 * Auth Service Events
 * Defines event topics published by this service.
 * Centralizes event names to avoid typos.
 */

const EVENTS = {
  USER_LOGGED_IN: 'user.loggedIn',
  USER_PASSWORD_CHANGED: 'user.passwordChanged',
  USER_PROFILE_UPDATED: 'user.profileUpdated',
};

module.exports = EVENTS;
