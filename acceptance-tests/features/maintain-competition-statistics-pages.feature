Feature: Maintenance competition statistics pages
  Maintainers need the maintenance app to expose competition statistics and editable result rows.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can browse seeded competition statistics and review the edit page
    When I open the maintenance competition statistics page
    Then I should be on the maintenance "/competitionstatistics" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And I should see text matching "Competition Statistics"
    And the page should have no detectable accessibility violations
    And the maintain competition statistics list includes:
      | League Roll Of Honour | 1 results |
    And the "Add Competition Statistics" button should be visible
    When I choose "League Roll Of Honour" from the maintain competition statistics list
    Then I should be on the maintenance "/competitionstatistics/competition-statistics-league" page
    And I should see text matching "Edit Competition Statistics"
    And the "Competition Name" field should contain "League Roll Of Honour"
    And I should see text matching "Results"
    And the "Season Text" field should contain "2025/2026"
    And the "Team Text" field should contain "Ashridge Arms"
    And the "Add Result" button should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can open the add competition statistics form
    When I open the maintenance competition statistics page
    And I click the "Add Competition Statistics" button
    Then I should be on the maintenance "/competitionstatistics/new" page
    And I should see text matching "Add Competition Statistics"
    And the "Competition Name" field should be visible
    And I should see text matching "No results"
    And the "Add Result" button should be visible
    And the "Save" button should be visible
