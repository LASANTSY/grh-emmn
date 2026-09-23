Uncaught ReferenceError: etapeValide is not defined
    at CreationFiche (effectifs.tsx:410:58)
    at renderWithHooks (chunk-IFMQGFG6.js?v=ee02ac49:11548:26)
    at mountIndeterminateComponent (chunk-IFMQGFG6.js?v=ee02ac49:14926:21)
    at beginWork (chunk-IFMQGFG6.js?v=ee02ac49:15914:22)
    at HTMLUnknownElement.callCallback2 (chunk-IFMQGFG6.js?v=ee02ac49:3674:22)
    at Object.invokeGuardedCallbackDev (chunk-IFMQGFG6.js?v=ee02ac49:3699:24)
    at invokeGuardedCallback (chunk-IFMQGFG6.js?v=ee02ac49:3733:39)
    at beginWork$1 (chunk-IFMQGFG6.js?v=ee02ac49:19765:15)
    at performUnitOfWork (chunk-IFMQGFG6.js?v=ee02ac49:19198:20)
    at workLoopSync (chunk-IFMQGFG6.js?v=ee02ac49:19137:13)
chunk-IFMQGFG6.js?v=ee02ac49:14032 The above error occurred in the <CreationFiche> component:

    at CreationFiche (http://localhost:5173/src/pages/effectifs.tsx?t=1790199204696:805:26)
    at div
    at Effectifs (http://localhost:5173/src/pages/effectifs.tsx?t=1790199204696:29:17)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=ee02ac49:4112:5)
    at Outlet (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=ee02ac49:4518:26)
    at main
    at div
    at div
    at AppLayout (http://localhost:5173/src/components/layout/AppLayout.tsx?t=1790197794790:88:37)
    at RequisAuth (http://localhost:5173/src/App.tsx?t=1790199204696:32:23)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=ee02ac49:4112:5)
    at Routes (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=ee02ac49:4582:5)
    at App
    at AuthProvider (http://localhost:5173/src/contexts/AuthContext.tsx?t=1790197579191:22:32)
    at Router (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=ee02ac49:4525:15)
    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=ee02ac49:5263:5)
    at QueryClientProvider (http://localhost:5173/node_modules/.vite/deps/@tanstack_react-query.js?v=ee02ac49:26:30)

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
logCapturedError @ chunk-IFMQGFG6.js?v=ee02ac49:14032
chunk-IFMQGFG6.js?v=ee02ac49:19413 Uncaught ReferenceError: etapeValide is not defined
    at CreationFiche (effectifs.tsx:410:58)
    at renderWithHooks (chunk-IFMQGFG6.js?v=ee02ac49:11548:26)
    at mountIndeterminateComponent (chunk-IFMQGFG6.js?v=ee02ac49:14926:21)
    at beginWork (chunk-IFMQGFG6.js?v=ee02ac49:15914:22)
    at beginWork$1 (chunk-IFMQGFG6.js?v=ee02ac49:19753:22)
    at performUnitOfWork (chunk-IFMQGFG6.js?v=ee02ac49:19198:20)
    at workLoopSync (chunk-IFMQGFG6.js?v=ee02ac49:19137:13)
    at renderRootSync (chunk-IFMQGFG6.js?v=ee02ac49:19116:15)
    at recoverFromConcurrentError (chunk-IFMQGFG6.js?v=ee02ac49:18736:28)
    at performConcurrentWorkOnRoot (chunk-IFMQGFG6.js?v=ee02ac49:18684:30)