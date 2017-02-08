
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

const GLOBAL_ACTION_MESSAGE = '@@GLOBAL_REDUX_ACTION'

type GlobalAction = Action & {
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
 * Send Action to all Electron Processes (Main and Renderer)
 */
const globalEmit = (globalAction: GlobalAction) => {
  const action = extractAction(globalAction)

  const windows = isRenderer
    ? remote.BrowserWindow.getAllWindows()
    : BrowserWindow.getAllWindows()

  // Send to all Renderer processes
  windows.forEach(window =>
    window.webContents.send(GLOBAL_ACTION_MESSAGE, action)
  )

  // Send to Main process
  if (isRenderer)
    ipcRenderer.send(GLOBAL_ACTION_MESSAGE, action)
  else
    ipcMain.emit(GLOBAL_ACTION_MESSAGE, null, action)
}

/**
 * Renderer Process Middleware dispatching Global Actions to Main Process
 */
const middleware: Middleware = ({ dispatch }: MiddlewareAPI<any>) => {

  // Listen for Global Actions dispatched to the Process
  if (isRenderer)
    ipcRenderer.on(GLOBAL_ACTION_MESSAGE, (_, action: Action) =>
      dispatch(action)
    )
  else
    ipcMain.on(GLOBAL_ACTION_MESSAGE, (_, action: GlobalAction) =>
      dispatch(action)
    )

  return (next: Dispatch<any>) => (action: Action) =>
    isGlobalAction(action)
      ? globalEmit(action)
      : next(action)
}

export default middleware
