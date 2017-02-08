import { Action, Middleware, MiddlewareAPI, Dispatch } from 'redux'
import { ipcRenderer, ipcMain } from 'electron'

type GlobalAction = Action & {
  type: string
  global?: true
}

const GLOBAL_ACTION_MESSAGE = 'GLOBAL_REDUX_ACTION'

/**
 * Detects if a Redux Action is meant to be dispatched globally
 */
const isActionGlobal = (action: GlobalAction) =>
  action.global === true

/**
 * Return a copy of given Action with global attribute removed
 * to dispatch it without being intercepted once again by the middleware
 */
const extractAction = (action: GlobalAction): Action => {
  const localAction = { ...action }
  delete localAction.global
  return localAction
}

/**
 * Called from Main Process to dispatch Action to all Renderer Processes
 */
const dispatchGlobally =
  (action: Action, windows: Electron.BrowserWindow[]) => {
    windows.forEach(window =>
      window.webContents.send(GLOBAL_ACTION_MESSAGE, extractAction(action))
    )
  }

/**
 * Creates a Redux Middleware for Main Process to dispatch
 * a Global Action between all Electron Processes
 */
export const createGlobalDispatchMainMiddleware =
  <S>(getWindows: (state?: S) => Electron.BrowserWindow[]): Middleware =>
    ({ dispatch, getState }: MiddlewareAPI<S>) => {

      // Listen for Global Actions dispatched to the Process
      ipcMain.on(GLOBAL_ACTION_MESSAGE, (_, action: Action) =>
        dispatch(action)
      )

      return (next: Dispatch<S>): Dispatch<S> => (action: GlobalAction) => {
        if (isActionGlobal(action))
          dispatchGlobally(action, getWindows(getState()))

        return next(action)
      }
    }

/**
 * Redux Middleware for Renderer Process to automatically dispatch
 * a Global Action between all Electron processes
 */
export const globalDispatchRendererMiddleware: Middleware =
  ({ dispatch }: MiddlewareAPI<any>) => {

    // Listen for Global Actions dispatched to the Process
    ipcRenderer.on(GLOBAL_ACTION_MESSAGE, (_, action: Action) =>
      dispatch(action)
    )

    return (next: Dispatch<any>) => (action: Action) =>
      isActionGlobal(action)
        ? ipcRenderer.send(GLOBAL_ACTION_MESSAGE, action)
        : next(action)
  }
