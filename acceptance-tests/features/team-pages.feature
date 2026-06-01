Feature: Team pages
  Visitors need to browse registered teams and inspect a team's venue, standings, fixtures, results, and statistics.

  Background:
    Given I am not signed in

  Scenario: Visitors can browse registered teams from the teams page
    When I open the teams page
    Then I should be on the "/team" page
    And I should see the "Teams" title
    And I should see text matching "Active public teams in the league"
    And the page should have no detectable accessibility violations
    And the teams menu includes:
      | Start a team        |
      | Ashridge Arms       |
      | Beaconsfield Bees   |
      | Chesham Comets      |
      | Drayton Dynamos     |
    When I choose "Ashridge Arms" from the teams menu
    Then I should be on the "/team/team-ashridge-arms" page
    And I should see the "Ashridge Arms" title

  Scenario: Visitors can inspect a team detail page
    When I open the "team-ashridge-arms" team page
    Then I should be on the "/team/team-ashridge-arms" page
    And I should see the "Ashridge Arms" title
    And I should see text matching "Ashridge Arms team profile"
    And I should see text matching "Team Information"
    And I should see text matching "Home Venue"
    And I should see text matching "Current Standings"
    And I should see text matching "League Championship\s*:\s*1st"
    And I should see text matching "Challenge Cup\s*:\s*Quarter-final"
    And I should see text matching "Team Results"
    And I should see text matching "42\s*-\s*38"
    And I should see text matching "Team Fixtures"
    And I should see text matching "Chesham Comets"
    And I should see text matching "Analytics"
    And I should see text matching "Calendar"

  Scenario: Visitors can open a team's statistics page
    When I open the "team-ashridge-arms" team statistics page
    Then I should be on the "/team/team-ashridge-arms/stats" page
    And I should see the "Ashridge Arms : Graphs and Statistics" title
    And the team statistics tabs include:
      | Single Season |
      | All Seasons   |
      | Head-to-Head  |
