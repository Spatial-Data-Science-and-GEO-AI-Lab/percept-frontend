import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Help, Eval, Index, Report, evalLoader, indexLoader, reportLoader, globalInfo } from './App';
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";

const CustomRouterProvider = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Index />,
      loader: async () => { return await indexLoader() }
    },
    {
      path: "eval",
      element: <Eval />,
      loader: async () => { return await evalLoader(globalInfo) }
    },
    {
      path: "report",
      element: <Report />,
      loader: async () => { return await reportLoader() }
    },
    {
      path: "help",
      element: <Help />
    }
  ]);
  return <RouterProvider router={router} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <CustomRouterProvider />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
