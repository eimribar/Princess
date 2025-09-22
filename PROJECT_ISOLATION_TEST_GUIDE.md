# 🧪 PROJECT ISOLATION TESTING GUIDE

## ✅ CHANGES IMPLEMENTED

### 1. **Routing Changes**
- Dashboard now REQUIRES project ID in URL (`/dashboard/{projectId}`)
- Automatic redirect to first project or project creation
- No more defaulting to shared data

### 2. **Data Isolation**
- Complete data clearing when switching projects
- localStorage cache cleared between switches
- Each project gets fresh 104 stages

### 3. **Stage Reset**
- All new project stages start as `not_ready`
- No status contamination from templates
- Completion data explicitly nulled out

### 4. **Import Cleanup**
- Removed all old entity imports
- Using only Supabase entities
- No localStorage fallback for project data

## 🧪 TESTING PROTOCOL

### Step 1: Clear Everything
```javascript
// In browser console:
testProjectIsolation.clearAllData()
```

### Step 2: Create Test Projects
```javascript
// This creates 3 different projects with unique data
await testProjectIsolation.createTestProjects()
```

Expected Result:
- Project A: ABC Brand Development (Jan 15, 2025)
- Project B: XYZ Company Rebrand (Feb 1, 2025)
- Project C: DEF Startup Launch (Mar 1, 2025)

### Step 3: Verify Isolation
```javascript
// Check that each project has its own data
await testProjectIsolation.verifyProjectIsolation()
```

Expected Output:
- Each project should have 104 stages
- Different start dates
- All stages start as `not_ready`

### Step 4: Test Switching
1. Navigate to Project A
2. Check stages tab - should show 104 stages
3. Update first stage to "in_progress"
4. Switch to Project B (via dropdown)
5. Check stages - should show different 104 stages, all `not_ready`
6. Switch back to Project A
7. First stage should still be "in_progress"

### Step 5: Test Stage Update Isolation
```javascript
// Update a stage in one project
await testProjectIsolation.testStageUpdate('project-id-here')
```

This should update ONLY that project's stage.

### Step 6: Verify in UI
1. Click project dropdown in header
2. Select different projects
3. Each should show:
   - Unique timeline
   - Different stage statuses
   - Project-specific team members
   - Isolated deliverables

## 🔍 WHAT TO LOOK FOR

### ✅ SUCCESS INDICATORS:
- URL always includes project ID
- Project dropdown shows all projects
- Switching projects changes ALL data
- No data bleeding between projects
- Each project has exactly 104 stages
- Timeline reflects each project's start date

### ❌ FAILURE INDICATORS:
- Seeing same stages in different projects
- Stage updates appearing in wrong project
- Dashboard loading without project ID
- Old data persisting after switch
- Mixed team members between projects

## 🛠️ TROUBLESHOOTING

### Issue: Still seeing old data
**Solution:**
```javascript
localStorage.clear()
location.reload()
```

### Issue: Projects not switching
**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Supabase dashboard for data

### Issue: Stages not loading
**Verify:**
1. Supabase connection active
2. RLS policies disabled (for dev)
3. Project ID in stages table

## 📊 DATABASE VERIFICATION

Check in Supabase dashboard:

### Projects Table
```sql
SELECT id, name, client_name, start_date 
FROM projects 
ORDER BY created_at DESC;
```

### Stages Table (verify project_id)
```sql
SELECT project_id, COUNT(*) as stage_count 
FROM stages 
GROUP BY project_id;
```
Each project should have 104 stages.

### Check Stage Isolation
```sql
SELECT DISTINCT project_id, status, COUNT(*) 
FROM stages 
GROUP BY project_id, status;
```
New projects should show all stages as 'not_ready'.

## 🎯 EXPECTED BEHAVIOR

1. **Project Creation**
   - Creates unique project with ID
   - Generates 104 fresh stages
   - All stages start as `not_ready`
   - Unique timeline based on start date

2. **Project Switching**
   - URL updates to new project ID
   - ALL data refreshes
   - No cached data persists
   - Clean stage statuses

3. **Data Updates**
   - Changes stay in their project
   - No cross-contamination
   - Proper project_id association

## 🚀 QUICK TEST COMMANDS

```javascript
// Full test suite
async function runFullTest() {
  console.log('Starting full isolation test...');
  
  // 1. Clear
  testProjectIsolation.clearAllData();
  
  // 2. Create projects
  const projects = await testProjectIsolation.createTestProjects();
  
  // 3. Verify
  const isolated = await testProjectIsolation.verifyProjectIsolation();
  
  // 4. Test update
  if (projects.projectA) {
    await testProjectIsolation.testStageUpdate(projects.projectA);
  }
  
  console.log('Test complete! Isolated:', isolated);
}

// Run it
runFullTest();
```

## ✨ SUCCESS CRITERIA

- [ ] Each project shows unique 104 stages
- [ ] Project A changes don't affect Project B
- [ ] Timeline matches each project's start date
- [ ] Team members are project-specific
- [ ] No data bleeding between projects
- [ ] URL always includes project ID
- [ ] Project switcher works smoothly

**If all checks pass, PROJECT ISOLATION IS WORKING!** 🎉