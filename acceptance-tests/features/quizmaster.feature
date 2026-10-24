Feature: Question Master access control
  The experimental Question Master section is restricted to signed-in users and is
  not advertised anywhere in the public site navigation.

  Background:
    Given I am not signed in

  Scenario: Unauthenticated visitors are redirected to sign in
    When I open the Question Master page
    Then I should be on the "/login" page

  Scenario: The Question Master section is not shown in the site navigation
    When I open the QuizLeague home page
    Then the main navigation includes:
      | Home         |
      | Teams        |
      | Competitions |
      | Results      |
      | Venues       |
      | Rules        |
      | Links        |
      | Contact      |
      | Help         |
    And there is no link named "Question Master"
