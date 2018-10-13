import { createStore } from 'redux';
import { delay } from 'cofx';

import { renderFactory, render, context } from './index';

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

test('async render function', (done) => {
  function* App({ text }: any) {
    yield delay(50);
    return ['div', text];
  }

  render([App, { text: 'hi there' }], document.body).then(() => {
    expect(document.body.innerHTML).toEqual('<div>hi there</div>');
    done();
  });
});

test('patch add dom class', (done) => {
  const elOne = ['div', 'hi there'];
  const elTwo = ['div', { className: 'nested' }, 'hi there'];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div class="nested">hi there</div>',
      );
      done();
    });
});

test('patch replace text with div', (done) => {
  const elOne = ['div', ['div', 'hi there']];
  const elTwo = ['div', ['div', [['div', 'another'], ['span', 'wow']]]];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div><div><div>another</div><span>wow</span></div></div>',
      );
      done();
    });
});

test('patch replace div with text', (done) => {
  const elOne = ['div', ['div', 'hi there']];
  const elTwo = ['div', ['div', ['div', 'another']]];

  render(elTwo, document.body)
    .then(() => {
      return render(elOne, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual('<div><div>hi there</div></div>');
      done();
    });
});

test('patch replace nested div with div children', (done) => {
  const elOne = ['div', ['div', 'hi there']];
  const elTwo = ['div', [['div', ['div', 'one']], ['div', ['div', 'more']]]];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div><div><div>one</div></div><div><div>more</div></div></div>',
      );
      done();
    });
});

test('patch add key', (done) => {
  const elOne = [
    'div',
    [['div', { key: '1' }, 'hi there'], ['div', { key: '2' }, 'yo']],
  ];
  const elTwo = [
    'div',
    [
      ['div', { key: '1' }, 'hi there'],
      ['div', { key: '2' }, 'yo'],
      ['div', { key: '3' }, 'cool'],
    ],
  ];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div><div>hi there</div><div>yo</div><div>cool</div></div>',
      );
      done();
    });
});

test('patch remove key', (done) => {
  const elOne = [
    'div',
    [['div', { key: '1' }, 'hi there'], ['div', { key: '2' }, 'yo']],
  ];
  const elTwo = [
    'div',
    [
      ['div', { key: '1' }, 'hi there'],
      ['div', { key: '2' }, 'yo'],
      ['div', { key: '3' }, 'cool'],
    ],
  ];

  render(elTwo, document.body)
    .then(() => {
      return render(elOne, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div><div>hi there</div><div>yo</div></div>',
      );
      done();
    });
});

test('patch rearrange keys', (done) => {
  const elOne = [
    'div',
    [
      ['div', { key: '1' }, 'hi there'],
      ['div', { key: '2' }, 'yo'],
      ['div', { key: '3' }, 'cool'],
    ],
  ];
  const elTwo = [
    'div',
    [
      ['div', { key: '3' }, 'cool'],
      ['div', { key: '1' }, 'hi there'],
      ['div', { key: '2' }, 'yo'],
    ],
  ];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div><div>cool</div><div>hi there</div><div>yo</div></div>',
      );
      done();
    });
});

test('patch insert key', (done) => {
  const elOne = [
    'div',
    [['div', { key: '1' }, 'hi there'], ['div', { key: '3' }, 'cool']],
  ];
  const elTwo = [
    'div',
    [
      ['div', { key: '1' }, 'hi there'],
      ['div', { key: '2' }, 'yo'],
      ['div', { key: '3' }, 'cool'],
    ],
  ];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div><div>hi there</div><div>yo</div><div>cool</div></div>',
      );
      done();
    });
});

test('adding event, onClick should be called', (done) => {
  const onClick = jest.fn();
  const el = ['div', { onClick }, 'click me'];

  render(el, document.body).then(() => {
    const div = document.querySelector('div');
    div.click();
    expect(onClick).toHaveBeenCalled();
    done();
  });
});

test('removing event, onClick should not be called', (done) => {
  const onClick = jest.fn();
  const elOne = ['div', { onClick }, 'click me'];
  const elTwo = ['div', 'cannot click me'];

  render(elOne, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      const div = document.querySelector('div');
      div.click();
      expect(onClick).not.toHaveBeenCalled();
      done();
    });
});

test('width attribute', (done) => {
  const el = ['div', { width: '100%', className: 'app' }, ['div', 'hi there']];

  render(el, document.body).then(() => {
    expect(document.body.innerHTML).toEqual(
      '<div width="100%" class="app"><div>hi there</div></div>',
    );
    done();
  });
});

test('svg element', (done) => {
  const props = {
    cx: 5,
    cy: 5,
    r: 4,
    stroke: 'red',
    fill: 'grey',
  };
  const el = ['div', ['svg', ['circle', props]]];

  render(el, document.body).then(() => {
    expect(document.body.innerHTML).toEqual(
      '<div><svg><circle cx="5" cy="5" r="4" stroke="red" fill="grey"></circle></svg></div>',
    );
    done();
  });
});

