import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseAdmin.js';

export class AutoReplyFeatureController {
    /**
     * Create auto-reply template
     * Feature: Save customized message template with trigger keywords
     * NO SUBSCRIPTION LIMITS - Unlimited templates
     */
    async createTemplate(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { name, trigger_keywords, reply_text, is_active = true } = req.body;

            if (!name || !reply_text) {
                return res.status(400).json({ error: 'Name and reply_text required' });
            }

            // Create template - NO LIMIT CHECK
            const { data, error } = await supabaseAdmin
                .from('auto_reply_templates')
                .insert([
                    {
                        user_id: userId,
                        name,
                        trigger_keywords: trigger_keywords || [],
                        reply_text,
                        is_active,
                        created_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                message: 'Template created successfully',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get all templates for user
     */
    async getTemplates(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { data, error } = await supabaseAdmin
                .from('auto_reply_templates')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                count: data?.length || 0,
                data,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update auto-reply template
     */
    async updateTemplate(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { id } = req.params;
            const { name, trigger_keywords, reply_text, is_active } = req.body;

            // Verify ownership
            const { data: template } = await supabaseAdmin
                .from('auto_reply_templates')
                .select('user_id')
                .eq('id', id)
                .single();

            if (!template || template.user_id !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            // Update
            const { data, error } = await supabaseAdmin
                .from('auto_reply_templates')
                .update({
                    name,
                    trigger_keywords,
                    reply_text,
                    is_active,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                message: 'Template updated successfully',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Delete auto-reply template
     */
    async deleteTemplate(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { id } = req.params;

            // Verify ownership
            const { data: template } = await supabaseAdmin
                .from('auto_reply_templates')
                .select('user_id')
                .eq('id', id)
                .single();

            if (!template || template.user_id !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            // Delete
            const { error } = await supabaseAdmin
                .from('auto_reply_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Template deleted successfully',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Create auto-reply rule
     */
    async createRule(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { name, condition, template_id, enabled = true, priority = 0 } = req.body;

            if (!name || !template_id) {
                return res.status(400).json({ error: 'Name and template_id required' });
            }

            // Verify template ownership
            const { data: template } = await supabaseAdmin
                .from('auto_reply_templates')
                .select('user_id')
                .eq('id', template_id)
                .single();

            if (!template || template.user_id !== userId) {
                return res.status(403).json({ error: 'Template not found or forbidden' });
            }

            // Create rule - NO LIMIT CHECK
            const { data, error } = await supabaseAdmin
                .from('auto_reply_rules')
                .insert([
                    {
                        user_id: userId,
                        name,
                        condition: condition || '{}',
                        template_id,
                        enabled,
                        priority,
                        created_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                message: 'Rule created successfully',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get all rules for user
     */
    async getRules(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { data, error } = await supabaseAdmin
                .from('auto_reply_rules')
                .select(`
          *,
          template:auto_reply_templates(id, name, reply_text)
        `)
                .eq('user_id', userId)
                .order('priority', { ascending: true });

            if (error) throw error;

            res.json({
                success: true,
                count: data?.length || 0,
                data,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update auto-reply rule
     */
    async updateRule(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { id } = req.params;

            // Verify ownership
            const { data: rule } = await supabaseAdmin
                .from('auto_reply_rules')
                .select('user_id')
                .eq('id', id)
                .single();

            if (!rule || rule.user_id !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            // Update
            const { data, error } = await supabaseAdmin
                .from('auto_reply_rules')
                .update(req.body)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                message: 'Rule updated successfully',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Delete auto-reply rule
     */
    async deleteRule(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { id } = req.params;

            // Verify ownership
            const { data: rule } = await supabaseAdmin
                .from('auto_reply_rules')
                .select('user_id')
                .eq('id', id)
                .single();

            if (!rule || rule.user_id !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            // Delete
            const { error } = await supabaseAdmin
                .from('auto_reply_rules')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Rule deleted successfully',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Process incoming message
     * Feature: Match message against rules and send auto-reply
     * NO MESSAGE LIMIT - Unlimited messages
     */
    async processMessage(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const { sender_email, sender_name, subject, body, channel, metadata } = req.body;

            if (!sender_email || !body || !channel) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Save message - NO LIMIT CHECK
            const { data: message, error: messageError } = await supabaseAdmin
                .from('messages')
                .insert([
                    {
                        user_id: userId,
                        sender_email,
                        sender_name: sender_name || 'Unknown',
                        subject: subject || 'No Subject',
                        body,
                        channel,
                        metadata: metadata || {},
                        status: 'received',
                        created_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (messageError) throw messageError;

            // Get user's rules
            const { data: rules } = await supabaseAdmin
                .from('auto_reply_rules')
                .select(`
          *,
          template:auto_reply_templates(id, reply_text)
        `)
                .eq('user_id', userId)
                .eq('enabled', true)
                .order('priority', { ascending: true });

            // Find matching template
            let matchedTemplate = null;
            for (const rule of rules || []) {
                try {
                    const condition = JSON.parse(rule.condition || '{}');
                    if (this.evaluateCondition(condition, { sender_email, subject, body, channel })) {
                        matchedTemplate = rule.template;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            res.status(201).json({
                success: true,
                message_id: message.id,
                matched_template: matchedTemplate,
                message: 'Message processed successfully',
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get usage statistics
     * Shows total usage without limits
     */
    async getStats(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            // Get template count
            const { data: templates, error: templatesError } = await supabaseAdmin
                .from('auto_reply_templates')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (templatesError) throw templatesError;

            // Get message statistics
            const { data: messages } = await supabaseAdmin
                .from('messages')
                .select('status, channel')
                .eq('user_id', userId);

            const stats = {
                plan: {
                    name: 'Pro Plan - Unlimited',
                    status: 'active',
                },
                limits: {
                    message_limit: 'Unlimited',
                    template_limit: 'Unlimited',
                    channels: ['email', 'sms', 'whatsapp', 'telegram'],
                },
                usage: {
                    messages_total: messages?.length || 0,
                    templates_total: templates?.length || 0,
                },
                breakdown: {
                    by_status: {
                        received: messages?.filter((m: any) => m.status === 'received').length || 0,
                        replied: messages?.filter((m: any) => m.status === 'replied').length || 0,
                        skipped: messages?.filter((m: any) => m.status === 'skipped').length || 0,
                    },
                    by_channel: {
                        email: messages?.filter((m: any) => m.channel === 'email').length || 0,
                        sms: messages?.filter((m: any) => m.channel === 'sms').length || 0,
                        whatsapp: messages?.filter((m: any) => m.channel === 'whatsapp').length || 0,
                        telegram: messages?.filter((m: any) => m.channel === 'telegram').length || 0,
                    },
                },
            };

            res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    private evaluateCondition(condition: any, message: any): boolean {
        if (condition.contains_keywords) {
            const keywords = condition.contains_keywords as string[];
            return keywords.some(keyword =>
                message.body?.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        if (condition.sender_email) {
            return message.sender_email === condition.sender_email;
        }

        if (condition.channel) {
            return message.channel === condition.channel;
        }

        return true;
    }
}