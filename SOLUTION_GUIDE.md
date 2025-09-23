# Complete Solution for 400 Error Fix

## Problem Summary
The database enum `deliverable_status` doesn't include `'wip'` (Work in Progress), causing a 400 error when trying to update deliverables to this status.

## Immediate Fix (Already Applied)
I've updated the code to temporarily map `'wip'` to `'submitted'` so the app works immediately. This is a workaround until you can update the database.

## Permanent Database Fix (Choose One Option)

### Option 1: Direct SQL in Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Run these commands **separately** (one at a time):

```sql
-- First command (run and wait for completion)
ALTER TYPE deliverable_status ADD VALUE IF NOT EXISTS 'wip' AFTER 'draft';
```

```sql
-- Second command (verify it worked)
SELECT unnest(enum_range(NULL::deliverable_status)) ORDER BY 1;
```

### Option 2: Create a Database Migration
1. Go to Supabase Dashboard → Database → Migrations
2. Click "New Migration"
3. Name it: "add_wip_status"
4. Add this SQL:
```sql
ALTER TYPE deliverable_status ADD VALUE 'wip' AFTER 'draft';
```
5. Run the migration

### Option 3: Use Supabase CLI (if linked)
```bash
cd ~/Princess
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

## After Database Fix
Once the database is updated, remove the temporary workaround:

1. Edit `/src/api/supabaseEntities.js`
2. Remove the line: `'wip': 'submitted',`
3. Save the file

## Why This Happened
- The frontend UI has "Work in Progress" as an option
- The database enum was created without this value
- PostgreSQL strictly enforces enum values
- The 400 error means "invalid enum value"

## Verification
After fixing, test by:
1. Go to any deliverable
2. Change status to "Work in Progress"
3. Should save without errors

## Status Values After Fix
The database will accept these values:
- `draft` (initial state)
- `wip` (work in progress) ← NEW
- `submitted`
- `pending_approval`
- `approved`
- `declined`

## Note on PostgreSQL Enums
PostgreSQL enums require special handling:
- New values must be committed before use
- Cannot be added in a transaction with other operations
- Once added, values cannot be removed (only new ones added)

This is why the migration must be run separately from other operations.