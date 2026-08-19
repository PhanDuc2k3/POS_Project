/**
 * Auth Routes - Map HTTP methods + paths to controller functions
 */

const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const profileController = require('../controllers/profile.controller');
const passwordController = require('../controllers/password.controller');
const sessionController = require('../controllers/session.controller');
const activationController = require('../controllers/activation.controller');

const router = Router();

// ─── Authentication ──────────────────────────────────────────────────
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.post('/auth/logout-all', authController.logoutAll);
router.post('/auth/activate', activationController.activate);
router.post('/internal/auth/owners', activationController.provisionOwner);

// ─── Profile ─────────────────────────────────────────────────────────
router.get('/auth/me', profileController.getMe);
router.put('/auth/profile', profileController.updateProfile);
router.put('/auth/security-question', profileController.setSecurityQuestion);
router.put('/auth/avatar', profileController.uploadAvatar);
router.delete('/auth/avatar', profileController.deleteAvatar);

// ─── Password ────────────────────────────────────────────────────────
router.put('/auth/change-password', passwordController.changePassword);
router.post('/auth/forgot-password/question', passwordController.getSecurityQuestion);
router.post('/auth/forgot-password/verify', passwordController.verifySecurityAnswer);
router.post('/auth/forgot-password/reset', passwordController.resetPassword);

// ─── Sessions & Activity ─────────────────────────────────────────────
router.get('/auth/sessions', sessionController.getSessions);
router.delete('/auth/sessions/:id', sessionController.revokeSession);
router.get('/auth/activity', sessionController.getActivity);

module.exports = router;
