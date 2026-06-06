Feature: Results roundups
  Visitors need to browse AI roundups of results.

  Scenario: Public visitors can view an AI results roundup
    Given I am not signed in
    When I open the results roundups page
    Then I should be on the "/results/roundups" page
    And I should see the "Roundups" title
    And I should see text matching "Summary for the match"
