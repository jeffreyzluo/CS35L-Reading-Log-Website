Feature: User Authentication
  As a user I want to register and log in
  So that I can access protected reading log resources

  Background:
    Given a clean user database

  Scenario: Successful registration
    When I register with username "alice" email "alice@example.com" and password "Password123!"
    Then the registration response status should be 201
    And the registration response should include a numeric user id

  Scenario: Registration with missing fields
    When I attempt to register with missing fields
    Then the registration response status should be 400

  Scenario: Duplicate email registration
    Given an existing user with username "ed" email "ed@example.com" and password "Password123!"
    When I register with username "edward" email "ed@example.com" and password "Password123!"
    Then the registration response status should be 409

  # Password strength rules: backend may enforce these; tests document expected behavior
  Scenario: Reject too-short password
    When I register with username "shorty" email "shorty@example.com" and password "abc"
    Then the registration response status should be 400
    And the registration response should include an error mentioning "password"

  Scenario: Reject password missing uppercase
    When I register with username "noupper" email "noupper@example.com" and password "lowercase123"
    Then the registration response status should be 400
    And the registration response should include an error mentioning "password"

  Scenario: Reject password missing digit
    When I register with username "nodigit" email "nodigit@example.com" and password "NoDigitsHere"
    Then the registration response status should be 400
    And the registration response should include an error mentioning "password"

  Scenario: Duplicate username registration
    Given an existing user with username "bob" email "bob@example.com" and password "Password123!"
    When I register with username "bob" email "bobby@example.com" and password "Password123!"
    Then the registration response status should be 409

  Scenario: Successful login returns JWT
    Given an existing user with username "carol" email "carol@example.com" and password "Password123!"
    When I login with email "carol@example.com" and password "Password123!"
    Then the login response status should be 200
    And the login response should include a valid JWT token
    And the login response should set a jwt cookie

  Scenario: Protected route with valid token
    Given an existing user with username "dave" email "dave@example.com" and password "Password123!"
    And I have a JWT for email "dave@example.com" and password "Password123!"
    When I request the protected resource with the token
    Then the protected response status should be 200
    And the protected response should include the username "dave"

  Scenario: Protected route with cookie-based auth
    Given an existing user with username "frank" email "frank@example.com" and password "Password123!"
    And I have a JWT for email "frank@example.com" and password "Password123!"
    When I request the protected resource with the jwt cookie
    Then the protected response status should be 200
    And the protected response should include the username "frank"

  Scenario: Protected route with invalid token
    Given an existing user with username "erin" email "erin@example.com" and password "Password123!"
    When I request the protected resource with an invalid token
    Then the protected response status should be 401
