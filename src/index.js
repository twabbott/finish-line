import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import App from './components/app/App';
import * as serviceWorker from './serviceWorker';

const root = document.getElementById('root');
ReactDOM.render(
  <App />, 
  root
);

serviceWorker.unregister();
