Feature: The whole page reads as one score
  As a recruiter scrolling past the hero
  I want the sections and the focus to follow the same musical grammar
  So that the allegory is a system, not a decoration

  Background:
    Given I open the portfolio in "es"

  Scenario: Sections are marked with rehearsal letters in order
    Then the rehearsal marks read "A,B,C,D"
    And every rehearsal mark is announced as a section

  Scenario: The piece ends with a final barline and a da capo
    Then the contact closes with a final barline
    When I follow the da capo
    Then I am back at the top of the score

  Scenario: The focus travels with me in the header
    When I read the score as "Back-End" from the header
    Then the "verify" staff is silent
    And the selected focus is "backend"
    And the address keeps the focus "backend"

  Scenario: Silent work stays readable and is announced
    When I read the portfolio as "QA"
    Then the work "eikon" is silent
    And the work "tmm" is sounding
    And silent work is announced to screen readers
    And the page has no serious accessibility violations

  Scenario Outline: Each project signs the voices it plays
    Then the work "<project>" is signed as "<sign>"

    Examples:
      | project      | sign                         |
      | ybank        | Ensamble · Build + Verify    |
      | eikon        | Solo · Build                 |
      | tmm          | Solo · Verify                |
      | los-hidalgos | Ensamble · Build + Verify    |

  Scenario: The career reads as two voices in time
    When I read the portfolio as "QA"
    Then the career voice "verify" is sounding
    And the career voice "build" is silent
    And the career voice "both" is sounding

  Scenario: The stack repeats its four functions and silences the other voice
    When I read the portfolio as "QA"
    Then the stack function "verify" is sounding
    And the stack function "build" is silent
    And the stack function "data" is silent

  Scenario: The tuning staff plays one note per scenario of the last run
    Then the tuning staff has one note per scenario in its count
    And no note is out of tune unless it is marked with a cross
