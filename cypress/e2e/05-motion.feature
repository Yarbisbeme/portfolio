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
    Given I open the portfolio in "es"
    And I am on a desktop screen
    And the entrance of the score finishes
    When I sweep the pointer across the grand staff
    Then the playback cursor is shown
    And the notes it crossed were struck

  Scenario: Reduced motion shows the score at rest from the start
    Given the visitor prefers reduced motion
    And I open the portfolio in "es"
    Then the score was never hidden
    And every section closes with a full double barline

  Scenario: Projects slide to their new place when the focus changes
    Given I open the portfolio in "es"
    And the entrance of the score finishes
    When I read the portfolio as "QA"
    Then the projects are sliding to their new order
    And the projects end at rest in the order "ybank,tmm,los-hidalgos,eikon"

  Scenario: A playback cursor sweeps the four functions of the stack
    Given I open the portfolio in "es"
    And I am on a desktop screen
    When I scroll to the stack
    Then the stack playback cursor passes
    And every function of the stack ends visible

  Scenario: The career timeline is written by the scroll
    Given I open the portfolio in "es"
    And I am on a desktop screen
    When I bring the career timeline into view
    Then the career timeline is partly written
    When I scroll past the career timeline
    Then the career timeline is fully written

  Scenario: The tuning staff plays its notes in sequence and rests
    Given I open the portfolio in "es"
    When I scroll to the tuning staff
    Then every note of the tuning staff ends visible

  Scenario: The coda draws its final barline and the da capo rewinds the score
    Given I open the portfolio in "es"
    And I am on a desktop screen
    When I scroll to the coda
    Then the final barline is fully drawn
    When I follow the da capo
    Then I am back at the top of the score
    And the playback cursor rewinds across the grand staff
