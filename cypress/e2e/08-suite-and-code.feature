Feature: The suite and the code are part of the score too
  As a reviewer
  I want to replay the suite step by step and read the code
  So that I can check the evidence without leaving the portfolio

  Scenario: The playhead follows the step I choose
    Given I open the suite page in "es"
    Then the playhead is on step 1
    When I go to the next step
    Then the playhead is on step 2
    And the first 2 notes have sounded

  Scenario Outline: The suite and code pages are accessible
    Given I open the <page> page in "<lang>"
    Then the page has no serious accessibility violations

    Examples:
      | page  | lang |
      | suite | es   |
      | suite | en   |
      | code  | es   |
      | code  | en   |
