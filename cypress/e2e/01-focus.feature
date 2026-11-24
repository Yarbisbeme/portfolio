Feature: Read the portfolio through a focus
  As a recruiter
  I want to read the portfolio as Back-End or QA
  So that I only see what matters for the role I am hiring for

  Background:
    Given I open the portfolio in "es"

  Scenario: Back-End focus silences the Verify staff
    When I read the portfolio as "Back-End"
    Then the "build" staff is sounding
    And the "verify" staff is silent
    And the address keeps the focus "backend"
    And the CV link offers the "backend" version

  Scenario: QA focus silences the Build staff
    When I read the portfolio as "QA"
    Then the "verify" staff is sounding
    And the "build" staff is silent
    And the address keeps the focus "qa"
    And the CV link offers the "qa-automation" version

  Scenario: General focus offers both CVs
    When I read the portfolio as "General"
    Then both staves are sounding
    And the CV links offer 2 versions

  Scenario: A shared link opens with its focus applied
    Given I open the portfolio in "es" with the focus "qa"
    Then the selected focus is "qa"
