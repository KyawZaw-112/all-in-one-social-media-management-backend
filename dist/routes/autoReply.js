import { Router } from 'express';
import { AutoReplyFeatureController } from '../controllers/autoReply.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js';
const router = Router();
const controller = new AutoReplyFeatureController();
/**
 * All auto-reply endpoints require:
 * 1. Authentication (user must be logged in)
 * 2. Active subscription (user must have paid subscription)
 */
// Apply middleware
router.use(requireAuth);
router.use(requireActiveSubscription);
// ============================================
// TEMPLATE ENDPOINTS
// ============================================
/**
 * POST /api/auto-reply/templates
 * Create new auto-reply template
 * Body: { name, reply_text, trigger_keywords? }
 */
router.post('/templates', (req, res) => controller.createTemplate(req, res));
/**
 * GET /api/auto-reply/templates
 * Get all templates for current user
 */
router.get('/templates', (req, res) => controller.getTemplates(req, res));
/**
 * PUT /api/auto-reply/templates/:id
 * Update existing template
 * Body: { name?, reply_text?, trigger_keywords?, is_active? }
 */
router.put('/templates/:id', (req, res) => controller.updateTemplate(req, res));
/**
 * DELETE /api/auto-reply/templates/:id
 * Delete template permanently
 */
router.delete('/templates/:id', (req, res) => controller.deleteTemplate(req, res));
// ============================================
// RULE ENDPOINTS
// ============================================
/**
 * POST /api/auto-reply/rules
 * Create new routing rule
 * Body: { name, template_id, condition?, priority?, enabled? }
 */
router.post('/rules', (req, res) => controller.createRule(req, res));
/**
 * GET /api/auto-reply/rules
 * Get all rules for current user
 */
router.get('/rules', (req, res) => controller.getRules(req, res));
/**
 * PUT /api/auto-reply/rules/:id
 * Update existing rule
 * Body: { name?, condition?, priority?, enabled? }
 */
router.put('/rules/:id', (req, res) => controller.updateRule(req, res));
/**
 * DELETE /api/auto-reply/rules/:id
 * Delete rule permanently
 */
router.delete('/rules/:id', (req, res) => controller.deleteRule(req, res));
// ============================================
// MESSAGE PROCESSING ENDPOINTS
// ============================================
/**
 * POST /api/auto-reply/process-message
 * Process incoming message and match against rules
 * Body: { sender_email, sender_name?, subject?, body, channel }
 * Returns: matched_template if any rule matched
 */
router.post('/process-message', (req, res) => controller.processMessage(req, res));
// ============================================
// STATISTICS ENDPOINTS
// ============================================
/**
 * GET /api/auto-reply/stats
 * Get usage statistics and quotas for current subscription
 * Returns: limits, usage, breakdown by channel and status
 */
router.get('/stats', (req, res) => controller.getStats(req, res));
export default router;
