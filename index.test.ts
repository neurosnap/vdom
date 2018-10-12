import { render } from './index';

const resetDOM = () => {
  document.body.innerHTML = '';
};

beforeEach(() => {
  resetDOM();
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb());
});

afterEach(() => {
  (window.requestAnimationFrame as any).mockRestore();
});

test('render div to dom', (done) => {
  const el = ['div', 'test'];
  render(el, document.body).then(() => {
    expect(document.body.innerHTML).toEqual('<div>test</div>');
    done();
  });
});

test('should render recursively', (done) => {
  const el = ['div', ['div', { className: 'nested' }, ['span', 'hi there']]];

  render(el, document.body).then(() => {
    expect(document.body.innerHTML).toEqual(
      '<div><div class="nested"><span>hi there</span></div></div>',
    );
    done();
  });
});

test('should render component', (done) => {
  const Tmp = () => {
    return ['div', 'test'];
  };
  const el = [Tmp];
  render(el, document.body).then(() => {
    expect(document.body.innerHTML).toEqual('<div>test</div>');
    done();
  });
});

test('symbolic expressions should render to the dom', (done) => {
  const el = ['div', ['div', { className: 'nested' }, ['span', 'hi there']]];

  render(el, document.body).then(() => {
    expect(document.body.innerHTML).toEqual(
      '<div><div class="nested"><span>hi there</span></div></div>',
    );
    done();
  });
});

test('symbolic expressions children as single s-exp should render to the dom', (done) => {
  const el = ['div', ['div', { className: 'nested' }, ['span', 'hi there']]];

  render(el, document.body).then(() => {
    expect(document.body.innerHTML).toEqual(
      '<div><div class="nested"><span>hi there</span></div></div>',
    );
    done();
  });
});

test('render nested functional component', (done) => {
  const App = () => ['span', 'hi there'];
  const el = ['div', ['div', App]];

  render(el, document.body).then(() => {
    expect(document.body.innerHTML).toEqual(
      '<div><div><span>hi there</span></div></div>',
    );
    done();
  });
});

test('patch updating dom class', (done) => {
  const elOne = ['div', { className: 'nested' }, 'hi there'];
  const elTwo = ['div', { className: 'wow' }, 'hi there'];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div class="wow">hi there</div>',
      );
      done();
    });
});

test('patch remove dom class', (done) => {
  const elOne = ['div', { className: 'nested' }, 'hi there'];
  const elTwo = ['div', 'hi there'];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual('<div class="">hi there</div>');
      done();
    });
});

