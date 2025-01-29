# Tutorial: Resolving Stuck Funds Using the New StarkNet Snap Environment

If your funds are stuck on a non-deployed Cairo 0 or Cairo 1 account, follow the appropriate guide below to resolve the issue.

## Scenario 1: Resolving Funds Stuck on a Non-Deployed Cairo 0 Account

## Step 1: Uninstall the Current StarkNet Snap
1. Open your MetaMask wallet extension in the browser.
2. Navigate to the installed Snaps section.
3. Find the StarkNet Snap and select it.
4. Click on “Remove” to uninstall the StarkNet Snap.


### Step 2: Use the Link to Force Cairo 0 Deployment
1. Open your browser and go to the following URL:  
   [Force Cairo 0 Deployment](https://staging.snaps.consensys.io/starknet?accountDiscovery=FORCE_CAIRO_0)
2. Connect your MetaMask wallet when prompted.
3. Follow the instructions to install a special version of the StarkNet Snap (`3.1.0-staging`).

### Step 3: Fund the Cairo 0 Account and Deploy It
1. Fund your Cairo 0 account with a small amount of ETH.
2. Reload the page after funding the account (e.g. using the F5 key)
3. A pop-up will appear prompting you to **deploy your Cairo 0 account**.
   - Follow the on-screen instructions to deploy the account.
   - Confirm and authorize the transaction in your wallet.

### Step 4: Upgrade the Cairo 0 Account
1. Once the Cairo 0 account is deployed, another pop-up will appear prompting you to **upgrade the account**.
   - Follow the on-screen instructions to upgrade your account.
   - Confirm and authorize the transaction in your wallet.
2. After the upgrade, your Cairo 0 account will be fully functional, and you will be able to send funds.

### Step 5: Transfer Funds to Your Cairo 1 Account
1. Once your Cairo 0 account is functional, check your balance to confirm the funds are available.
2. Transfer all funds from the Cairo 0 account to your Cairo 1 account.  
   - Ensure you use the correct Cairo 1 address to avoid any loss of funds. In case you don't know your Cairo 1 account address you can get it from here [Force Cairo 1 Deployment](https://staging.snaps.consensys.io/starknet?accountDiscovery=FORCE_CAIRO_1).
3. Confirm and authorize the transaction in your wallet.

## Step 6: Install the Production StarkNet Snap
1. Uninstall the special StarkNet Snap version by:
   - Opening your wallet application.
   - Navigating to the installed Snaps section.
   - Finding the special StarkNet Snap and selecting "Remove".
2. Install the production version of the StarkNet Snap from the official website:  
   [Production StarkNet Snap](https://snaps.consensys.io/starknet)
3. Connect your wallet and follow the on-screen instructions to complete the installation.
4. Once installed, check your wallet to ensure the deployed Cairo 1 address is visible and active.


---

## Scenario 2: Resolving Funds Stuck on a Non-Deployed Cairo 1 Account

## Step 1: Uninstall the Current StarkNet Snap
1. Open your MetaMask wallet extension in the browser.
2. Navigate to the installed Snaps section.
3. Find the StarkNet Snap and select it.
4. Click on “Remove” to uninstall the StarkNet Snap.

### Step 2: Use the Link to Force Cairo 1 Deployment
1. Open your browser and go to the following URL:  
   [Force Cairo 1 Deployment](https://staging.snaps.consensys.io/starknet?accountDiscovery=FORCE_CAIRO_1)
2. Connect your MetaMask wallet when prompted.
3. Follow the instructions to install a special version of the StarkNet Snap (`3.1.0-staging`).

### Step 3: Deploy the Cairo 1 Account by Initiating a Transaction
1. Once connected, fund your Cairo 1 account with a small amount of ETH (if not already funded).
2. Initiate any transaction (e.g., sending tokens) from the Cairo 1 account.
3. This transaction will automatically deploy the Cairo 1 account.
4. Confirm and authorize the transaction in your wallet.

### Step 4: Transfer Funds from Cairo 0 to Cairo 1
1. Once your Cairo 1 account is deployed copy your Cairo 1 address and return to the link for [Force Cairo 0 Deployment](https://staging.snaps.consensys.io/starknet?accountDiscovery=FORCE_CAIRO_0) to view your Cairo 0 account.
2. Transfer all funds from the Cairo 0 account to the deployed Cairo 1 account.  
   - Ensure you enter the correct Cairo 1 address to avoid any loss of funds.
3. Confirm and authorize the transaction in your wallet.

## Step 5: Install the Production StarkNet Snap
1. Uninstall the special StarkNet Snap version by:
   - Opening your wallet application.
   - Navigating to the installed Snaps section.
   - Finding the special StarkNet Snap and selecting "Remove".
2. Install the production version of the StarkNet Snap from the official website:  
   [Production StarkNet Snap](https://snaps.consensys.io/starknet)
3. Connect your wallet and follow the on-screen instructions to complete the installation.
4. Once installed, check your wallet to ensure the deployed Cairo 1 address is visible and active.


By following these steps, you should be able to resolve the issue with your stuck funds. If you encounter any issues during this process, please contact support for assistance.