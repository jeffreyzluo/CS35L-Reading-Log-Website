#Database Testing with Transaction Rollback

This test dieectory contains test helpers that allow us to write database tests without actually modifying the database. Using the rollback property of transaction, we can write tests without creating a new test database.

#How Transaction Rollback Works

Each test uses withTestTransaction wrapper, where all database operations in the test will run.
These database operations will depend on each other and as long as it's happening within the same test, it will run.

At the end of the test, all operations are rolled back, and the transaction doesn't occur. No testing history is stored on the database.

