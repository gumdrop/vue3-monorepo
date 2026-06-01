Feature: Maintenance user pages
  Maintainers need the maintenance app to expose seeded users and user edit forms.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can browse seeded users and review a user edit page
    When I open the maintenance users page
    Then I should be on the maintenance "/user" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And I should see text matching "Users"
    And the page should have no detectable accessibility violations
    And the maintain user list includes:
      | Alice Ashridge   | alice.ashridge@example.test   |
      | Ben Beaconsfield | ben.beaconsfield@example.test |
      | Chloe Chesham    | chloe.chesham@example.test    |
      | Dan Drayton      | dan.drayton@example.test      |
      | Ella Secretary   | ella.secretary@example.test   |
    And the "Add User" button should be visible
    When I choose "Alice Ashridge" from the maintain user list
    Then I should be on the maintenance "/user/user-alice-ashridge" page
    And I should see text matching "Edit User"
    And the "Name" field should contain "Alice Ashridge"
    And the "Email" field should contain "alice.ashridge@example.test"
    And the "Save" button should be visible

  Scenario: Maintainers can open the add user form
    When I open the maintenance users page
    And I click the "Add User" button
    Then I should be on the maintenance "/user/new" page
    And I should see text matching "Add User"
    And the "Name" field should be visible
    And the "Email" field should be visible
    And the "Save" button should be visible
