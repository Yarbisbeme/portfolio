Feature: Accessibility
  Scenario Outline: No serious or critical accessibility violations
    Given I open the portfolio in "<lang>"
    Then the page has no serious accessibility violations

    Examples:
      | lang |
      | es   |
      | en   |

  Scenario: Keyboard users can skip straight to the content
    Given I open the portfolio in "es"
    When I press Tab
    Then the skip link is focused and visible

  Scenario: Every image describes itself
    Given I open the portfolio in "en"
    Then every visible image has a text alternative
