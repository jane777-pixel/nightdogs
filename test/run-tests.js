#!/usr/bin/env node

/**
 * Test runner for nightdogs.xyz
 * Runs all available tests and reports results
 */

import { testBuildProcess } from './build.test.js';
import { validateAllPosts, validateAuthorsData } from './content-validation.test.js';

async function runAllTests() {
  console.log('🧪 Running nightdogs.xyz test suite\n');

  const tests = [
    {
      name: 'Build Process',
      fn: testBuildProcess,
      description: 'Verify Eleventy build works and produces required files'
    },
    {
      name: 'Content Validation',
      fn: validateAllPosts,
      description: 'Validate blog post frontmatter and structure'
    },
    {
      name: 'Authors Data',
      fn: validateAuthorsData,
      description: 'Validate authors.json structure and completeness'
    }
  ];

  let passed = 0;
  let total = tests.length;
  const results = [];

  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    console.log(`   ${test.description}`);
    console.log('   ' + '─'.repeat(50));

    const startTime = Date.now();
    const result = await test.fn();
    const duration = Date.now() - startTime;

    results.push({
      name: test.name,
      passed: result,
      duration
    });

    if (result) {
      passed++;
      console.log(`   ✅ Passed (${duration}ms)`);
    } else {
      console.log(`   ❌ Failed (${duration}ms)`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  console.log('═'.repeat(60));

  // Detailed results
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const duration = `${result.duration}ms`.padStart(6);
    console.log(`${status} ${result.name.padEnd(20)} ${duration}`);
  });

  if (passed === total) {
    console.log('\n🎉 All tests passed! Ready to deploy.');
    process.exit(0);
  } else {
    console.log(`\n💥 ${total - passed} test(s) failed. Please fix issues before deploying.`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Test run interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Test run terminated');
  process.exit(1);
});

runAllTests().catch(error => {
  console.error('\n💥 Test runner failed:', error);
  process.exit(1);
});
