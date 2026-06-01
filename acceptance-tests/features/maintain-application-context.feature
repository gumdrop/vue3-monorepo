Feature: Maintenance application context
  Maintainers need the maintenance app to expose the seeded application context settings.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can review the seeded application context
    When I open the maintenance application context page
    Then I should be on the maintenance "/applicationcontext" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And the maintain navigation includes:
      | Seasons             |
      | Teams               |
      | Venues              |
      | Users               |
      | Site Users          |
      | Global Text         |
      | Application Context |
    And I should see text matching "Application Context"
    And the "League Name" field should contain "Chiltern Quiz League"
    And the "Global Text" selection should display "site"
    And the "Current Season" selection should display "2025/2026"
    And the "Sender Email" field should contain "secretary@chilternquizleague.example"
    And the "Cloud Store Bucket" field should contain "chiltern-ql-firestore-local"
    And I should see text matching "Email Aliases"
    And I should see text matching "No email aliases configured"
    And the "Add Alias" button should be visible
    And the "Save" button should be visible
