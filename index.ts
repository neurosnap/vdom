interface Style {
  [key: string]: any;
}

type VElementType = 'tag' | 'text';
type DOMElement = HTMLElement | SVGSVGElement;
interface VElement {
  tag: string;
  text?: string | number;
  dom: DOMElement | Text;
  props: IProps;
  type: VElementType;
}

type VChildren = VElement[];

interface IProps {
  className?: string;
  style?: Style;
  children?: VChildren;
  key?: string;
  [key: string]: any;
}

interface IComponentProps {
  className?: string;
  style?: Style;
  children?: VChildren | string | number;
  [key: string]: any;
}
type IPureComponent = (props: IComponentProps) => VElement;
type IComponent = IPureComponent;

type ITag = string | IComponent;

interface ICreateElement {
  tag: ITag;
  props?: IProps;
  children?: VElement[] | string | number;
  [key: string]: any;
}
interface ICreateTextElement {
  text: string | number;
  props?: IProps;
}

interface SymbolicExpressions extends Array<any> {
  [0]: ITag;
  [1]: IProps | string | number | SymbolicExpressions;
  [2]?: string | number | SymbolicExpressions;
}

interface Obj {
  [key: string]: string | number;
}
type Value = string | number | boolean | Obj;
interface DynamicHTMLElement extends HTMLElement {
  [key: string]: any;
}
interface DynamicSVGElement extends SVGSVGElement {
  [key: string]: any;
}

type Render = any[] | VElement;
type RenderFn = () => Render;
type Fn = () => void;
type LifeCycle = Fn[];

const XLINK_NS = 'http://www.w3.org/1999/xlink';
const SVG_NS = 'http://www.w3.org/2000/svg';

const isElement = (el: any) => el && el.type;
const isTextElement = (el: any) => el && el.type === 'text';
const getKey = (node: VElement) => {
  if (node && node.props) {
    return node.props.key;
  }

  return null;
};

export const createKeyMap = (element: VElement, node: any) => {
  const { children } = element.props;
  const out: { [key: string]: any } = {};
  children.forEach((child: VElement, index: number) => {
    const key = getKey(child);
    if (!key) {
      return;
    }
    out[key] = {
      element: child,
      node: node.children[index],
    };
  });
  return out;
};

export function createTextElement({
  text,
  props = {},
}: ICreateTextElement): VElement {
  return {
    type: 'text',
    tag: 'text',
    text,
    props,
    dom: null,
  };
}

export function createElement({
  tag,
  props = {},
  children = [],
}: ICreateElement): VElement {
  if (typeof tag === 'function') {
    return tag({ ...props, children });
  }

  if (typeof children === 'string' || typeof children === 'number') {
    return createElement({
      tag,
      props,
      children: [createTextElement({ text: children })],
    });
  }

  return {
    type: 'tag',
    tag,
    dom: null,
    props: {
      ...props,
      children,
    },
  };
}

function transformChildrenToElements(
  el: string | number | SymbolicExpressions[],
): VElement[] {
  if (Array.isArray(el)) {
    if (typeof el[0] === 'string') {
      return [transformSExpToElement(el as SymbolicExpressions)];
    } else {
      return el.map(transformSExpToElement);
    }
  }

  const text: string | number = el;
  return [createTextElement({ text })];
}

function transformSExpToElement(
  el: SymbolicExpressions | string | number | VElement,
): VElement {
  if (!Array.isArray(el)) {
    return el as VElement;
  }

  let ele = null;
  if (el.length === 1) {
    return createElement({ tag: el[0] });
  } else if (el.length === 2) {
    const children = transformChildrenToElements(el[1] as SymbolicExpressions);
    ele = createElement({ tag: el[0], children });
  } else if (el.length === 3) {
    const children = transformChildrenToElements(el[2]);
    ele = createElement({ tag: el[0], props: el[1] as IProps, children });
  }

  if (Array.isArray(ele)) {
    return transformSExpToElement(ele);
  }

  return ele;
}

function componentDidMount(
  fn: (dom: DOMElement) => void,
  lifecycle: LifeCycle,
  dom: DOMElement,
) {
  if (!fn) {
    return;
  }

  lifecycle.push(() => {
    fn(dom);
  });
}

function componentDidUpdate(
  fn: (p: IProps) => void,
  lifecycle: LifeCycle,
  lastProps: IProps,
) {
  if (!fn) {
    return;
  }

  lifecycle.push(() => {
    fn(lastProps);
  });
}

function componentDidUnmount(fn: () => void, lifecycle: LifeCycle) {
  if (!fn) {
    return;
  }

  lifecycle.push(() => {
    fn();
  });
}

function updateDomProps(
  node: DOMElement,
  curProps: any,
  nextProps: any,
  lifecycle: LifeCycle,
  isRecycled: boolean,
) {
  const props = { ...curProps, ...nextProps };
  for (const name in props) {
    updateProp(node, name, curProps[name], nextProps[name]);
  }

  if (isRecycled) {
    componentDidUpdate(nextProps.componentDidUpdate, lifecycle, curProps);
  } else {
    componentDidMount(props.componentDidMount, lifecycle, node);
  }
}

const eventProxy = (event: any) =>
  event.currentTarget.events[event.type](event);

