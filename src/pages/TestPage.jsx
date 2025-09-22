/**
 * Test Page - Temporary page for running QA tests
 * Navigate to /test to run the connectivity test suite
 */

import React from 'react';
import TestRunner from '@/tests/runTest';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TestRunner />
    </div>
  );
}