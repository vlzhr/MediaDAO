import React from "react";
import ReactDOM from "react-dom";
import { Router, Switch, Route } from "react-router-dom"
import {createBrowserHistory} from "history"

import App from "./App";
import Platform from "./Platform"

const rootElement = document.getElementById("root");
// ReactDOM.render(
//   <React.StrictMode>
//     <App title="Media DAO" />
//   </React.StrictMode>,
//   rootElement
// );

const history = createBrowserHistory();

ReactDOM.render((
  <Router history={history}>
    <Switch>
      <Route history={history} path='/creators' component={App} />
      <Route history={history} path='/' component={Platform} />
    </Switch>
  </Router>
), rootElement);