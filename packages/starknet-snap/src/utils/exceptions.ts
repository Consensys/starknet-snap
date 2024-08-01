import { SnapError } from '@metamask/snaps-sdk';

// Extend SnapError to allow error message visible to client
export class UpgradeRequiredError extends SnapError {
  constructor(message?: string) {
    super(message ?? 'Upgrade required');
  }
}

export class DeployRequiredError extends SnapError {
  constructor(message?: string) {
    super(
      message ??
        'Cairo 0 contract address balance is not empty, deploy required',
    );
  }
}
