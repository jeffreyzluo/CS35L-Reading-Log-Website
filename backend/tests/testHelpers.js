//This creates a test transaction wrapper which will allow multiple database functions to happen under one transaction without resetting.
//The drawback of using testTransaction is that it's too hard
export function createTestTxWrapper(client) {
  return async function testTx(callback) {
      // Start a SAVEPOINT instead of a new BEGIN
      await client.query('SAVEPOINT sp');
      try {
          const result = await callback(client);
          // Commit within the savepoint (makes changes visible)
          await client.query('RELEASE SAVEPOINT sp');
          return result;
      } catch (err) {
          // Rollback to savepoint on error
          await client.query('ROLLBACK TO SAVEPOINT sp');
          throw err;
      }
  };
}

/**
 * Alternative: Direct client wrapper for simpler syntax
 * Use this if you prefer passing the client directly
 * 
 * @param {import('pg').PoolClient} client 
 * @returns {Function}
 */
export function useClient(client) {
  return async (callback) => callback(client);
}

