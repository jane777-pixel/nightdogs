import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event, context) => {
  // Only allow GET requests for this test endpoint
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: {
        hasResendApiKey: !!process.env.RESEND_API_KEY,
        hasAudienceId: !!process.env.RESEND_AUDIENCE_ID,
        hasUrl: !!process.env.URL,
        nodeEnv: process.env.NODE_ENV || 'not set',
        netlifyContext: process.env.CONTEXT || 'not set'
      },
      tests: {}
    };

    // Test 1: Check if required environment variables are present
    if (!process.env.RESEND_API_KEY) {
      testResults.tests.envVars = {
        status: 'FAIL',
        message: 'RESEND_API_KEY not found in environment variables'
      };
    } else if (!process.env.RESEND_AUDIENCE_ID) {
      testResults.tests.envVars = {
        status: 'FAIL',
        message: 'RESEND_AUDIENCE_ID not found in environment variables'
      };
    } else {
      testResults.tests.envVars = {
        status: 'PASS',
        message: 'All required environment variables present'
      };
    }

    // Test 2: Test Resend API connectivity (if env vars are present)
    if (process.env.RESEND_API_KEY) {
      try {
        // Try to list audiences to test API connectivity
        const audiences = await resend.audiences.list();
        testResults.tests.resendApi = {
          status: 'PASS',
          message: `Successfully connected to Resend API. Found ${audiences.data.length} audience(s)`
        };

        // Test 3: Check if our specific audience exists
        if (process.env.RESEND_AUDIENCE_ID) {
          const targetAudience = audiences.data.find(
            audience => audience.id === process.env.RESEND_AUDIENCE_ID
          );

          if (targetAudience) {
            testResults.tests.audience = {
              status: 'PASS',
              message: `Found target audience: "${targetAudience.name}"`
            };
          } else {
            testResults.tests.audience = {
              status: 'FAIL',
              message: 'Target audience not found in Resend account'
            };
          }
        }

      } catch (apiError) {
        testResults.tests.resendApi = {
          status: 'FAIL',
          message: `Resend API error: ${apiError.message}`
        };
      }
    } else {
      testResults.tests.resendApi = {
        status: 'SKIP',
        message: 'Skipped - no API key found'
      };
    }

    // Test 4: Check Netlify Identity URL
    if (process.env.URL) {
      testResults.tests.identityUrl = {
        status: 'PASS',
        message: `Identity URL configured: ${process.env.URL}`
      };
    } else {
      testResults.tests.identityUrl = {
        status: 'WARN',
        message: 'URL environment variable not set (needed for Identity auth)'
      };
    }

    // Overall status
    const failedTests = Object.values(testResults.tests).filter(test => test.status === 'FAIL');
    const warnTests = Object.values(testResults.tests).filter(test => test.status === 'WARN');

    let overallStatus = 'PASS';
    if (failedTests.length > 0) {
      overallStatus = 'FAIL';
    } else if (warnTests.length > 0) {
      overallStatus = 'WARN';
    }

    testResults.overall = {
      status: overallStatus,
      message: failedTests.length > 0
        ? `${failedTests.length} test(s) failed`
        : warnTests.length > 0
        ? `${warnTests.length} warning(s) found`
        : 'All tests passed'
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testResults, null, 2),
    };

  } catch (error) {
    console.error('Test setup error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Test failed',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
