import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { DrizzleProvider } from 'drizzle-react';
import Metamask from './components/Metamask';
import drizzleOptions from './drizzleOptions';

import store from './store';

ReactDOM.render(
  <DrizzleProvider options={drizzleOptions} store={store}>
    <Metamask>
      <App />
    </Metamask>
  </DrizzleProvider>,
  document.getElementById('root'),
);
registerServiceWorker();
