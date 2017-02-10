![Redux Electron Middleware](https://rawgithub.com/kube/redux-electron-global-dispatch/master/icons.svg)

Redux Electron Global Dispatch
==============================

Redux Middleware for dispatching Actions between Electron processes


Install
-------

```sh
npm install redux-electron-global-dispatch
```

How it works
------------

This middleware intercepts all actions, and in case the intercepted action
is global, it will forward it as an IPC message to all other processes.

It also listens for global action events via IPC, so each Store implementing
the middleware will effectively dispatch received global actions.

Stores that do not use the middleware won't be touched.


Global Actions
--------------

A global action is just an action which has a `global` attribute set to `true`:

```ts
const globalAction = {
  type: 'INCREMENT',
  global: true
}
```

A global action will be intercepted by the middleware and dispatched to all
Electron processes which use the middleware.


Setup
-----

Simply import the middleware and apply it to your Store:

```ts
import globalDispatchMiddleware from 'redux-electron-global-dispatch'

const enhancer = applyMiddleware(globalDispatchMiddleware)
const store = createStore(reducer, enhancer)
```

You're all set! All global actions will now automatically be dispatched to all Redux Stores using the middleware.


Custom Global Action Predicate
------------------------------

You can also define a custom global action predicate:

When you use the default export, the predicate is:

```ts
action => action.global === true
```

If you want to automatically dispatch all Increment Actions, you can do:

```ts
import { createGlobalDispatchMiddleware } from 'redux-electron-global-dispatch'

const enhancer = applyMiddleware(
  createGlobalDispatchMiddleware(action => action.type === 'INCREMENT')
)
```

Or if you want to dispatch globally all Actions without filtering:

```ts
import { createGlobalDispatchMiddleware } from 'redux-electron-global-dispatch'

const enhancer = applyMiddleware(
  createGlobalDispatchMiddleware(() => true)
)
```


Why this middleware?
--------------------

Dispatching an Action through **IPC has a cost**: the action is serialized, sent
as a text message, and then unserialized, before being effectively dispatched to the Store.

In the case of an application where a lot of actions get dispatched, on multiple
windows, dispatching all actions globally adds a lot of unnecessary resource usage,
and can lead to performance issues.

This middleware allows you to **easily filter** which actions will be dispatched globally,
preserving application **performance**.
