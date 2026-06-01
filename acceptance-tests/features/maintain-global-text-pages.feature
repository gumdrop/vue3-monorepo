Feature: Maintenance global text pages
  Maintainers need the maintenance app to expose seeded global text sets and text references.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can browse seeded global text and review the edit page
    When I open the maintenance global text page
    Then I should be on the maintenance "/globaltext" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And I should see text matching "Global Text"
    And the page should have no detectable accessibility violations
    And the maintain global text list includes:
      | site |
    And the "Add Global Text" button should be visible
    When I choose "site" from the maintain global text list
    Then I should be on the maintenance "/globaltext/site" page
    And I should see text matching "Edit Global Text"
    And the "Name" field should contain "site"
    And I should see text matching "Text References"
    And the global text references include:
      | front-page             |
      | rules-content          |
      | competitions-header    |
      | links-content          |
      | help-content-main      |
    And the "Add Text Reference" button should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can open the add global text form
    When I open the maintenance global text page
    And I click the "Add Global Text" button
    Then I should be on the maintenance "/globaltext/new" page
    And I should see text matching "Add Global Text"
    And the "Name" field should be visible
    And I should see text matching "No text references"
    And the "Add Text Reference" button should be visible
    And the "Save" button should be visible
