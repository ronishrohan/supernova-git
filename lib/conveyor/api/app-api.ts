import { ConveyorApi } from '@/lib/preload/shared'

export class AppApi extends ConveyorApi {
  version = () => this.invoke('version')
  runVaultTest = () => this.invoke('run-vault-test')
  runBlockchainTest = () => this.invoke('run-blockchain-test')
}