function updateProp(
  node: DynamicHTMLElement | DynamicSVGElement,
  name: string,
  curValue: Value,
  nextValue: Value,
) {
  const ignoreAttributes = ['key', 'children'];
  const mustSetAttribute = ['list', 'draggable', 'spellcheck', 'translate'];

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
    const isEmpty =
      nextValue == null ||
      nextValue === false ||
      typeof nextValue === 'undefined';
    const ns = name.replace('xlink:', '');
    const isXLink = name !== ns;

    if (isXLink) {
      if (isEmpty) {
        node.removeAttributeNS(XLINK_NS, ns);
      } else {
        node.setAttributeNS(XLINK_NS, name, `${nextValue}`);
      }
    } else if (name in node && mustSetAttribute.indexOf(name) === -1) {
      node[name] = nextValue == null ? '' : `${nextValue}`;
      if (isEmpty) {
        node.removeAttribute(name);
      }
    } else {
      if (isEmpty) {
        node.removeAttribute(name);
      } else {
        node.setAttribute(name, `${nextValue}`);
      }
    }
  }
}

function updateStyles(node: DOMElement, curStyle: Obj, nextStyle: Obj) {
  const styles = { ...curStyle, ...nextStyle };
  Object.keys(styles).forEach((key) => {
    const value = styles[key] || '';
    node.style[key as any] = value as any;
  });
}

function createDomElement(element: VElement): DOMElement | Text {
  if (isTextElement(element)) {
    return document.createTextNode(`${element.text}`);
  }

  if (element.tag === 'svg') {
    return document.createElementNS(SVG_NS, 'svg');
  }

  return document.createElement(element.tag);
}

function createDom(element: VElement, lifecycle: LifeCycle): DOMElement | Text {
  const { props } = element;

  const domNode = createDomElement(element);
  element.dom = domNode;

  if (isTextElement(element)) {
    return domNode;
  }

  updateDomProps(domNode as DOMElement, {}, props, lifecycle, false);

  if (props.children) {
    const children = props.children as VElement[];
    children.forEach((child) => {
      domNode.appendChild(createDom(child, lifecycle));
    });
  }

  return domNode;
}

function patchDom(
  curElement: VElement,
  nextElement: VElement,
  parent: DOMElement,
  node: DOMElement,
  lifecycle: LifeCycle,
): DOMElement {
  if (curElement && !nextElement) {
    parent.removeChild(node);
    componentDidUnmount(curElement.props.componentDidUnmount, lifecycle);
    return;
  }

  if ((!curElement && nextElement) || !node) {
    parent.appendChild(createDom(nextElement, lifecycle));
    return;
  }

  if (curElement === nextElement) {
  } else if (isTextElement(curElement) && isTextElement(nextElement)) {
    node.nodeValue = `${nextElement.text}`;
  } else if (!isTextElement(curElement) && !isTextElement(nextElement)) {
    const curChildren = curElement.props.children as VElement[];
    const nextChildren = nextElement.props.children as VElement[];
    const keyMap = createKeyMap(curElement, node);

    if (nextChildren.length < curChildren.length) {
      // previous children is larger than new children
      const nextKeyMap = createKeyMap(nextElement, node);
      curChildren.forEach((curChild, index) => {
        const curKey = getKey(curChild);
        const nextChild = nextKeyMap[curKey];
        if (!nextChild) {
          patchDom(
            curChild,
            nextChild,
            node,
            node.children[index] as DOMElement,
            lifecycle,
          );
        }
      });
    }

    let curIndex = 0;
    nextChildren.forEach((nextChild, index) => {
      const nextKey = getKey(nextChild);
      const curKey = getKey(curChildren[index]);
      const curChild = keyMap[nextKey];
      if (curChild) {
        if (node.children.length > curIndex) {
          node.insertBefore(curChild.node, node.children[curIndex]);
          patchDom(
            curChild.element,
            nextChild,
            node,
            node.children[curIndex] as DOMElement,
            lifecycle,
          );
        }
      } else if (curKey) {
        const domNode = createDom(nextChild, lifecycle);
        node.insertBefore(domNode, node.children[curIndex]);
        curIndex += 1;
      } else if (node.children.length > curIndex) {
        patchDom(
          curChildren[index],
          nextChild,
          node,
          node.children[curIndex] as DOMElement,
          lifecycle,
        );
      } else {
        patchDom(
          curChildren[index],
          nextChild,
          node,
          node.firstChild as DOMElement,
          lifecycle,
        );
      }

      curIndex += 1;
    });
  } else {
    const domNode = createDom(nextElement, lifecycle);
    parent.insertBefore(domNode, node);
    parent.removeChild(node);
    componentDidUnmount(curElement.props.componentDidUnmount, lifecycle);
  }

  nextElement.dom = node;

  if (!isTextElement(nextElement)) {
    updateDomProps(node, curElement.props, nextElement.props, lifecycle, true);
  }

  return node;
}

export function renderFactory() {
  let curElement: VElement = null;
  return (fn: RenderFn | Render, nextNode: DOMElement) => {
    const el = typeof fn === 'function' ? fn() : fn;
    const nextElement = isElement(el)
      ? (el as VElement)
      : transformSExpToElement(el as SymbolicExpressions);

    // console.log(JSON.stringify(nextElement, null, 2));
    patch(curElement, nextElement, nextNode);
    curElement = nextElement;
  };
}

export const render = renderFactory();

export function patch(
  curElement: VElement,
  nextElement: VElement,
  root: DOMElement,
) {
  const lifecycle: LifeCycle = [];
  const node = root ? root.firstChild : null;

  patchDom(curElement, nextElement, root, node as DOMElement, lifecycle);

  lifecycle.forEach((fn) => {
    fn();
  });

  return node;
}
