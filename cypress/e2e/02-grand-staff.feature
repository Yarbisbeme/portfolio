Feature: The grand staff responds to the projects
  The stack is drawn as notes on two staves.
  Each project lights the notes it really uses, and each note points back to its projects.

  Background:
    Given I open the portfolio in "es"

  Scenario Outline: Focusing a project lights only its notes
    When I focus the project "<project>"
    Then only these notes are sounding: "<notes>"

    Examples:
      | project      | notes                                               |
      | YBank        | PostgreSQL, WebdriverIO, Appium                     |
      | Eikôn        | C#, .NET Core, FastAPI, SQL Server, xUnit, Playwright |
      | TMM          | WebdriverIO, Appium, Cucumber, SigNoz               |
      | Los Hidalgos | C#, ASP.NET, SQL Server                             |

  Scenario: A note marks the projects that use it
    When I point at the note "SQL Server"
    Then these projects are marked: "eikon, los-hidalgos"

  Scenario: A note used by one project marks only that project
    When I point at the note "Cucumber"
    Then these projects are marked: "tmm"

  Scenario Outline: The grand staff fits at every width
    Given I am on a <width> pixels wide screen
    Then the grand staff fits inside the page

    Examples:
      | width |
      | 320   |
      | 375   |
      | 430   |
      | 768   |
      | 1024  |
      | 1280  |
      | 1440  |
