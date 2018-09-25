const { render } = require('../dist/index');

const App = ({ children, style }) => ['div', [['div', { style }, children]]];

const mount = (app) => {
  render(app, document.querySelector('#app'));
};

mount(() => [
  App,
  { style: { backgroundColor: 'red', fontSize: '25px' } },
  ['div', ['div', 'test']],
]);
setTimeout(() => {
  console.log('------');
  mount(() => [App, { style: { backgroundColor: 'green' } }, 'wow']);
}, 1000);
