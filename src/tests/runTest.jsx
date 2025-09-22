/**
 * Test Runner Component
 * Add this to your app to run tests with a button click
 */

import React, { useState } from 'react';
import ConnectivityTestSuite from './connectivityTest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    setLogs([]);
    
    // Capture console logs
    const originalLog = console.log;
    const logCapture = [];
    console.log = (...args) => {
      originalLog(...args);
      logCapture.push(args.join(' '));
      setLogs([...logCapture]);
    };

    try {
      const testSuite = new ConnectivityTestSuite();
      await testSuite.runAllTests();
      
      const passed = testSuite.testResults.filter(r => r.passed).length;
      const failed = testSuite.testResults.filter(r => !r.passed).length;
      const total = testSuite.testResults.length;
      
      setResults({
        tests: testSuite.testResults,
        passed,
        failed,
        total,
        passRate: Math.round((passed / total) * 100)
      });
    } catch (error) {
      console.error('Test suite failed:', error);
      setResults({
        error: error.message,
        tests: [],
        passed: 0,
        failed: 1,
        total: 1,
        passRate: 0
      });
    } finally {
      console.log = originalLog;
      setIsRunning(false);
    }
  };

  const getStatusIcon = (passRate) => {
    if (passRate === 100) return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (passRate >= 80) return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    return <XCircle className="w-6 h-6 text-red-500" />;
  };

  const getStatusColor = (passRate) => {
    if (passRate === 100) return 'text-green-600';
    if (passRate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🧪 Connectivity Test Suite</span>
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run All Tests
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Test Progress */}
          {isRunning && (
            <div className="space-y-2 mb-6">
              <div className="text-sm text-gray-600">Running comprehensive QA tests...</div>
              <div className="bg-gray-100 rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs font-mono">
                  {logs.slice(-5).join('\n')}
                </pre>
              </div>
            </div>
          )}

          {/* Test Results */}
          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Test Results</h3>
                  {getStatusIcon(results.passRate)}
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold">{results.total}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{results.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{results.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${getStatusColor(results.passRate)}`}>
                      {results.passRate}%
                    </div>
                    <div className="text-sm text-gray-600">Pass Rate</div>
                  </div>
                </div>

                {/* Status Message */}
                <div className={`text-center p-3 rounded ${
                  results.passRate === 100 ? 'bg-green-100 text-green-800' :
                  results.passRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {results.passRate === 100 && '🎉 All tests passed! System is fully operational!'}
                  {results.passRate >= 80 && results.passRate < 100 && '✅ System is mostly functional with minor issues.'}
                  {results.passRate >= 60 && results.passRate < 80 && '⚠️ System has significant issues that need attention.'}
                  {results.passRate < 60 && '❌ System has critical issues. Please review failures.'}
                </div>
              </div>

              {/* Detailed Results */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Detailed Results</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.tests.map((test, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded border ${
                        test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <span className="text-lg">{test.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{test.test}</div>
                        <div className="text-sm text-gray-600">{test.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Failed Tests Summary */}
              {results.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Failed Tests</h3>
                  <ul className="space-y-1">
                    {results.tests
                      .filter(t => !t.passed)
                      .map((test, index) => (
                        <li key={index} className="text-sm text-red-700">
                          • {test.test}: {test.details}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {!results && !isRunning && (
            <div className="text-center py-12 text-gray-600">
              <div className="mb-4">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
              </div>
              <p className="mb-2">Click "Run All Tests" to perform a comprehensive QA check</p>
              <p className="text-sm">This will test:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Supabase connectivity</li>
                <li>• Table access and permissions</li>
                <li>• Project creation (104 stages)</li>
                <li>• Field mappings and data integrity</li>
                <li>• CRUD operations</li>
                <li>• Performance benchmarks</li>
                <li>• Error handling</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}