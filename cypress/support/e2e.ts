import "./commands";
import "./axe";

beforeEach(() => {
  cy.clearCookies();
  cy.window({ log: false }).then((window) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});
