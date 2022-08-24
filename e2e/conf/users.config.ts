import { IAccountsConf } from './shapes'

const config: IAccountsConf = {

  testingAccounts: [
    {
      password : process.env.PASSWORD || 'password',
      recovery_words: process.env.RECOVERY_WORDS || 'recovery_words',
    },
  ],

}

module.exports = config
