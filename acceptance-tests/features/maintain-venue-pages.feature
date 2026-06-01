Feature: Maintenance venue pages
  Maintainers need the maintenance app to expose seeded venues and venue edit forms.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can browse seeded venues and review a venue edit page
    When I open the maintenance venues page
    Then I should be on the maintenance "/venue" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And I should see text matching "Venues"
    And the maintain venue list includes:
      | Ashridge Arms      | 1 High Street, Ashridge HP1 1AA          |
      | Beaconsfield Hall  | 2 Station Road, Beaconsfield HP9 1BB     |
      | Chesham Club       | 3 Market Square, Chesham HP5 1CC         |
    And the "Add Venue" button should be visible
    When I choose "Ashridge Arms" from the maintain venue list
    Then I should be on the maintenance "/venue/venue-ashridge-arms" page
    And I should see text matching "Edit Venue"
    And the "Name" field should contain "Ashridge Arms"
    And the "Address" field should contain "1 High Street, Ashridge HP1 1AA"
    And the "Phone" field should contain "01494 010101"
    And the "Email" field should contain "quiz@ashridge.example"
    And the "Website" field should contain "https://example.com/ashridge-arms"
    And the "Image URL" field should be visible
    And the "Retired" checkbox should be unchecked
    And the "Save" button should be visible

  Scenario: Maintainers can open the add venue form
    When I open the maintenance venues page
    And I click the "Add Venue" button
    Then I should be on the maintenance "/venue/new" page
    And I should see text matching "Add Venue"
    And the "Name" field should be visible
    And the "Address" field should be visible
    And the "Phone" field should be visible
    And the "Email" field should be visible
    And the "Website" field should be visible
    And the "Image URL" field should be visible
    And the "Retired" checkbox should be unchecked
    And the "Save" button should be visible
