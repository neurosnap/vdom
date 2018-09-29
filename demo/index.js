const { render } = require('../dist/index');

const mutationObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    console.log(mutation);
  });
});

mutationObserver.observe(document.documentElement, {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
  attributeOldValue: true,
  characterDataOldValue: true,
});

const App = ({ children, ...props }) => ['div', { ...props }, children];

const mount = (app) => {
  render(app, document.querySelector('#app'));
};

const small = [['div', { key: '1' }, 'wow'], ['div', { key: '2' }, 'nice']];
const big = [
  ['div', { key: '3' }, 'haha'],
  ['div', { key: '2' }, 'nice'],
  ['div', { key: '1' }, 'wow'],
];
const small2 = [['div', 'wow'], ['div', 'nice']];
const big2 = [['div', 'haha'], ['div', 'nice'], ['div', 'wow']];
mount(() => [App, big]);
setTimeout(() => {
  console.log('------');
  mount(() => [App, small]);
}, 1000);