test('svg element xlink attribute', (done) => {
  const el = ['div', ['svg', { 'xlink:href': 'https://google.com' }]];
  const NS_XLINK = 'http://www.w3.org/1999/xlink';

  render(el, document.body).then(() => {
    const svg = document.querySelector('svg');
    expect(svg.getAttributeNS(NS_XLINK, 'href')).toEqual('https://google.com');
    expect(document.body.innerHTML).toEqual(
      '<div><svg xlink:href="https://google.com"></svg></div>',
    );
    done();
  });
});

test('svg element remove xlink attribute', (done) => {
  const el = ['div', ['svg', { 'xlink:href': 'https://google.com' }]];
  const elTwo = ['div', ['svg']];

  render(el, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual('<div><svg></svg></div>');
      done();
    });
});

test('componentDidMount', (done) => {
  const componentDidMount = jest.fn();
  const el = ['div', { componentDidMount }];

  render(el, document.body).then(() => {
    expect(componentDidMount).toHaveBeenCalled();
    done();
  });
});

test('componentDidUpdate', (done) => {
  const componentDidUpdate = jest.fn();
  const el = ['div', { componentDidUpdate }, 'yo there'];
  const elTwo = ['div', { componentDidUpdate }, ['div', 'hi there']];

  render(el, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(componentDidUpdate).toHaveBeenCalled();
      done();
    });
});

test('componentWillUnmount', (done) => {
  const componentWillUnmount = jest.fn();
  const el = ['div', ['div', { componentWillUnmount }, 'hi there']];
  const elTwo = ['div', 'yo there'];

  render(el, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(componentWillUnmount).toHaveBeenCalled();
      done();
    });
});

test('componentDidUnmount', (done) => {
  const componentDidUnmount = jest.fn();
  const el = ['div', ['div', { componentDidUnmount }, 'hi there']];
  const elTwo = ['div', 'yo there'];

  render(el, document.body)
    .then(() => {
      return render(elTwo, document.body);
    })
    .then(() => {
      expect(componentDidUnmount).toHaveBeenCalled();
      done();
    });
});

test('inject context', (done) => {
  function* el() {
    const getText = (state: any) => state;
    const text = yield context(getText);
    return ['div', text];
  }
  function elOne({ children }: any) {
    return ['div', children];
  }

  const app = (state: any) =>
    render(['div', [elOne, ['div', el]]], document.body, state);

  app('hi')
    .then(() => {
      return app('there');
    })
    .then(() => {
      expect(document.body.innerHTML).toEqual(
        '<div><div><div><div>there</div></div></div></div>',
      );
      done();
    });
});

test('redux integration', (done) => {
  const getText = (store: any) => {
    const state = store.getState();
    return state.text;
  };
  function* el() {
    const text = yield context(getText);
    return ['div', text];
  }

  const initialState = { text: '' };
  const reducer = (state: any, action: any) => {
    if (action.type === 'ANYTHING') {
      return action.payload;
    }
    return state;
  };
  const store = createStore(reducer, initialState as any);

  const app = () => render(['div', [el]], document.body, store);
  const finish = () => {
    expect(document.body.innerHTML).toEqual('<div><div>hi there</div></div>');
    done();
  };

  app().then(() => {
    reduxListener(app, store, finish);
    store.dispatch({ type: 'ANYTHING', payload: { text: 'hi there' } });
  });
});

function reduxListener(app: any, store: any, cb?: any) {
  let currentState: any = null;
  const onChange = () => {
    const previousState = currentState;
    currentState = store.getState();

    if (previousState === currentState) {
      return;
    }

    const run = app();
    if (cb) {
      run.then(cb);
    }
  };

  return store.subscribe(onChange);
}

test('cofx middleware', (done) => {
  const SELECT = 'SELECT';
  const select = (fn: any, ...args: any[]) => ({
    type: SELECT,
    fn,
    args,
  });
  const isSelect = (effect: any) => effect && effect.type === SELECT;
  function selectEffect({ fn, args }: { fn: any; args: any[] }, getState: any) {
    const state = getState();
    const result = fn(state, ...args);
    return Promise.resolve(result);
  }
  function reduxMiddleware(store: any) {
    return (next: any) => (effect: any) => {
      if (isSelect(effect)) {
        return selectEffect(effect, store.getState);
      }
      return next(effect);
    };
  }

  function* el() {
    const getText = (state: any) => state.text;
    const text = yield select(getText);
    return ['div', text];
  }

  const initialState = { text: '' };
  const reducer = (state: any, action: any) => {
    if (action.type === 'ANYTHING') {
      return action.payload;
    }
    return state;
  };
  const store = createStore(reducer, initialState as any);
  const middleware = reduxMiddleware(store);

  const r = renderFactory(middleware);
  const app = () => r(['div', [el]], document.body, store);
  const finish = () => {
    expect(document.body.innerHTML).toEqual('<div><div>yo there</div></div>');
    done();
  };

  app().then(() => {
    reduxListener(app, store, finish);
    store.dispatch({ type: 'ANYTHING', payload: { text: 'yo there' } });
  });
});
