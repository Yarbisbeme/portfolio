Feature: Bilingual portfolio
  Scenario: Switching language keeps the reading focus
    Given I open the portfolio in "es" with the focus "qa"
    When I switch the language
    Then I am on the "en" version with the focus "qa"
    And the headline reads "I build the system."

  Scenario: Spanish headline
    Given I open the portfolio in "es"
    Then the headline reads "Construyo el sistema."
