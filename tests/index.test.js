// All tests are run from this file, that way we can ensure ordering
// of tests (without needing to resort to alphabetical filenaming)
require('dotenv').config();
const path = require('path');

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const slackUpload = SLACK_TOKEN && require('./slack-upload.test');
const slackMessage = SLACK_TOKEN && require('./slack-message.test');
const fork = require('child_process').fork;

process.env.PORT = 8081;
const E2E_SLACK_CHANNEL = process.env.E2E_SLACK_CHANNEL;
const E2E_SLACK_CHANNEL_NAME = process.env.E2E_SLACK_CHANNEL_NAME;
const CI_COMMIT_MESSAGE = process.env.CI_COMMIT_MESSAGE && process.env.CI_COMMIT_MESSAGE.replace(/\n/g, '');
const CI_COMMIT_REF_NAME = process.env.CI_COMMIT_REF_NAME;
let server;

const Project = require('../common/project');
const fetch = require('node-fetch');
global.testHelpers = require('./helpers');

const formatCommit = function () {
    if (CI_COMMIT_MESSAGE) {
        return `\nBranch:${CI_COMMIT_REF_NAME}\nCommit: '${CI_COMMIT_MESSAGE}'`;
    }
    return '\nBranch: Local' + "\nCommit: '...'";
};

const sendSuccess = function () {
    if (SLACK_TOKEN) {
        return slackMessage(`Tests Passed!${formatCommit()}`, E2E_SLACK_CHANNEL_NAME);
    }
    return Promise.resolve();
};
const clearDown = function (browser, done) {
    let token;
    if (process.env[`E2E_TEST_TOKEN_${Project.env.toUpperCase()}`]) {
        token = process.env[`E2E_TEST_TOKEN_${Project.env.toUpperCase()}`];
    } else {
        const fs = require('fs');
        if (fs.existsSync('./tests/tokens.json')) {
            token = require('./tokens.json')[Project.env];
        } else {
            console.log('No tokens.json found for teardown. Either set E2E_TEST_TOKEN in your environment or create the file in /tests');
        }
    }
    if (token) {
        fetch(`${Project.api}e2etests/teardown/?format=json`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-E2E-Test-Auth-Token': token,
            },
            body: JSON.stringify({}),
        }).then((res) => {
            if (res.ok) {
                console.log('\n', '\x1b[32m', 'e2e teardown successful', '\x1b[0m', '\n');
                done();
            } else {
                console.error('\n', '\x1b[31m', 'e2e teardown failed', res.status, '\x1b[0m', '\n');
            }
        });
    } else {
        console.error('\n', '\x1b[31m', 'e2e teardown failed - no available token', '\x1b[0m', '\n');
    }
};

const sendFailure = (browser, done, request, error) => {
    const lastRequest = request && request.value ? JSON.parse(request.value) : 'No last request';
    const lastError = error && error.value ? JSON.parse(error.value) : 'No last error';
    console.log('Last request:', lastRequest);
    console.log('Last error:', lastError);
    const uri = path.join(__dirname, 'screenshot.png');
    browser.saveScreenshot(uri, () => {
        slackUpload(uri, `E2E for Bullet Train Failed. ${formatCommit()}\n\`\`\`${JSON.stringify({
            request: lastRequest,
            error: lastError,
        }, null, 2).replace(/\\/g, '')}\`\`\``, E2E_SLACK_CHANNEL, 'Screenshot')
            .then(() => {
                browser.end();
                done();
                server.kill('SIGINT');
                process.exit(0);
            });
    });
};

module.exports = Object.assign(
    {
        beforeEach(browser, done) {
            browser.waitAndSet = testHelpers.waitAndSet.bind(browser);
            browser.waitAndClick = testHelpers.waitAndClick.bind(browser);
            done();
        },
        before: (browser, done) => {
            if (SLACK_TOKEN) {
                slackMessage(`Running tests.${formatCommit()}`, E2E_SLACK_CHANNEL_NAME);
            }
            server = fork('./server');
            server.on('message', () => {
                clearDown(browser, done);
            });
        },
        after: (browser, done) => {
            if (SLACK_TOKEN && browser.sessionId) {
                browser.pause(5000) // Workaround since waitForElementIsVisible with abortOnFailure set to false doesnt actually work https://github.com/nightwatchjs/nightwatch/issues/1493
                    .isVisible('#e2e-request', (result) => {
                        // There is a chance e2e request will not be present if tests failed on another website i.e. mailinator
                        if (result.status !== -1) {
                            browser.getText('#e2e-error', (error) => {
                                browser.getText('#e2e-request', (request) => {
                                    sendFailure(browser, done, request, error);
                                });
                            });
                        } else {
                            if (browser.currentTest.results.failed) {
                                sendFailure(browser, done);
                                return;
                            }
                            sendSuccess()
                                .then(() => {
                                    browser.end();
                                    done();
                                    server.kill('SIGINT');
                                    process.exit(0);
                                });
                        }
                    });
            } else {
                sendSuccess()
                    .then(() => {
                        browser.end();
                        done();
                        server.kill('SIGINT');
                        process.exit(0);
                    });
            }
        },
    },
    require('./main.test'), // Main flow tests
    require('./invite.test'), // Invite user tests
    require('./register-fail.test'), // Registration failure tests
    require('./login-fail.test'), // Login failure tests
);
