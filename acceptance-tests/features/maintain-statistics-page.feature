Feature: Maintenance statistics page
  Maintainers need the maintenance app to expose the statistics recalculation screen.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can review the statistics recalculation page
    When I open the maintenance statistics page
    Then I should be on the maintenance "/statistics" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And I should see text matching "Statistics"
    And the page should have no detectable accessibility violations
    And the "Season" field should be visible
    And the "Recalculate Statistics" button should be visible
    And the "Recalculate Statistics" button should be disabled
