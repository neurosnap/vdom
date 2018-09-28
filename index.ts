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
  [key: string]: any;
}

export function createElement({
  tag,
  props = defaultProps,
  children,
}: ICreateElement): VElement {
  if (typeof tag === 'function') {
    return tag({ ...props, children });
  }

  return {
    type: children ? 'tag' : 'text',
    tag,
    dom: null,
    props: {
      children,
      ...props,
    },
  };
}

type TextNode = string | number;
interface ElementArr
  extends Array<
      [ITag, IProps, TextNode | ElementArr] | [ITag, TextNode | ElementArr]
    > {}

function convertChildrenToElement(el: TextNode | ElementArr[]): VElement[] {
  if (Array.isArray(el)) {
    if (Array.isArray(el[0])) {
      return el.map(convertArrToElement);
    } else {
      return [convertArrToElement(el as any)];
    }
  }

  return [convertArrToElement([el as any])];
}

function convertArrToElement(el: ElementArr): VElement {
  if (!Array.isArray(el)) {
    return el;
  }

  let ele = null;
  if (el.length === 1) {
    if (typeof el[0] !== 'string') {
      return el[0] as any;
    }
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
  const props = { ...curProps, ...nextProps };
  for (const name in props) {
    updateProperty(node, name, curProps[name], nextProps[name]);
  }
}

interface Obj {
  [key: string]: string | number;
}
type Value = string | number | boolean | Obj;
interface DynamicHTMLElement extends HTMLElement {
  [key: string]: any;
}

const eventProxy = (event: any) =>
  event.currentTarget.events[event.type](event);

const ignoreAttributes = ['key', 'children'];
const mustSetAttribute = ['list', 'draggable', 'spellcheck', 'translate'];

function updateProperty(
  node: DynamicHTMLElement,
  name: string,
  curValue: Value,
  nextValue: Value,
) {
  if (ignoreAttributes.indexOf(name) >= 0) {
    return;
  }

  if (curValue === nextValue) {
    return;
  }

  if (name === 'style') {
    updateStyles(node, curValue as Obj, nextValue as Obj);
  } else if (name[0] === 'o' && name[1] === 'n') {
    if (!node.events) {
      node.events = {};
    }

    const eventName = name.toLocaleLowerCase();
    const eventNameType = eventName.slice(2);
    node.events[eventNameType] = nextValue;

    if (!nextValue) {
      node.removeEventListener(eventNameType, eventProxy);
    } else if (!curValue) {
      node.addEventListener(eventNameType, eventProxy);
    }
  } else {
    const nullOrFalse = nextValue == null || nextValue === false;
    if (mustSetAttribute.indexOf(name) >= 0) {
      if (nullOrFalse) {
        node.removeAttribute(name);
      } else {
        node.addAttribute(name, nextValue);
      }
    } else {
      node[name] = nextValue == null ? '' : nextValue;
      if (nullOrFalse) {
        node.removeAttribute(name);
      }
    }
  }
}

function updateStyles(node: HTMLElement, curStyle: Obj, nextStyle: Obj) {
  const styles = { ...curStyle, ...nextStyle };
  Object.keys(styles).forEach((key) => {
    const value = styles[key] || '';
    node.style[key as any] = value as any;
  });
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
  node.appendChild(domNode);
  return domNode;
}

function update(
  curElement: VElement,
  nextElement: VElement,
  parent: HTMLElement,
  node: HTMLElement,
): HTMLElement {
  if (curElement && !nextElement) {
    parent.removeChild(node);
  }

  if (!curElement && nextElement) {
    create(nextElement, parent);
    return;
  }

  if (curElement === nextElement) {
    console.log('EQUAL');
  } else if (isTextNode(curElement) && isTextNode(nextElement)) {
    console.log('TEXTNODE');
    node.nodeValue = `${nextElement.tag}`;
  } else if (!isTextNode(curElement) && !isTextNode(nextElement)) {
    console.log('CHILDREN');
    const curChildren = curElement.props.children as VElement[];
    const nextChildren = nextElement.props.children as VElement[];
    console.log(curChildren.length, nextChildren.length);
    if (nextChildren.length >= curChildren.length) {
      nextChildren.forEach((nextChild, index) => {
        update(curChildren[index], nextChild, node, node.firstChild as any);
      });
    } else {
      curChildren.forEach((curChild, index) => {
        update(curChild, nextChildren[index], node, node.firstChild as any);
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
