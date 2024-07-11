export class UpgradeRequiredError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export class DeployRequiredError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}
