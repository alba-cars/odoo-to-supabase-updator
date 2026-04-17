# activities-api

A minimal Express.js API that wraps the Supabase client to batch-update `lead_activities` records.

## Endpoints

### `PATCH /activities`

Update one or many activity records. Accepts a **single object** or an **array of objects**.

**Required field per object:** `id` (UUID of the activity)

**Updatable fields:**

| Field | Type |
|---|---|
| `odoo_id` | integer |
| `odoo_model` | string |
| `lead_odoo_id` | integer |
| `name` | string |
| `activity_type` | string |
| `activity_odoo_id` | integer |
| `summary` | string |
| `note` | string |
| `state` | string |
| `active` | boolean |
| `deadline_date` | ISO datetime |
| `done_date` | ISO datetime |
| `due_date` | ISO datetime |
| `creation_date` | ISO datetime |
| `assigned_to` | string |
| `assigned_to_odoo_id` | integer |
| `booked_by_id` | integer |
| `booked_by_name` | string |
| `visit_type` | string |
| `call_type` | string |
| `whatsapp_type` | string |
| `crm_outbound_type` | string |
| `inbound_type` | string |
| `auto_outbound_type` | string |
| `mobile_type` | string |
| `check_in_type` | string |
| `call_talk_time_duration` | number |
| `call_total_time_duration` | number |
| `call_wait_time_duration` | number |
| `call_finish_reason` | string |
| `call_scenario_operation_name` | string |
| `virtual_number` | string |
| `lead_source_id` | integer |
| `lead_source_name` | string |
| `cancel_reason` | string |
| `cancel_reason_void` | string |
| `externally_booked_by` | string |

**Example — single update:**
```json
PATCH /activities
{
  "id": "uuid-here",
  "state": "done",
  "done_date": "2024-11-01T10:00:00+00:00"
}
```

**Example — batch update:**
```json
PATCH /activities
[
  { "id": "uuid-1", "state": "done", "done_date": "2024-11-01T10:00:00+00:00" },
  { "id": "uuid-2", "call_type": "inbound", "call_talk_time_duration": 120 }
]
```

**Response codes:**
- `200` — all updates succeeded
- `207` — partial success (some updated, some failed) 
- `400` — validation error
- `422` — all updates failed

---

### `GET /health`

Returns `{ "status": "ok", "timestamp": "..." }`.

### `GET /logs?limit=100&since=<ISO datetime>`

Returns recent request logs from the local SQLite database. Logs older than **3 days** are automatically purged.

---

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role API key |
| `PORT` | Port to listen on (default: `3000`) |

Copy `.env.example` to `.env` for local dev. On Railway, set these via the dashboard.

## Running locally

```bash
npm install
cp .env.example .env
# fill in your Supabase credentials
npm run dev
```

## Deploying to Railway

1. Push this repo to GitHub
2. Create a new Railway project → Deploy from GitHub
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in Railway Variables
4. Railway auto-detects Node and runs `npm start`
