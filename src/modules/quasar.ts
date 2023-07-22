/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Quasar, TouchPan } from 'quasar'
import { type UserModule } from '~/types'
import 'quasar/dist/quasar.css'
import '~/quasar/variables.sass'

export const install: UserModule = ({ isClient, app }) => {
  if (!isClient)
    return
  app.use(Quasar, {
    plugins: {},
    config: {},
  })

  app.directive('touch-pan', TouchPan)
}
