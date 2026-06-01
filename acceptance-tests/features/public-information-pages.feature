Feature: Public information pages
  Visitors need the static information pages to show league, venue, contact, and help content.

  Background:
    Given I am not signed in

  Scenario: Visitors can browse venues and open a venue detail page
    When I open the venues page
    Then I should be on the "/venue" page
    And I should see the "Venues" title
    And I should see text matching "Venues used by active teams and fixtures"
    And the page should have no detectable accessibility violations
    And the venues menu includes:
      | Ashridge Arms     |
      | Beaconsfield Hall |
      | Chesham Club      |
    When I choose "Ashridge Arms" from the venues menu
    Then I should be on the "/venue/venue-ashridge-arms" page
    And I should see the "Ashridge Arms" title
    And I should see text matching "Address\s*:"
    And I should see text matching "1 High Street, Ashridge HP1 1AA"
    And I should see text matching "quiz@ashridge.example"
    And I should see text matching "https://example.com/ashridge-arms"
    And I should see text matching "01494 010101"

  Scenario: Visitors can read the rules page
    When I open the rules page
    Then I should be on the "/rules" page
    And I should see the "Rules" title
    And I should see text matching "League rules"
    And I should see text matching "Matches are played between two teams"
    And I should see text matching "Results should be submitted promptly"

  Scenario: Visitors can read the links page
    When I open the links page
    Then I should be on the "/links" page
    And I should see the "Links" title
    And I should see text matching "Useful league links and resources for local quiz teams"

  Scenario: Visitors can find contact routes and open the secretary form
    When I open the contact page
    Then I should be on the "/contact" page
    And I should see the "Contact Us" title
    And I should see text matching "Starting a New Team"
    And I should see text matching "League Secretary"
    And I should see text matching "teams page"
    And I should see text matching "Website Queries"
    And I should see text matching "Webmaster"
    And I should not see text matching "Team Mobile Numbers"
    When I choose "League Secretary" from the contact page
    Then I should see text matching "Contact League Secretary"
    And the "Your email address" field should be visible
    And the "Message" field should be visible
    And the "Send" button should be visible

  Scenario: Visitors can read the help page sections
    When I open the help page
    Then I should be on the "/help" page
    And I should see the "Help" title
    And the help menu includes:
      | Overview           |
      | Login              |
      | Submitting Results |
    And I should see text matching "Overview"
    And I should see text matching "Use this help page to find guidance"
    And I should see text matching "Login"
    And I should see text matching "Registered users can sign in"
    And I should see text matching "Submitting Results"
    And I should see text matching "Team members can submit results"
