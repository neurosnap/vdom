type VChildren = VElement[];

interface IProps {
  className?: string;
  style?: Style;
  children?: VChildren;
  [key: string]: any;
}

interface Style {
  [key: string]: any;
}

type VElementType = 'tag' | 'text';

interface VElement {
  tag: string;
  dom: HTMLElement | Text;
  props: IProps;
  type: VElementType;
}

type IPureComponent = (props: IProps) => VElement;
type IComponent = IPureComponent;

const defaultProps = {
  className: '',
  style: {},
};
type ITag = string | IComponent;

interface ICreateElement {
  tag: ITag;
  props?: IProps;
  children?: VChildren;
}

export function createElement({
  tag,
  props = defaultProps,
  children,
}: ICreateElement): VElement {
  if (typeof tag === 'function') {
    return tag({ ...props, children });
  }

  const { className, style } = props;
  return {
    type: children ? 'tag' : 'text',
    tag,
    dom: null,
    props: {
      children,
      style,
      className,
    },
  };
}

type TextNode = string | number;
interface ElementArr
  extends Array<
      [ITag, IProps, TextNode | ElementArr] | [ITag, TextNode | ElementArr]
    > {}

function convertChildrenToElement(el: TextNode | ElementArr[]): VElement {
  const children =
    typeof el === 'string'
      ? [convertArrToElement([el as any])]
      : (el as any).map(convertArrToElement);
  return children;
}

function convertArrToElement(el: ElementArr): VElement {
  if (!Array.isArray(el)) {
    return el;
  }

  let ele = null;
  if (el.length === 1) {
    return createElement({ tag: el[0] } as any);
  } else if (el.length === 2) {
    const children = convertChildrenToElement(el[1] as any);
    ele = createElement({ tag: el[0], children } as any);
  } else if (el.length === 3) {
    const children = convertChildrenToElement(el[2] as any);
    ele = createElement({ tag: el[0], props: el[1], children } as any);
  }

  if (Array.isArray(ele)) {
    return convertArrToElement(ele);
  }

  return ele;
}

function renderFn() {
  let curElement: VElement = null;
  return (fn: () => ElementArr, nextNode: HTMLElement) => {
    const el = typeof fn === 'function' ? fn() : fn;
    const nextElement = convertArrToElement(el);
    mount(curElement, nextElement, nextNode);
    curElement = nextElement;
  };
}

export const render = renderFn();

const isTextNode = (node: VElement) => node.type === 'text';

function updateNodeProperties(
  node: HTMLElement,
  curProps: any,
  nextProps: any,
) {
  const { className, style } = nextProps;
  if (className) {
    node.className = className;
  }

  if (style) {
    const styles = { ...curProps.style, ...style };
    Object.keys(styles).forEach((key) => {
      const value = style[key] || '';
      node.style[key as any] = value;
    });
  }
}

function create(element: VElement, node: HTMLElement): HTMLElement | Text {
  const { tag, props } = element;

  if (isTextNode(element)) {
    const domNode = document.createTextNode(tag);
    node.appendChild(domNode);
    element.dom = domNode;
    return domNode;
  }

  const domNode = document.createElement(tag);
  updateNodeProperties(domNode, {}, props);

  if (props.children) {
    const children = props.children as VElement[];
    children.forEach((child) => {
      create(child, domNode);
    });
  }

  element.dom = domNode;

  // node.innerHTML = '';
  node.appendChild(domNode);

  return domNode;
}

function update(
  curElement: VElement,
  nextElement: VElement,
  parent: HTMLElement,
  node: HTMLElement,
): HTMLElement {
  console.log(curElement, nextElement);
  if (curElement === nextElement) {
    console.log('EQUAL');
  } else if (isTextNode(curElement) && isTextNode(nextElement)) {
    console.log('TEXTNODE');
    node.nodeValue = `${nextElement.tag}`;
  } else if (!isTextNode(curElement) && !isTextNode(nextElement)) {
    console.log('CHILDREN');
    const curChildren = curElement.props.children as VElement[];
    const nextChildren = nextElement.props.children as VElement[];
    console.log(curChildren.length === nextChildren.length);
    if (curChildren.length === nextChildren.length) {
      nextChildren.forEach((nextChild, index) => {
        update(curChildren[index], nextChild, node, node.firstChild as any);
      });
    }
  } else if (isTextNode(curElement) && !isTextNode(nextElement)) {
    console.log('NEXT ELEMENT NOT TEXT');
    const newNode = document.createElement('div');
    create(nextElement, newNode);
    parent.insertBefore(newNode.firstChild, node);
    parent.removeChild(node);
  }

  if (!isTextNode(nextElement)) {
    updateNodeProperties(node, curElement.props, nextElement.props);
  }
  nextElement.dom = node;
  return node;
}

export function mount(
  curElement: VElement,
  nextElement: VElement,
  node: HTMLElement,
) {
  if (!curElement) {
    return create(nextElement, node);
  }

  return update(curElement, nextElement, node, node.firstChild as any);
}
