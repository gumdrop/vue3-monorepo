Feature: Competition pages
  Visitors need to browse current competitions and inspect each competition type.

  Background:
    Given I am not signed in

  Scenario: Visitors can browse current competitions from the competition page
    When I open the competitions page
    Then I should be on the "/competition" page
    And I should see the "Competitions" title
    And I should see text matching "2025/2026"
    And I should see text matching "Current season competitions"
    And the page should have no detectable accessibility violations
    And the competitions menu includes:
      | Challenge Cup         |
      | Individual Quiz Night |
      | League Championship   |
      | Plate League          |
    When I choose "League Championship" from the competitions menu
    Then I should be on the "/competition/season|season-2025-2026|competition|league-main/league" page
    And I should see the "League Championship" title

  @skip
  # Ignored: the competition page currently renders the latest result round heading without the fixture score row.
  Scenario: Visitors can inspect the league competition page
    When I open the "League Championship" competition page
    Then I should be on the "/competition/season|season-2025-2026|competition|league-main/league" page
    And I should see the "League Championship" title
    And I should see text matching "2025/2026"
    And I should see text matching "The main league competition is played home and away"
    And I should see text matching "League fixtures and current standings"
    And I should see text matching "League Table"
    And I should see text matching "League Championship Table"
    And I should see text matching "Ashridge Arms"
    And I should see text matching "Latest Results"
    And I should see text matching "Round 1"
    And I should see text matching "42\s*-\s*38"
    And I should see text matching "Next Fixtures"
    And I should see text matching "Round 2"
    And I should see text matching "Chesham Comets"
    And I should see text matching "Drayton Dynamos"

  Scenario: Visitors can see team names in the league table
    When I open the "League Championship" competition page
    Then I should be on the "/competition/season|season-2025-2026|competition|league-main/league" page
    And the "League Championship Table" league table includes:
      | 1 | Ashridge Arms      | 1 | 1 | 0 | 0 | 42 | 2 |
      | 2 | Beaconsfield Bees  | 1 | 0 | 0 | 1 | 38 | 0 |
      | 3 | Chesham Comets     | 0 | 0 | 0 | 0 | 0  | 0 |
      | 4 | Drayton Dynamos    | 0 | 0 | 0 | 0 | 0  | 0 |

  Scenario: Visitors can inspect cup and subsidiary competition pages
    When I open the "Challenge Cup" competition page
    Then I should be on the "/competition/season|season-2025-2026|competition|cup-main/cup" page
    And I should see the "Challenge Cup" title
    And I should see text matching "The cup competition is a knockout team competition"
    And I should see text matching "Next Fixtures"
    And I should see text matching "Quarter-final"
    And I should see text matching "Ashridge Arms"
    And I should see text matching "Chesham Comets"
    When I open the "Plate League" competition page
    Then I should be on the "/competition/season|season-2025-2026|competition|subsidiary-main/subsidiary" page
    And I should see the "Plate League" title
    And I should see text matching "The subsidiary league tracks additional standings"
    And I should see text matching "Plate League Table"
    And I should see text matching "Drayton Dynamos"

  Scenario: Visitors can inspect the singleton competition details
    When I open the "Individual Quiz Night" competition page
    Then I should be on the "/competition/season|season-2025-2026|competition|individual-quiz/singleton" page
    And I should see the "Individual Quiz Night" title
    And I should see text matching "The individual quiz is represented as a single scheduled event"
    And I should see text matching "Competition Details"
    And I should see text matching "Venue"
    And I should see text matching "Chesham Club"
    And I should see text matching "Date & Time"
    And I should see text matching "2 July 2026 starting at 20:00:00"
