Feature: User Authentication
  As a user I want to register and log in
  So that I can access protected reading log resources

  Background:
    Given a clean user database

  Scenario: Successful registration
    When I register with username "alice" email "alice@example.com" and password "Password123!"
    Then the registration response status should be 201
    And the registration response should include a numeric user id

  Scenario: Duplicate username registration
    Given an existing user with username "bob" email "bob@example.com" and password "Password123!"
    When I register with username "bob" email "bobby@example.com" and password "Password123!"
    Then the registration response status should be 409

  Scenario: Successful login returns JWT
    Given an existing user with username "carol" email "carol@example.com" and password "Password123!"
    When I login with email "carol@example.com" and password "Password123!"
    Then the login response status should be 200
    And the login response should include a valid JWT token

  Scenario: Protected route with valid token
    Given an existing user with username "dave" email "dave@example.com" and password "Password123!"
    And I have a JWT for email "dave@example.com" and password "Password123!"
    When I request the protected resource with the token
    Then the protected response status should be 200
    And the protected response should include the username "dave"

  Scenario: Protected route with invalid token
    Given an existing user with username "erin" email "erin@example.com" and password "Password123!"
    When I request the protected resource with an invalid token
    Then the protected response status should be 401
