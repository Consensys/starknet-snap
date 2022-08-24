export interface ITestingAccount {
    address?: string
    password: string
    recovery_words: string
}

export interface IAccountsConf {
    testingAccounts: ITestingAccount[]
}
  