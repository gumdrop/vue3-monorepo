Feature: Results roundups
  Visitors need to browse AI roundups of results.

  Scenario: Public visitors can view an AI results roundup
    Given I am not signed in
    When I open the results roundups page
    Then I should be on the "/results/roundups" page
    And I should see the "Roundups" title
    And I should see a "Roundup" button
    When I click the "Roundup" button
    Then the "AI Roundup" popup should be visible
    And I should see text matching "Summary for the match"
    And I should see the roundup content in a text box
