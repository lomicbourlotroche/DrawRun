/**
 * Global teardown for E2E tests
 * This runs once after all tests
 */

module.exports = async () => {
    console.log('Global teardown: Cleaning up...');
    
    // Kill test servers if they were started in setup
    if (global.testServers) {
        for (const [name, process] of Object.entries(global.testServers)) {
            console.log(`Stopping ${name} server...`);
            process.kill();
        }
        delete global.testServers;
    }
    
    console.log('Global teardown: Complete');
};
