Feature: "How I work" never takes the scroll away
  As a visitor
  I want the corrected-score section to move with my scroll, not against it
  So that I can read it at my own pace or skip it

  Background:
    Given I open the portfolio in "es"

  Scenario: On desktop the section follows my scroll and leaves me where I stop
    Given I am on a desktop screen
    When I stop scrolling halfway through "How I work"
    Then the page stays where I left it
    And the measure in focus is 2

  Scenario: I can skip the section
    Given I am on a desktop screen
    When I skip "How I work"
    Then the stack section is in view

  Scenario: On a phone each cliché is struck through as it comes into view
    Given I am on a phone screen
    Then no cliché is struck yet
    When I scroll to the last measure of "How I work"
    Then every cliché I passed is struck through
