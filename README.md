Redux Electron Global Dispatch
==============================

Redux Middleware for Global Actions dispatch between Electron processes


Why this package?
-----------------

**TL;DR** Performance.

Keeping all Stores from your Electron app in sync is not complicated, but dispatching an Action through IPC has a cost: The action is serialized, sent as a text message, and then unserialized, before being dispatched to the Store.

In the case of an application where a lot of actions get dispatched, this can lead to performance issues, and unnecessary resource usage.

This middleware allows you to easily define which actions will be dispatched globally, permitting to reduce IPC usage.


Install
-------

```sh
npm install redux-electron-global-dispatch
```


Global Actions
--------------

A global action is just an action which has a `global` attribute set to `true`:

```ts
const globalAction = {
  type: 'INCREMENT',
  global: true
}
```

A global action will be intercepted by the middleware and dispatched to all Electron processes which use the middleware (Main and Renderer).


Setup
-----

Simply import the middleware and apply it to your Store.

```ts
import globalDispatchMiddleware from 'redux-electron-global-dispatch'

const enhancer = applyMiddleware(globalDispatchMiddleware)
const store = createStore(reducer, enhancer)
```

You're all set! All global actions will now automatically be dispatched to all Redux Stores using the middleware.
