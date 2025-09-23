# Root Cause Analysis

## The Problem
The error `"invalid input value for enum deliverable_status: "pending_approval"` is misleading. The real issue is:

1. **The `deliverables` table does NOT have a `versions` column**
2. **Versions are stored in a separate `deliverable_versions` table**
3. **The frontend code is trying to update a non-existent `versions` field**

## Database Structure
- `deliverables` table - main deliverable info (status, name, etc)
- `deliverable_versions` table - separate table for version records

## Frontend Assumption
The frontend assumes `deliverable.versions` is a JSON column that can be updated directly.

## The Fix Needed
Instead of updating `{ versions: [...] }` on the deliverable, we need to:
1. Update individual version records in the `deliverable_versions` table
2. OR load/save versions as a virtual property that's handled separately
3. OR add a proper versions JSONB column to the deliverables table

## Immediate Workaround
Comment out all attempts to update the versions field when updating deliverables.