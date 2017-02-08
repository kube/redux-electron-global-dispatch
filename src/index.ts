
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { Action, Middleware, MiddlewareAPI, Dispatch } from 'redux'
import { ipcRenderer, ipcMain, BrowserWindow } from 'electron'

const GLOBAL_ACTION_MESSAGE = 'GLOBAL_REDUX_ACTION'

type GlobalAction = Action & {
  type: string
  global?: true
}

const isRenderer = process.type === 'renderer'

/**
 * Detects if an Action is global
 */
const isGlobalAction = (action: GlobalAction) =>
  action.global === true

/**
 * Unset global attribute on Action to dispatch it
 * without being intercepted once again by the middleware
 */
const extractAction = (action: GlobalAction): Action => {
  const localAction = { ...action }
  delete localAction.global
  return localAction
}

/**
 * Called from Main Process to send Action to all Renderer Processes
 */
const sendToAllWindows = (action: GlobalAction) =>
  BrowserWindow.getAllWindows().forEach(window =>
    // Send action through IPC to window, where middleware will dispatch to store
    window.webContents.send(GLOBAL_ACTION_MESSAGE, extractAction(action))
  )

/**
 * Main Process Middleware dispatching Global Actions to all Windows
 */
const mainMiddleware: Middleware = ({ dispatch }: MiddlewareAPI<any>) => {

  // Listen for Global Actions dispatched to the Process
  ipcMain.on(GLOBAL_ACTION_MESSAGE, (_, action: GlobalAction) =>
    dispatch(action)
  )

  return (next: Dispatch<any>) => (action: GlobalAction) => {
    if (isGlobalAction(action))
      sendToAllWindows(action)

    return next(action)
  }
}

/**
 * Renderer Process Middleware dispatching Global Actions to Main Process
 */
const rendererMiddleware: Middleware = ({ dispatch }: MiddlewareAPI<any>) => {

  // Listen for Global Actions dispatched to the Process
  ipcRenderer.on(GLOBAL_ACTION_MESSAGE, (_, action: Action) =>
    dispatch(action)
  )

  return (next: Dispatch<any>) => (action: Action) =>
    isGlobalAction(action)
      ? ipcRenderer.send(GLOBAL_ACTION_MESSAGE, action)
      : next(action)
}

export default isRenderer ? rendererMiddleware : mainMiddleware
