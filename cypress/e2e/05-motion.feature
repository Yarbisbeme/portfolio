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

  Scenario: The score plays its entrance and then rests
    Given I open the portfolio in "es"
    Then the entrance of the score finishes
    And the whole grand staff is visible

  Scenario: A playback cursor follows the pointer over the grand staff
    Given I am on a desktop screen
    And the entrance of the score finishes
    When I sweep the pointer across the grand staff
    Then the playback cursor is shown
    And the notes it crossed were struck

  Scenario: Reduced motion shows the score at rest from the start
    Given the visitor prefers reduced motion
    And I open the portfolio in "es"
    Then the score was never hidden
    And every section closes with a full double barline
