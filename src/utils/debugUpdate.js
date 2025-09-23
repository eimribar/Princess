// Debug script to trace exactly what's happening during update
import { supabase } from '@/lib/supabase';

export async function debugUpdate() {
  const id = 'e51ad8c9-b530-454d-8666-bbc582ca7b6c';
  
  console.log('=== DEBUG UPDATE START ===');
  
  // Step 1: Get current deliverable directly from Supabase
  console.log('Step 1: Fetching current deliverable...');
  const { data: current, error: fetchError } = await supabase
    .from('deliverables')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }
  
  console.log('Current deliverable:', {
    id: current.id,
    name: current.name,
    status: current.status,
    feedback: current.feedback,
    iteration_history: current.iteration_history
  });
  
  // Step 2: Try a direct update with minimal data
  console.log('\nStep 2: Attempting direct update to not_started...');
  const { data: updated, error: updateError } = await supabase
    .from('deliverables')
    .update({ status: 'not_started' })
    .eq('id', id)
    .select()
    .single();
  
  if (updateError) {
    console.error('Update error:', updateError);
    console.error('Error details:', {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint
    });
  } else {
    console.log('Update successful!');
    console.log('Updated deliverable status:', updated.status);
  }
  
  console.log('=== DEBUG UPDATE END ===');
}

// Make it available in window
if (typeof window !== 'undefined') {
  window.debugUpdate = debugUpdate;
}