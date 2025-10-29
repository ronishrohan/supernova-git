import { electronAPI } from '@electron-toolkit/preload'
import { AppApi } from './app-api'
import { WindowApi } from './window-api'
import { SecurityApi } from './security-api'

export const conveyor = {
  app: new AppApi(electronAPI),
  window: new WindowApi(electronAPI),
  security: new SecurityApi(electronAPI),
}

export type ConveyorApi = typeof conveyor
