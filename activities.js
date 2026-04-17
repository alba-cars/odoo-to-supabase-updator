const express = require('express');
const { z } = require('zod');
const { getSupabaseClient } = require('../supabase');

const router = express.Router();

// ------------------------------------------------------------
// Updatable fields from lead_activities schema
// (internal id and created_at are intentionally excluded)
// odoo_id is required as the lookup key
// ------------------------------------------------------------
const ActivityUpdateSchema = z.object({
  // Required lookup key
  odoo_id:                      z.number().int({ message: 'odoo_id must be an integer' }),

  // Identifiers
  odoo_model:                   z.string().optional(),
  lead_odoo_id:                 z.number().int().optional(),

  // Activity metadata
  name:                         z.string().optional(),
  activity_type:                z.string().optional(),
  activity_odoo_id:             z.number().int().optional(),
  summary:                      z.string().optional(),
  note:                         z.string().optional(),
  state:                        z.string().optional(),
  active:                       z.boolean().optional(),

  // Dates
  deadline_date:                z.string().datetime({ offset: true }).optional(),
  done_date:                    z.string().datetime({ offset: true }).optional(),
  due_date:                     z.string().datetime({ offset: true }).optional(),
  creation_date:                z.string().datetime({ offset: true }).optional(),

  // Assignment
  assigned_to:                  z.string().optional(),
  assigned_to_odoo_id:          z.number().int().optional(),
  booked_by_id:                 z.number().int().optional(),
  booked_by_name:               z.string().optional(),

  // Activity type specifics
  visit_type:                   z.string().optional(),
  call_type:                    z.string().optional(),
  whatsapp_type:                z.string().optional(),
  crm_outbound_type:            z.string().optional(),
  inbound_type:                 z.string().optional(),
  auto_outbound_type:           z.string().optional(),
  mobile_type:                  z.string().optional(),
  check_in_type:                z.string().optional(),

  // Call metrics
  call_talk_time_duration:      z.number().optional(),
  call_total_time_duration:     z.number().optional(),
  call_wait_time_duration:      z.number().optional(),
  call_finish_reason:           z.string().optional(),
  call_scenario_operation_name: z.string().optional(),
  virtual_number:               z.string().optional(),

  // Lead source
  lead_source_id:               z.number().int().optional(),
  lead_source_name:             z.string().optional(),

  // Cancellation
  cancel_reason:                z.string().optional(),
  cancel_reason_void:           z.string().optional(),

  // Other
  externally_booked_by:         z.string().optional(),
});

// Accept a single object or an array
const RequestBodySchema = z.union([
  ActivityUpdateSchema,
  z.array(ActivityUpdateSchema).min(1, 'Array must contain at least one activity'),
]);

// ------------------------------------------------------------
// PATCH /activities
// ------------------------------------------------------------
router.patch('/', async (req, res) => {
  const parseResult = RequestBodySchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.flatten(),
    });
  }

  const activities = Array.isArray(parseResult.data)
    ? parseResult.data
    : [parseResult.data];

  const supabase = getSupabaseClient();
  const results = [];
  const errors = [];

  // Run updates; Supabase JS v2 doesn't support bulk update in one call,
  // so we fire them concurrently.
  await Promise.all(
    activities.map(async ({ odoo_id, ...fields }) => {
      if (Object.keys(fields).length === 0) {
        errors.push({ odoo_id, error: 'No fields to update' });
        return;
      }

      const { data, error } = await supabase
        .from('lead_activities')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('odoo_id', odoo_id)
        .select('odoo_id')
        .single();

      if (error) {
        errors.push({ odoo_id, error: error.message });
      } else {
        results.push(data);
      }
    })
  );

  const status = errors.length === 0 ? 200 : results.length === 0 ? 422 : 207;

  return res.status(status).json({
    updated: results,
    ...(errors.length > 0 && { errors }),
  });
});

module.exports = router;
