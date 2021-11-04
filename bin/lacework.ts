import{ App } from '@aws-cdk/core'
import { LaceworkCfgStack } from '../lib/lacework-cfg-stack'

const app = new App();
new LaceworkCfgStack(app, 'LaceworkCfgStack', {
  envName: process.env.ENVIRONMENT
})
