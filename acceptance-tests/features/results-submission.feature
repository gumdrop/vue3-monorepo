Feature: Results submission access
  Registered team members need a results area that separates public results browsing from protected result submission.

  Background:
    Given I am not signed in

  Scenario: Public visitors can navigate the main site sections
    When I open the QuizLeague home page
    Then I should see text matching "Chiltern\s+Quiz\s+League"
    And the main navigation includes:
      | Home         |
      | Teams        |
      | Competitions |
      | Results      |
      | Venues       |
      | Rules        |
      | Links        |
      | Contact      |
      | Help         |
    And the page should have no detectable accessibility violations

  Scenario: Public results visitors are offered submission instructions
    When I open the results page
    Then I should be on the "/results/all" page
    And I should see the "All Results" title
    And the results menu includes:
      | All Results     |
      | All Fixtures    |
      | Questions       |
      | Submit Results  |
    When I choose "Submit Results" from the results menu
    Then I should be on the "/results/submit/instructions" page
    And I should see the "Submit Results" title
