const delay = Number(Cypress.env("slowMs") || 0);
if (!Number.isInteger(delay) || delay < 0 || delay > 5000) {
  throw new Error("slowMs must be an integer between 0 and 5000 milliseconds");
}

// Delays are opt-in for visual debugging; normal runs still synchronize on API/UI state.
if (delay > 0) {
  Cypress.Commands.overwrite<"click", "element">("click", (original, subject, ...args) => {
    return original(subject, ...args).then((result) => Cypress.Promise.delay(delay).then(() => result));
  });
  Cypress.Commands.overwrite<"type", "element">("type", (original, subject, ...args) => {
    return original(subject, ...args).then((result) => Cypress.Promise.delay(delay).then(() => result));
  });
  Cypress.Commands.overwrite<"clear", "element">("clear", (original, subject, ...args) => {
    return original(subject, ...args).then((result) => Cypress.Promise.delay(delay).then(() => result));
  });
}
