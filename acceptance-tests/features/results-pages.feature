Feature: Results pages
  Visitors need to browse published results, upcoming fixtures, question papers, and result submission guidance.

  Background:
    Given I am not signed in

  Scenario: Visitors can inspect all published results
    When I open the all results page
    Then I should be on the "/results/all" page
    And I should see the "All Results" title
    And I should see text matching "2025/2026"
    And the page should have no detectable accessibility violations
    And the results menu includes:
      | All Results    |
      | All Fixtures   |
      | Questions      |
      | Submit Results |
    And I should see text matching "7 May 2026"
    And I should see text matching "League Championship"
    And I should see text matching "Round 1"
    And I should see text matching "Ashridge Arms"
    And I should see text matching "Beaconsfield Bees"
    And I should see text matching "42\s*-\s*38"

  Scenario: Visitors can inspect upcoming fixtures from the results area
    When I open the all fixtures page
    Then I should be on the "/fixtures/all" page
    And I should see the "All Fixtures" title
    And the results menu includes:
      | All Results    |
      | All Fixtures   |
      | Questions      |
      | Submit Results |
    And I should see text matching "4 Jun 2026"
    And I should see text matching "League Championship"
    And I should see text matching "Round 2"
    And I should see text matching "Chesham Comets"
    And I should see text matching "Drayton Dynamos"
    And I should see text matching "11 Jun 2026"
    And I should see text matching "Challenge Cup"
    And I should see text matching "Quarter-final"

  Scenario: Visitors can open an available question paper
    When I open the questions page
    Then I should be on the "/results/questions" page
    And I should see the "Questions" title
    And I should see text matching "2025/2026"
    And I should see text matching "11 June 2026\s+:\s+Challenge Cup\s+:\s+Quarter-final"
    And the "11 June 2026 : Challenge Cup : Quarter-final" link should target "https://storage.googleapis.com/public.chilternquizleague.uk/questions/2025-26/cup%20final.pdf"

  Scenario: Public visitors can open result submission guidance
    When I open the submit result instructions page
    Then I should be on the "/results/submit/instructions" page
    And I should see the "Submit Results" title
    And the results menu includes:
      | All Results    |
      | All Fixtures   |
      | Questions      |
      | Submit Results |
