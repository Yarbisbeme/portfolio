Feature: Sound is opt-in and never plays on its own
  As a visitor who may be in an office or on a call
  I want the portfolio to stay silent unless I ask for sound
  So that I can enjoy the piano without being surprised by it

  Background:
    Given I open the portfolio in "es" listening for audio

  Scenario: The portfolio is silent by default
    When I touch the note "Playwright"
    And I read the portfolio as "QA"
    Then no audio has been started
    And sound is off

  Scenario: Turning sound on makes the score playable and is remembered
    Given I am on a desktop screen
    When I turn sound on
    And I touch the note "Playwright"
    Then audio has been started
    When I reload the page
    Then sound is on

  Scenario: Listening to the suite is a request for sound in itself
    When I listen to the latest run
    Then audio has been started
