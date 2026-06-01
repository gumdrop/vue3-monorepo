Feature: Maintenance season pages
  Maintainers need the maintenance app to expose seasons and their child editors.

  Background:
    Given maintenance authentication is bypassed for acceptance tests

  Scenario: Maintainers can browse seeded seasons and review a season edit page
    When I open the maintenance "/season" page
    Then I should be on the maintenance "/season" page
    And I should see text matching "Chiltern Quiz League Maintenance"
    And I should see text matching "Seasons"
    And the page should have no detectable accessibility violations
    And the maintain season list includes:
      | 2025/2026 |
      | 2024/2025 |
    And the "Add Season" button should be visible
    When I choose "2025/2026" from the maintain season list
    Then I should be on the maintenance "/season/season-2025-2026" page
    And I should see text matching "Edit Season"
    And the "Start Year" field should contain "2025"
    And the "End Year" field should contain "2026"
    And I should see text matching "Text"
    And the "Mime Type" selection should display "text/plain"
    And the "Text" field should contain "The 2025-2026 season includes league, cup, subsidiary, and singleton competitions."
    And I should see text matching "Competitions"
    And the maintain season competitions include:
      | League Championship (league)     |
      | Challenge Cup (cup)              |
      | Individual Quiz Night (singleton) |
      | Plate League (subsidiary)        |
    And the "Add Competition" button should be visible
    And the "Save Text" button should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can open the add season form
    When I open the maintenance "/season" page
    And I click the "Add Season" button
    Then I should be on the maintenance "/season/new" page
    And I should see text matching "Add Season"
    And the "Start Year" field should be visible
    And the "End Year" field should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can review a season competition child page
    When I open the maintenance "/season/season-2025-2026/competition/league-main" page
    Then I should be on the maintenance "/season/season-2025-2026/competition/league-main" page
    And I should see text matching "Edit Competition"
    And the "Name" field should contain "League Championship"
    And the "Text Name" field should contain "league-competition-note"
    And the "Icon" field should contain "mdi-table"
    And the "Type" selection should display "league"
    And the "Duration" field should contain "7200"
    And the "Start Time" field should contain "20:00:00"
    And the "Win Points" field should contain "2"
    And the "Draw Points" field should contain "1"
    And the "Loss Points" field should contain "0"
    And the "Mime Type" selection should display "text/plain"
    And the "Text" field should contain "League fixtures and current standings."
    And I should see text matching "League Tables"
    And the maintain competition league tables include:
      | League Championship Table |
    And I should see text matching "Fixtures"
    And the maintain competition fixture groups include:
      | Round 1 | 2026-05-07 |
      | Round 2 | 2026-06-04 |
    And the "Add Table" button should be visible
    And the "Add Fixtures" button should be visible
    And the "Save Text" button should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can open the add competition form for a season
    When I open the maintenance "/season/season-2025-2026/competition/new" page
    Then I should be on the maintenance "/season/season-2025-2026/competition/new" page
    And I should see text matching "Add Competition"
    And the "Name" field should be visible
    And the "Text Name" field should be visible
    And the "Icon" field should be visible
    And the "Type" selection should display "league"
    And the "Duration" field should contain "1"
    And the "Start Time" field should be visible
    And the "Win Points" field should be visible
    And the "Draw Points" field should be visible
    And the "Loss Points" field should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can review a fixture group child page
    When I open the maintenance "/season/season-2025-2026/competition/league-main/fixtures/league-round-1" page
    Then I should be on the maintenance "/season/season-2025-2026/competition/league-main/fixtures/league-round-1" page
    And I should see text matching "Edit Fixture Group"
    And the "Description" field should contain "Round 1"
    And the "Date" field should contain "2026-05-07"
    And the "Start Time" field should contain "20:00:00"
    And the "Questions URL" field should be visible
    And I should see text matching "AI Results Summary"
    And I should see text matching "No AI summary has been generated for this fixture group yet."
    And the "Regenerate AI Summary" button should be visible
    And I should see text matching "Fixtures"
    And the maintain fixture list includes:
      | Ashridge Arms vs Beaconsfield Bees |
    And the "Add Fixture" button should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can open the add fixture group form
    When I open the maintenance "/season/season-2025-2026/competition/league-main/fixtures/new" page
    Then I should be on the maintenance "/season/season-2025-2026/competition/league-main/fixtures/new" page
    And I should see text matching "Add Fixture Group"
    And the "Description" field should be visible
    And the "Date" field should be visible
    And the "Start Time" field should contain "20:00"
    And the "Questions URL" field should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can review a league table child page
    When I open the maintenance "/season/season-2025-2026/competition/league-main/leaguetable/league-table-main" page
    Then I should be on the maintenance "/season/season-2025-2026/competition/league-main/leaguetable/league-table-main" page
    And I should see text matching "Edit League Table"
    And the "Description" field should contain "League Championship Table"
    And I should see text matching "Team"
    And I should see text matching "Position"
    And I should see text matching "League Pts"
    And I should see text matching "Rows are usually managed automatically based on results."
    And the maintain league table teams include:
      | Ashridge Arms      |
      | Beaconsfield Bees  |
      | Chesham Comets     |
      | Drayton Dynamos    |
    And the "Recalculate Positions" button should be visible
    And the "Add Row" button should be visible
    And the "Save" button should be visible

  Scenario: Maintainers can open the add league table form
    When I open the maintenance "/season/season-2025-2026/competition/league-main/leaguetable/new" page
    Then I should be on the maintenance "/season/season-2025-2026/competition/league-main/leaguetable/new" page
    And I should see text matching "Add League Table"
    And the "Description" field should be visible
    And I should see text matching "Rows are usually managed automatically based on results."
    And the "Recalculate Positions" button should be visible
    And the "Recalculate Positions" button should be disabled
    And the "Add Row" button should be visible
    And the "Save" button should be visible
