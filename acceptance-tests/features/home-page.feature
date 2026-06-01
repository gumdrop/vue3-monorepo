Feature: Home page
  Visitors need the home page to show current league context and the headline season information.

  Background:
    Given I am not signed in

  Scenario: Visitors see the current season and home page sections
    When I open the QuizLeague home page
    Then I should be on the "/home" page
    And I should see the "Welcome to the Chiltern Quiz League" title
    And I should see text matching "Current Season:\s+2025/2026"
    And I should see text matching "Welcome to the Chiltern Quiz League local development data set"
    And I should see text matching "The 2025-2026 season includes league, cup, subsidiary, and singleton competitions"
    And the home page tabs include:
      | Tables   |
      | Results  |
      | Fixtures |
      | Events   |
    And I should see text matching "League Tables"
    And I should see text matching "League Championship Table"
    And I should see text matching "Ashridge Arms"

  Scenario: Visitors can switch between headline results, fixtures, and events
    When I open the QuizLeague home page
    And I choose the "Results" home tab
    Then I should see text matching "Latest Results"
    And I should see text matching "Round 1"
    And I should see text matching "42\s*-\s*38"
    When I choose the "Fixtures" home tab
    Then I should see text matching "Next Fixtures"
    And I should see text matching "Chesham Comets"
    And I should see text matching "Drayton Dynamos"
    When I choose the "Events" home tab
    Then I should see text matching "Upcoming Events"
    And I should see text matching "League AGM"
    And I should see text matching "Beaconsfield Hall"
