Feature: Maintenance team pages
  Maintainers need the maintenance app to expose seeded teams and team edit forms.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can browse seeded teams and review a team edit page
    When I open the maintenance teams page
    Then I should be on the maintenance "/team" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And I should see text matching "Teams"
    And the page should have no detectable accessibility violations
    And the maintain team list includes:
      | Ashridge Arms     | Ashridge    |
      | Beaconsfield Bees | Beaconsfield |
      | Chesham Comets    | Chesham     |
      | Drayton Dynamos   | Drayton     |
    And the "Add Team" button should be visible
    When I choose "Ashridge Arms" from the maintain team list
    Then I should be on the maintenance "/team/team-ashridge-arms" page
    And I should see text matching "Edit Team"
    And the "Name" field should contain "Ashridge Arms"
    And the "Short Name" field should contain "Ashridge"
    And the "Handle" field should contain "ashridge"
    And the "Venue" selection should display "Ashridge Arms"
    And the "Retired" checkbox should be unchecked
    And I should see text matching "Users"
    And I should see text matching "Alice Ashridge"
    And I should see text matching "Ella Secretary"
    And I should see text matching "Text"
    And the "Mime Type" selection should display "text/plain"
    And the "Text" field should contain "Ashridge Arms team profile."
    And the "Save Text" button should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can open the add team form
    When I open the maintenance teams page
    And I click the "Add Team" button
    Then I should be on the maintenance "/team/new" page
    And I should see text matching "Add Team"
    And the "Name" field should be visible
    And the "Short Name" field should be visible
    And the "Handle" field should be visible
    And the "Venue" field should be visible
    And the "Retired" checkbox should be unchecked
    And I should see text matching "Users"
    And I should see text matching "No users assigned"
    And the "Save" button should be visible