/* test('patch add dom class', () => {
  const elOne = h({
    tag: 'div',
    children: 'hi there',
  });
  const elTwo = h({
    tag: 'div',
    props: { className: 'nested' },
    children: 'hi there',
  });

  render(elOne, document.body);
  render(elTwo, document.body);
  expect(document.body.innerHTML).toEqual('<div class="nested">hi there</div>');
});

test('patch replace text with div', () => {
  const elOne = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        children: 'hi there',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        children: [
          h({ tag: 'div', children: 'another' }),
          h({ tag: 'span', children: 'wow' }),
        ],
      }),
    ],
  });

  render(elOne, document.body);
  render(elTwo, document.body);
  expect(document.body.innerHTML).toEqual(
    '<div><div><div>another</div><span>wow</span></div></div>',
  );
});

test('patch replace div with text', () => {
  const elOne = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        children: 'hi there',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        children: [h({ tag: 'div', children: 'another' })],
      }),
    ],
  });

  render(elTwo, document.body);
  render(elOne, document.body);
  expect(document.body.innerHTML).toEqual('<div><div>hi there</div></div>');
});

test('patch replace nested div with div children', () => {
  const elOne = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        children: 'hi there',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        children: [h({ tag: 'div', children: 'one' })],
      }),
      h({
        tag: 'div',
        children: [h({ tag: 'div', children: 'more' })],
      }),
    ],
  });

  render(elOne, document.body);
  render(elTwo, document.body);
  expect(document.body.innerHTML).toEqual(
    '<div><div><div>one</div></div><div><div>more</div></div></div>',
  );
});

test('patch add key', () => {
  const elOne = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { key: '1' },
        children: 'hi there',
      }),
      h({
        tag: 'div',
        props: { key: '2' },
        children: 'yo',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { key: '1' },
        children: 'hi there',
      }),
      h({
        tag: 'div',
        props: { key: '2' },
        children: 'yo',
      }),
      h({
        tag: 'div',
        props: { key: '3' },
        children: 'cool',
      }),
    ],
  });

  render(elOne, document.body);
  render(elTwo, document.body);
  expect(document.body.innerHTML).toEqual(
    '<div><div>hi there</div><div>yo</div><div>cool</div></div>',
  );
});

test('patch remove key', () => {
  const elOne = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { key: '1' },
        children: 'hi there',
      }),
      h({
        tag: 'div',
        props: { key: '2' },
        children: 'yo',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { key: '1' },
        children: 'hi there',
      }),
      h({
        tag: 'div',
        props: { key: '2' },
        children: 'yo',
      }),
      h({
        tag: 'div',
        props: { key: '3' },
        children: 'cool',
      }),
    ],
  });

  render(elTwo, document.body);
  render(elOne, document.body);
  expect(document.body.innerHTML).toEqual(
    '<div><div>hi there</div><div>yo</div></div>',
  );
});

test('patch rearrange keys', () => {
  const elOne = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { key: '1' },
        children: 'hi there',
      }),
      h({
        tag: 'div',
        props: { key: '2' },
        children: 'yo',
      }),
      h({
        tag: 'div',
        props: { key: '3' },
        children: 'cool',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { key: '3' },
        children: 'cool',
      }),
      h({
        tag: 'div',
        props: { key: '1' },
        children: 'hi there',
      }),
      h({
        tag: 'div',
        props: { key: '2' },
        children: 'yo',
      }),
    ],
  });

  render(elOne, document.body);
  render(elTwo, document.body);
  expect(document.body.innerHTML).toEqual(
    '<div><div>cool</div><div>hi there</div><div>yo</div></div>',
  );
});

test('patch insert key', () => {
  const elOne = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { key: '1' },
        children: 'hi there',
      }),
      h({
        tag: 'div',
        props: { key: '3' },
        children: 'cool',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { key: '1' },
        children: 'hi there',
      }),
      h({
        tag: 'div',
        props: { key: '2' },
        children: 'yo',
      }),
      h({
        tag: 'div',
        props: { key: '3' },
        children: 'cool',
      }),
    ],
  });

  render(elOne, document.body);
  render(elTwo, document.body);
  expect(document.body.innerHTML).toEqual(
    '<div><div>hi there</div><div>yo</div><div>cool</div></div>',
  );
});

test('adding event, onClick should be called', () => {
  const onClick = jest.fn();
  const el = h({
    tag: 'div',
    props: { onClick },
    children: 'click me',
  });

  render(el, document.body);
  const div = document.querySelector('div');
  div.click();
  expect(onClick).toHaveBeenCalled();
});

test('removing event, onClick should not be called', () => {
  const onClick = jest.fn();
  const elOne = h({
    tag: 'div',
    props: { onClick },
    children: 'click me',
  });
  const elTwo = h({
    tag: 'div',
    children: 'cannot click me',
  });

  render(elOne, document.body);
  render(elTwo, document.body);

  const div = document.querySelector('div');
  div.click();
  expect(onClick).not.toHaveBeenCalled();
});

test('width attribute', () => {
  const el = h({
    tag: 'div',
    props: { width: '100%', className: 'app' },
    children: [
      h({
        tag: 'div',
        children: 'hi there',
      }),
    ],
  });

  render(el, document.body);
  expect(document.body.innerHTML).toEqual(
    '<div width="100%" class="app"><div>hi there</div></div>',
  );
});

test('svg element', () => {
  const el = h({
    tag: 'div',
    children: [
      h({
        tag: 'svg',
        children: [
          h({
            tag: 'circle',
            props: {
              cx: 5,
              cy: 5,
              r: 4,
              stroke: 'red',
              fill: 'grey',
            },
          }),
        ],
      }),
    ],
  });

  render(el, document.body);
  expect(document.body.innerHTML).toEqual(
    '<div><svg><circle cx="5" cy="5" r="4" stroke="red" fill="grey"></circle></svg></div>',
  );
});

test('svg element xlink attribute', () => {
  const el = h({
    tag: 'div',
    children: [
      h({
        tag: 'svg',
        props: {
          'xlink:href': 'https://google.com',
        },
      }),
    ],
  });
  const NS_XLINK = 'http://www.w3.org/1999/xlink';

  render(el, document.body);
  const svg = document.querySelector('svg');
  expect(svg.getAttributeNS(NS_XLINK, 'href')).toEqual('https://google.com');
  expect(document.body.innerHTML).toEqual(
    '<div><svg xlink:href="https://google.com"></svg></div>',
  );
});

test('svg element remove xlink attribute', () => {
  const el = h({
    tag: 'div',
    children: [
      h({
        tag: 'svg',
        props: {
          'xlink:href': 'https://google.com',
        },
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: [
      h({
        tag: 'svg',
        children: [],
      }),
    ],
  });

  render(el, document.body);
  render(elTwo, document.body);
  expect(document.body.innerHTML).toEqual('<div><svg></svg></div>');
});

test('componentDidMount', () => {
  const componentDidMount = jest.fn();
  const el = h({
    tag: 'div',
    props: { componentDidMount },
  });

  render(el, document.body);
  expect(componentDidMount).toHaveBeenCalled();
});

test('componentDidUpdate', () => {
  const componentDidUpdate = jest.fn();
  const el = h({
    tag: 'div',
    props: { componentDidUpdate },
    children: 'yo there',
  });
  const elTwo = h({
    tag: 'div',
    props: { componentDidUpdate },
    children: [
      h({
        tag: 'div',
        children: 'hi there',
      }),
    ],
  });

  render(el, document.body);
  render(elTwo, document.body);
  expect(componentDidUpdate).toHaveBeenCalled();
});

test('componentWillUnmount', () => {
  const componentWillUnmount = jest.fn();
  const el = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { componentWillUnmount },
        children: 'hi there',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: 'yo there',
  });

  render(el, document.body);
  render(elTwo, document.body);
  expect(componentWillUnmount).toHaveBeenCalled();
});

test('componentDidUnmount', () => {
  const componentDidUnmount = jest.fn();
  const el = h({
    tag: 'div',
    children: [
      h({
        tag: 'div',
        props: { componentDidUnmount },
        children: 'hi there',
      }),
    ],
  });
  const elTwo = h({
    tag: 'div',
    children: 'yo there',
  });

  render(el, document.body);
  render(elTwo, document.body);
  expect(componentDidUnmount).toHaveBeenCalled();
}); */
