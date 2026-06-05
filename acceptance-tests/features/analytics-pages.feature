Feature: Seasons analytics pages
  Visitors need to review competition analytics and move between analytics panes.

  Background:
    Given I am not signed in

  Scenario: Visitors keep the selected competition when moving between analytics panes
    When I open the analytics page
    Then I should be on the "/analytics" page
    And I should see text matching "Seasons"
    When I select "League Championship" from the analytics competition selector
    Then the analytics competition selector should show "League Championship"
    And I should see text matching "Fixture sets complete"
    And the analytics menu includes:
      | Overview     |
      | Replay       |
      | All Seasons  |
    When I choose "All Seasons" from the analytics menu
    Then I should be on the "/analytics/all-seasons" page
    And the analytics competition selector should show "League Championship"
    And I should see text matching "Average Scores"
    And I should see text matching "Different winners"
    And I should see text matching "Most successful team"
    And I should see text matching "Highest average score"
    When I choose "Replay" from the analytics menu
    Then I should be on the "/analytics/replay" page
    And the analytics competition selector should show "League Championship"
    And I should see text matching "Round 1"
    And I should see text matching "League Championship Table"
    When I choose "Overview" from the analytics menu
    Then I should be on the "/analytics" page
    And the analytics competition selector should show "League Championship"
    And I should see text matching "Fixture sets complete"
