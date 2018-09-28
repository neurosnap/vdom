const { render } = require('../dist/index');

const App = ({ children, style, ...props }) => [
  'div',
  [['div', { style, ...props }, children]],
];

const mount = (app) => {
  render(app, document.querySelector('#app'));
};

mount(() => [App, { style: { backgroundColor: 'green' } }, 'wow']);
setTimeout(() => {
  console.log('------');
  mount(() => [
    App,
    {
      style: { backgroundColor: 'red', fontSize: '25px' },
    },
    [
      'div',
      [
        'div',
        {
          onClick: () => {
            console.log('CLICK');
          },
        },
        'test',
      ],
    ],
  ]);
}, 1000);
