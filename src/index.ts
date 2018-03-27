
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { Action, MiddlewareAPI, Dispatch } from 'redux'
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
    ? remote.BrowserWindow.getAllWindows().filter(
        window => window !== remote.getCurrentWindow()
      )
    : BrowserWindow.getAllWindows()

  // Send to all Renderer processes
  windows.forEach(window =>
    window.webContents.send(GLOBAL_ACTION_MESSAGE, action)
  )

  // Send to Main process
  if (isRenderer) {
    ipcRenderer.send(GLOBAL_ACTION_MESSAGE, action)
  }
}

/**
 * Middleware intercepting Global Actions to dispatch them to all processes
 */
export const createGlobalDispatchMiddleware = <A extends Action>(
  isGlobalAction: (action: A) => boolean
) => ({ dispatch }: MiddlewareAPI<any>) => {
  const ipc = isRenderer ? ipcRenderer : ipcMain

  // Listen for Global Actions dispatched to the Process
  ipc.on(GLOBAL_ACTION_MESSAGE, (_: any, action: A) =>
    dispatch(action)
  )

  return (next: Dispatch<any>) => (action: A) => {
    if (!alreadyGloballyDispatched(action) && isGlobalAction(action))
      globalEmit(action)

    next(action)
  }
}

/**
 * Middleware with default global action predicate
 */
export default createGlobalDispatchMiddleware<any>(
  action => action.global === true
)
