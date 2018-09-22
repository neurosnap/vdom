console.log('this is a node library!');

interface ElementConfig {
  className?: string;
  style?: Style;
  [key: string]: any;
}

type VChildren = VElement[] | string;

interface IProps {
  children: VChildren;
}

interface Style {
  [key: string]: any;
}

interface VElement {
  tag: string;
  className: string;
  style: Style;
  dom: HTMLElement;
  props: IProps;
}

/* interface IClassComponent {
  render(): VElement;
} */
type IPureComponent = (config: ElementConfig) => VElement;
type IComponent = IPureComponent;

const defaultConfig = {
  className: '',
  style: {},
};

interface ICreateElement {
  tag: string | IComponent;
  config?: ElementConfig;
  children?: VChildren;
}

export function createElement({
  tag,
  config = defaultConfig,
  children,
}: ICreateElement): VElement {
  if (typeof tag === 'function') {
    return tag(config);
  }

  const { className, style } = config;
  return {
    tag,
    style,
    className,
    dom: null,
    props: {
      children,
    },
  };
}

/* const isComponent = (element: VElement) => typeof element.tag === 'function';

function update(prevElement: VElement, nextElement: VElement) {
  if (prevElement.tag === nextElement.tag) {
    updateElement(prevElement, nextElement);
  } else {
  }
} */

/* function updateElement(prevElement: VElement, nextElement: VElement) {
  const dom = prevElement.dom;
  nextElement.dom = dom;

  const nextStyle = nextElement.style;
  if (prevElement.style !== nextStyle) {
    Object.keys(nextStyle).forEach((s) => (dom.style[s as any] = nextStyle[s]));
  }
} */

export function render(element: VElement, node: HTMLElement) {
  const { tag, className, props, style } = element;
  const domNode = document.createElement(tag);

  if (className) {
    domNode.className = className;
  }

  if (props.children) {
    if (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    ) {
      const children = document.createTextNode(props.children);
      domNode.appendChild(children);
    } else {
      props.children.forEach((child) => {
        render(child, domNode);
      });
    }
  }

  if (style) {
    Object.keys(style).forEach((sKey) => {
      domNode.style[sKey as any] = style[sKey as any];
    });
  }

  node.appendChild(domNode);
}
