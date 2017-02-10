
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { Action, Middleware, MiddlewareAPI, Dispatch } from 'redux'
import { remote, ipcRenderer, ipcMain, BrowserWindow } from 'electron'

const isRenderer = process.type === 'renderer'
const GLOBAL_ACTION_MESSAGE = '@@GLOBAL_REDUX_ACTION'
const GLOBALLY_DISPATCHED = '__globallyDispatched'

/**
 * Check if Action was already globally dispatched
 */
const alreadyGloballyDispatched = (action: any) =>
  action[GLOBALLY_DISPATCHED] === true

/**
 * Send Action to all others Electron Processes
 */
const globalEmit = (localAction: Action) => {
  const action = {
    ...localAction,
    [GLOBALLY_DISPATCHED]: true
  }

  const windows = isRenderer
    ? remote.BrowserWindow.getAllWindows()
      .filter(window => window !== remote.getCurrentWindow())
    : BrowserWindow.getAllWindows()

  // Send to all Renderer processes
  windows.forEach(window =>
    window.webContents.send(GLOBAL_ACTION_MESSAGE, action)
  )

  // Send to Main process
  if (isRenderer)
    ipcRenderer.send(GLOBAL_ACTION_MESSAGE, action)
}

/**
 * Middleware intercepting Global Actions to dispatch them to all processes
 */
export const createGlobalDispatchMiddleware =
  <A extends Action>(isGlobalAction: (action: A) => boolean): Middleware =>
    ({ dispatch }: MiddlewareAPI<any>) => {

      // Listen for Global Actions dispatched to the Process
      if (isRenderer)
        ipcRenderer.on(GLOBAL_ACTION_MESSAGE, (_, action: A) =>
          dispatch(action)
        )
      else
        ipcMain.on(GLOBAL_ACTION_MESSAGE, (_, action: A) =>
          dispatch(action)
        )

      return (next: Dispatch<any>) => (action: A) => {
        if (!alreadyGloballyDispatched(action) && isGlobalAction(action))
          globalEmit(action)

        next(action)
      }
    }

export default createGlobalDispatchMiddleware<any>(action => action.global === true)
