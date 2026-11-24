Feature: Motion is optional
  The editorial loops only play when the visitor has not asked for reduced motion.

  Scenario: A project with a loop plays it in the preview
    Given I open the portfolio in "es"
    When I focus the project "TMM"
    Then the preview plays a loop

  Scenario: Reduced motion keeps the still image
    Given the visitor prefers reduced motion
    And I open the portfolio in "es"
    When I focus the project "TMM"
    Then the preview shows only a still image
