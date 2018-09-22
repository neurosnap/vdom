import { render, createElement } from './index';
const h = createElement;

const resetDOM = () => {
  document.body.innerHTML = '';
};

describe('render', () => {
  beforeEach(() => {
    resetDOM();
  });

  it('render div to dom', () => {
    const el = h({ tag: 'div', children: 'test' });
    render(el, document.body);
    expect(document.body.innerHTML).toEqual('<div>test</div>');
  });

  it('should render recursively', () => {
    const el = h({
      tag: 'div',
      children: [
        h({
          tag: 'div',
          config: { className: 'nested' },
          children: [h({ tag: 'span', children: 'hi there' })],
        }),
      ],
    });

    render(el, document.body);
    expect(document.body.innerHTML).toEqual(
      '<div><div class="nested"><span>hi there</span></div></div>',
    );
  });

  it('should render component', () => {
    const Tmp = () => {
      return createElement({ tag: 'div', children: 'test' });
    };
    const el = h({ tag: Tmp });
    render(el, document.body);
    expect(document.body.innerHTML).toEqual('<div>test</div>');
  });

  /* it('should add style', () => {
    const el = h({
      tag: 'div',
      children: 'test',
      config: { style: { color: 'tomato' } },
    });
    render(el, document.body);
    const div = document.querySelector('div');
    console.log(div.innerHTML);
    console.log(div.style.getPropertyValue('color'));
    expect(div.style.color).toEqual('tomato');
  }); */
});
