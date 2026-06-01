Feature: Maintenance site user pages
  Maintainers need the maintenance app to expose seeded site users and site user edit forms.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can browse seeded site users and review a site user edit page
    When I open the maintenance site users page
    Then I should be on the maintenance "/siteuser" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And I should see text matching "Site Users"
    And the maintain site user list includes:
      | alice-ashridge |
      | ella-secretary |
    And the "Add Site User" button should be visible
    When I choose "alice-ashridge" from the maintain site user list
    Then I should be on the maintenance "/siteuser/siteuser-alice-ashridge" page
    And I should see text matching "Edit Site User"
    And the "Handle" field should contain "alice-ashridge"
    And the "Email" field should contain "alice.ashridge@example.test"
    And the "Firebase UID" field should contain "firebase-alice-ashridge"
    And the "User Reference" selection should display "Alice Ashridge"
    And the "Save" button should be visible

  Scenario: Maintainers can open the add site user form
    When I open the maintenance site users page
    And I click the "Add Site User" button
    Then I should be on the maintenance "/siteuser/new" page
    And I should see text matching "Add Site User"
    And the "Handle" field should be visible
    And the "Email" field should be visible
    And the "Firebase UID" field should be visible
    And the "User Reference" field should be visible
    And the "Save" button should be visible
